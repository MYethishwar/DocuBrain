export type Role = "user" | "assistant";

/** ok = normal answer, blocked = guardrail intervened, error = request failed */
export type MessageStatus = "ok" | "blocked" | "error";

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  status: MessageStatus;
  sources: string[];
}

/** Response body of POST /ask on the DocuBrain API. */
export interface AskResponse {
  question: string;
  answer: string;
  guardrail_action: "NONE" | "INTERVENED";
  sources: string[];
}
