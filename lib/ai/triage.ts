import { generateText } from "ai";
import { getOllamaClient, OLLAMA_MODEL } from "./client";
import type { TriageLevel } from "@/lib/db/schema";

const EMERGENCY_KEYWORDS = [
  "chest pain",
  "can't breathe",
  "cannot breathe",
  "difficulty breathing",
  "shortness of breath",
  "stroke",
  "heart attack",
  "unconscious",
  "suicide",
  "suicidal",
  "want to die",
  "kill myself",
  "overdose",
  "severe bleeding",
  "not breathing",
  "collapsed",
  "seizure",
  "anaphylaxis",
  "allergic reaction",
];

// safety_flag is intentionally excluded, it is set by the keyword gate above, never by the AI
const VALID_LEVELS = new Set(["urgent", "soon", "routine", "administrative"]);

const SYSTEM_PROMPT = `You are a medical booking assistant for an outpatient clinic in Toronto, Canada. Classify the urgency of a patient's appointment request based on their stated reason for visit.

Categories:
urgent — Acute, new, or rapidly worsening symptom requiring priority attention. Examples: new chest discomfort without emergency features, sudden vision or hearing change, acute infection with systemic symptoms, significant change in a chronic condition, unexplained weight loss.
soon — Needs attention within days to weeks. Not immediately dangerous but should not wait months. Examples: worsening known condition, new non-acute symptom, time-sensitive follow-up, mental health concern needing prompt attention.
routine — Stable scheduled care. Examples: chronic disease management, annual physical, preventive care, stable mental health follow-up, non-urgent test results review.
administrative — No clinical assessment required. Examples: prescription renewal, sick note, referral letter, insurance form, lab results already reviewed.

Examples:
Reason: "I've had a fever for 3 days and my throat is getting worse" → soon
Reason: "Need my metformin refill" → administrative
Reason: "Annual physical" → routine
Reason: "New lump I noticed last week, growing quickly" → urgent
Reason: "Anxiety has been much worse since last month, hard to function" → soon
Reason: "Blood pressure follow-up" → routine

Rules:
- Reply with ONLY one word: urgent, soon, routine, or administrative
- No explanation, punctuation, or other text
- When uncertain between two adjacent tiers, choose the higher urgency
- Base your decision only on the text provided — do not infer beyond it`;

export function isSafetyFlag(text: string): boolean {
  const lower = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function classifyTriage(
  reason: string,
  notes: string | null,
): Promise<TriageLevel | null> {
  if (isSafetyFlag(reason) || isSafetyFlag(notes ?? "")) {
    return "safety_flag";
  }

  try {
    const ollama = getOllamaClient();
    const { text } = await generateText({
      model: ollama(OLLAMA_MODEL),
      system: SYSTEM_PROMPT,
      prompt: `Reason for visit: ${reason}\nAdditional notes: ${notes ?? "None"}`,
      maxOutputTokens: 10,
      temperature: 0,
    });

    const result = text.trim().toLowerCase();
    return VALID_LEVELS.has(result) ? (result as TriageLevel) : null;
  } catch {
    return null;
  }
}
