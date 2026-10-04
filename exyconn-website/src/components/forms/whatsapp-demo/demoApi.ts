import type { DemoAccess } from "./whatsapp-demo.types";

/** A refused step: the message is the visitor's to read; `captcha` asks for a new question. */
export class DemoStepError extends Error {
  constructor(
    message: string,
    readonly captcha: boolean
  ) {
    super(message);
    this.name = "DemoStepError";
  }
}

async function post<T>(path: string, body: Record<string, string>): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!res.ok) {
    throw new DemoStepError(
      payload.message ?? "Something went wrong. Please try again.",
      payload.error === "captcha"
    );
  }
  return payload;
}

/** Step one: files the lead and has the code emailed (see pages/api/whatsapp-demo/code.ts). */
export async function sendDemoCode(fields: Record<string, string>): Promise<void> {
  await post("/api/whatsapp-demo/code", fields);
}

/** Step two: the emailed code, exchanged for the demo pass. */
export async function checkDemoCode(email: string, code: string): Promise<DemoAccess> {
  const signIn = await post<{ token: string; demoUrl: string; visitor: { name: string } }>(
    "/api/whatsapp-demo/verify",
    { email, code }
  );
  return { token: signIn.token, demoUrl: signIn.demoUrl, name: signIn.visitor.name };
}
