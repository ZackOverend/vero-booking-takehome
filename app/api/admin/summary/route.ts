import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";
import { streamText } from "ai";
import { getAiEnabled } from "@/lib/actions/settings";
import { getOllamaClient, OLLAMA_MODEL } from "@/lib/ai/client";

const SYSTEM_PROMPT = `You are a clinical documentation assistant for an outpatient physician in Toronto, Canada. Write one sentence summarising a patient's appointment request in plain clinical language a physician would read when scanning their day's bookings.

Rules:
- One sentence only, maximum 25 words
- Plain clinical language — no jargon, no diagnosis
- Third person: begin with "Patient presents with", "Patient requesting", or "Patient reports"
- Do not include the patient's name
- Do not add information not stated in the patient's text
- Do not make a diagnosis or suggest treatment
- End with a period`;

function isAuthorized(sessionCookie: string | undefined): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !sessionCookie) return false;
  try {
    const a = Buffer.from(sessionCookie);
    const b = Buffer.from(password);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;

  if (!isAuthorized(session)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const aiEnabled = await getAiEnabled();
  if (!aiEnabled) {
    return new Response("AI features are disabled", { status: 503 });
  }

  const { reason, notes, specialty } = await request.json() as {
    reason: string;
    notes: string | null;
    specialty: string;
  };

  const ollama = getOllamaClient();

  const result = streamText({
    model: ollama(OLLAMA_MODEL),
    system: SYSTEM_PROMPT,
    prompt: `Physician specialty: ${specialty}\nReason for visit: ${reason}\nAdditional notes: ${notes ?? "None"}`,
    maxOutputTokens: 60,
    temperature: 0.3,
  });

  return result.toTextStreamResponse();
}
