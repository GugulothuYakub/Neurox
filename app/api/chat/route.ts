import { NextRequest } from "next/server";
import { Readable } from 'stream';
import { Together } from 'together-ai'; // Ensure you have the Together package installed

export const maxDuration = 30;

// Ensure TOGETHER_API_KEY is set in your .env.local file
const apiKey = process.env.TOGETHER_API_KEY;

export async function POST(request: NextRequest) {
  if (!apiKey) {
    return new Response("API key not configured", { status: 500 });
  }

  try {
    const { messages } = await request.json();

    // Check if messages are provided and is an array
    if (!messages || !Array.isArray(messages)) {
        return new Response("Invalid request body: 'messages' array is required.", { status: 400 });
    }

    // Define the system message (optional but recommended)
    const systemMessage = "You are a helpful AI assistant specializing in code. Respond accurately and concisely.";

    // Prepare messages for the API call
    const preparedMessages = [
        { role: 'system', content: systemMessage },
        ...messages.map(message => ({
            role: message.role,
            content: message.content
        })), // Append user messages
    ];

    // Initialize the Together client
    const client = new Together({
      apiKey: apiKey,
    });

    // Make a request to the Together API
    const response = await client.chat.completions.create({
      model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
      messages: preparedMessages,
    });

    // Log the response for debugging
    console.log("API Response:", response);

    // Check if response and choices are defined
    if (!response.choices || response.choices.length === 0 || !response.choices[0].message) {
      return new Response("Error: No content in response", { status: 500 });
    }

    const content = response.choices[0].message.content;

    // Convert the response to a ReadableStream
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(content ?? ""));
        controller.close();
      }
    });

    // Respond with the stream
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });

  } catch (error) {
    console.error("Error in Together API call:", error);
    return new Response(`Error: ${error instanceof Error ? error.message : "Unknown error"}`, { status: 500 });
  }
}

// Handle CORS preflight requests (OPTIONS)
export async function OPTIONS() {
  const response = new Response(null); // Use null body for OPTIONS
  response.headers.set('Allow', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Origin', '*'); // Be more specific in production
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
