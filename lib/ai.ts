/**
 * Un seul point d'entrée IA pour toute l'équipe.
 * Bascule Groq <-> Gemini selon la clé présente dans .env.local.
 * Si aucune clé : renvoie un fallback pour que la démo ne plante jamais.
 */

type Msg = { role: "user" | "assistant" | "system"; content: string };

export function aiProvider(): "openrouter" | "groq" | "gemini" | "none" {
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "none";
}

export async function askAI(
  prompt: string | Msg[],
  system?: string
): Promise<string> {
  const messages: Msg[] = typeof prompt === "string" ? [{ role: "user", content: prompt }] : prompt;
  const provider = aiProvider();

  try {
    if (provider === "openrouter") return await askOpenRouter(messages, system);
    if (provider === "groq") return await askGroq(messages, system);
    if (provider === "gemini") return await askGemini(messages, system);
  } catch (err) {
    console.error("[ai] échec de l'appel:", err);
    return "L'analyse IA est momentanément indisponible. Les corrélations ci-dessus restent calculées localement.";
  }

  return "Aucune clé IA configurée (OPENROUTER_API_KEY, GROQ_API_KEY ou GEMINI_API_KEY dans .env.local).";
}

/**
 * OpenRouter : API compatible OpenAI, donc un seul format de messages.
 * Modèle par défaut gratuit ; surchargeable avec OPENROUTER_MODEL.
 * Attention : Nemotron renvoie aussi un champ `reasoning` à côté de
 * `content` — on ne lit que `content`, le raisonnement interne ne doit
 * jamais finir affiché à l'utilisateur.
 */
async function askOpenRouter(messages: Msg[], system?: string) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "http://localhost:3100",
      "X-Title": "Athar Habits",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-super-vl:free",
      temperature: 0.4,
      messages: system ? [{ role: "system", content: system }, ...messages] : messages,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

async function askGroq(messages: Msg[], system?: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      messages: system ? [{ role: "system", content: system }, ...messages] : messages,
    }),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

async function askGemini(messages: Msg[], system?: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: messages
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        generationConfig: { temperature: 0.4 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
}
