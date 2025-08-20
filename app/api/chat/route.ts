// /app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  Together,
  type ChatCompletionMessageParam, // Import this if available from the SDK
  type ChatCompletionChunk,        // Import this for stream chunks
} from 'together-ai';

// If ChatCompletionMessageParam or ChatCompletionChunk are not directly exported,
// we might need to define them based on SDK usage or use broader types.
// For now, let's assume they exist or we define similar structures.

interface ClientMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  data?: {
    fileDataUrl?: string;
    fileName?: string;
    fileType?: string;
  };
}

// This type should align with what `together-ai` SDK expects for `messages`
// It's often ChatCompletionMessageParam from OpenAI-compatible SDKs
type SdkMessageParam = ChatCompletionMessageParam; // Use the SDK's type

export const maxDuration = 60;
const apiKey = process.env.TOGETHER_API_KEY;
const systemMessageContent = "You are Neurox, a helpful and friendly AI assistant. Provide concise and accurate answers. If an image is mentioned, acknowledge it appropriately based on the context provided by its name.";
const API_CALL_TIMEOUT_MS = 55000;

export async function POST(request: NextRequest) {
  console.log(`[${new Date().toISOString()}] POST /api/chat (Together AI) - Request received.`);
  const requestProcessingStartTime = Date.now();

  if (!apiKey) {
    console.error(`[${new Date().toISOString()}] TOGETHER_API_KEY not configured.`);
    return new NextResponse("API key not configured", { status: 500 });
  }

  const abortController = new AbortController();
  let timeoutId: NodeJS.Timeout | null = null;

  timeoutId = setTimeout(() => {
    console.warn(
      `[${new Date().toISOString()}] Together AI API call explicitly timed out after ${API_CALL_TIMEOUT_MS / 1000}s. Aborting request.`
    );
    abortController.abort("API Call Timeout");
  }, API_CALL_TIMEOUT_MS);

  try {
    const { messages: clientMessages }: { messages: ClientMessage[] } = await request.json();

    if (!clientMessages || !Array.isArray(clientMessages) || clientMessages.length === 0) {
      if (timeoutId) clearTimeout(timeoutId);
      console.warn(`[${new Date().toISOString()}] Invalid request body: 'messages' array is required and cannot be empty.`);
      return new NextResponse("Invalid request body: 'messages' array is required and cannot be empty.", { status: 400 });
    }

    const preparedMessages: SdkMessageParam[] = [
      { role: 'system', content: systemMessageContent },
    ];

    for (const message of clientMessages) {
      if (!message.content && !message.data?.fileDataUrl) continue;

      let currentSdkMessage: SdkMessageParam;

      if (message.role === 'user' && message.data?.fileDataUrl && message.data.fileName) {
        const { fileDataUrl, fileName, fileType } = message.data;
        console.log(`[${new Date().toISOString()}] User message includes file: ${fileName} (Type: ${fileType})`);

        const userText = message.content || "";
        const fileAcknowledgement = `\n[User has attached an image: "${fileName}". Please acknowledge this attachment.]`;
        const combinedText = (userText.trim() + " " + fileAcknowledgement.trim()).trim();

        if (fileType?.startsWith('image/')) {
          // This is how you'd structure for multimodal if the SDK/model supports it
          // For now, DeepSeek-R1 is text-only, so we send combinedText.
          // If it were multimodal and supported OpenAI's format:
          // currentSdkMessage = {
          //   role: 'user',
          //   content: [
          //     { type: 'text', text: combinedText },
          //     // { type: 'image_url', image_url: { url: fileDataUrl } } // For multimodal
          //   ],
          // };
          // For text-only:
          currentSdkMessage = { role: 'user', content: combinedText };
        } else {
          // Non-image files, just append text
          currentSdkMessage = { role: 'user', content: combinedText };
        }
      } else {
        currentSdkMessage = {
          role: message.role as 'user' | 'assistant', // system messages are already handled
          content: message.content,
        };
      }
      preparedMessages.push(currentSdkMessage);
    }

    const client = new Together({ apiKey: apiKey });

    console.log(`[${new Date().toISOString()}] Making streaming request to Together AI...`);
    // console.log("Prepared Messages:", JSON.stringify(preparedMessages, null, 2)); // For debugging
    const fetchStartTime = Date.now();

    const streamResponse = await client.chat.completions.create(
      {
        model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
        messages: preparedMessages, // This should now match the SDK's expected type
        stream: true,
      },
      { signal: abortController.signal }
    );

    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null; 

    const fetchEndTime = Date.now();
    console.log(`[${new Date().toISOString()}] Together AI stream request initiated in ${fetchEndTime - fetchStartTime}ms.`);

    const readableStream = new ReadableStream<Uint8Array>({ // Explicitly type the stream
      async start(controller) {
        const encoder = new TextEncoder();
        let streamClosed = false;

        const closeStream = () => {
            if (!streamClosed) {
                try { controller.close(); } catch (e) { /* ignore if already closed */ }
                streamClosed = true;
                const totalProcessingTime = Date.now() - requestProcessingStartTime;
                console.log(`[${new Date().toISOString()}] Together AI stream finished. Total request processing time: ${totalProcessingTime}ms.`);
            }
        };

        try {
          // Asserting the type of chunk if ChatCompletionChunk is correctly imported/defined
          for await (const chunk of streamResponse as AsyncIterable<ChatCompletionChunk>) {
            const contentDelta = chunk.choices?.[0]?.delta?.content;

            if (contentDelta) {
              controller.enqueue(encoder.encode(contentDelta));
            }
            if (chunk.choices?.[0]?.finish_reason) {
                console.log(`[${new Date().toISOString()}] Stream finished with reason: ${chunk.choices[0].finish_reason}`);
                break; 
            }
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.warn(`[${new Date().toISOString()}] Stream aborted.`);
          } else {
            console.error(`[${new Date().toISOString()}] Error while reading from Together AI stream:`, error);
            try { controller.error(error); } catch (e) { /* ignore if already errored */ }
          }
        } finally {
          closeStream();
        }
      },
      cancel(reason) {
        console.warn(`[${new Date().toISOString()}] Client disconnected or cancelled the stream. Reason:`, reason);
        if (abortController && !abortController.signal.aborted) {
            abortController.abort("Client cancelled stream");
        }
      }
    });

    return new Response(readableStream, {
      headers: { 
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache, no-transform",
      },
    });

  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId); 

    if (error.name === 'AbortError' || (error instanceof Error && error.message.includes("The operation was aborted"))) {
      console.error(`[${new Date().toISOString()}] Together AI API call aborted. Error:`, error.message);
      return new NextResponse("The request to the AI service timed out.", { status: 504 });
    }

    const totalProcessingTimeOnError = Date.now() - requestProcessingStartTime;
    console.error(`[${new Date().toISOString()}] Error in Together AI API call handler after ${totalProcessingTimeOnError}ms:`, error);

    if (error instanceof Together.APIError) {
        // Access properties like error.status, error.message, error.code, error.request, error.response
        console.error(`[${new Date().toISOString()}] Together SDK APIError: Status ${error.status}, Message: ${error.message}, Code: ${error.code}`);
        return new NextResponse(
          `AI Service Error: ${error.message || "An error occurred with the AI service."}`,
          { status: error.status || 500 }
        );
    }
    return new NextResponse(`Error processing request: ${error instanceof Error ? error.message : "Unknown server error"}`, { status: 500 });
  }
}

export async function OPTIONS() {
  // ... (OPTIONS handler remains the same)
  const response = new NextResponse(null);
  response.headers.set("Allow", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Origin", "*"); // Be more specific in production
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}