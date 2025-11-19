"use server";

import { z } from "zod";

// Define the input schema for the agent based on the provided I/O schema.
// Input Schema: {
//   "input": "string"
// }
const agentInputSchema = z.object({
  input: z.string().min(1, "Input is required."),
});

// Define the output schema for the agent based on the provided I/O schema.
// Output Schema: {
//   "result": "The processed result from the agent"
// }
// We don't strictly need to validate the output on the server side for this example,
// but it's good practice for more complex scenarios.

const AGENT_ID = "9fca8d06-ce86-4d03-97fa-6bda61bc2e02";

export async function runAgent(inputData: z.infer<typeof agentInputSchema>) {
  // Validate the input data against the schema.
  const validation = agentInputSchema.safeParse(inputData);
  if (!validation.success) {
    const errors = validation.error.errors.map((err) => err.message);
    return { success: false, error: `Invalid input: ${errors.join(", ")}` };
  }

  // Retrieve sensitive API key from environment variables (NOT NEXT_PUBLIC_).
  const API_KEY = process.env.CROSSNODE_API_KEY;
  // Retrieve API URL from environment variables.
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Ensure environment variables are set.
  if (!API_URL) {
    console.error("NEXT_PUBLIC_API_URL is not set.");
    return { success: false, error: "Server API endpoint is not configured." };
  }
  if (!API_KEY) {
    console.error("CROSSNODE_API_KEY is not set.");
    return { success: false, error: "Server API key is not configured." };
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/agents/${AGENT_ID}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      // The agent expects the input within an 'input' field in the request body.
      body: JSON.stringify({ input: validation.data.input }),
    });

    // Handle non-OK HTTP responses.
    if (!response.ok) {
      let errorDetails = "Unknown error";
      try {
        const errorData = await response.json();
        errorDetails = errorData.detail || JSON.stringify(errorData);
      } catch (parseError) {
        errorDetails = await response.text(); // Fallback to text if JSON parsing fails
      }
      console.error(`Agent run failed with status ${response.status}: ${errorDetails}`);
      throw new Error(`Agent run failed: ${errorDetails}`);
    }

    // Parse the successful response.
    const result = await response.json();

    // Assuming the agent's output schema is { "result": "..." }
    // We return the 'result' field from the agent's output.
    if (typeof result.result !== 'string') {
        console.error("Agent returned unexpected result format.", result);
        throw new Error("Agent returned data in an unexpected format.");
    }

    return { success: true, data: { result: result.result } };
  } catch (error) {
    // Handle network errors or errors thrown during response processing.
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    console.error("Error during agent execution:", error);
    return { success: false, error: errorMessage };
  }
}
