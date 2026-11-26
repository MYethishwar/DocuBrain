import type { AskResponse } from "../types/chat";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** POST /ask — send a question to the DocuBrain API. */
export async function askQuestion(question: string): Promise<AskResponse> {
  if (!API_URL) {
    throw new ApiError("VITE_API_URL is not set. Add it to frontend/.env and restart the dev server.", 0);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/ask`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
    });
  } catch {
    throw new ApiError("Can't reach the DocuBrain API. Check your connection and try again.", 0);
  }

  if (!response.ok) {
    throw new ApiError(friendlyMessage(response.status), response.status);
  }
  return (await response.json()) as AskResponse;
}

function friendlyMessage(status: number): string {
  switch (status) {
    case 422:
      return "That question couldn't be sent. Keep it under 1,000 characters.";
    case 429:
      return "The model's usage limit has been reached for now. Please try again later.";
    case 500:
      return "The server isn't configured correctly. Check the backend logs.";
    case 502:
      return "The knowledge base didn't respond. Please try again in a moment.";
    default:
      return `Something went wrong (error ${status}). Please try again.`;
  }
}
