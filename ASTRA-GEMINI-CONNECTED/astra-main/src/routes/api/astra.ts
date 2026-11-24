
import { createFileRoute } from "@tanstack/react-router";

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

const ASTRA_INSTRUCTIONS = `You are ASTRA, Ankit Das's astronomy and space-discovery learning companion.

Your creator is Ankit Das. If asked who made, created, or developed you, clearly answer that Ankit Das made you. You may say: "Ankit Das made me. I'm ASTRA, your personal universe explorer." Do not claim to be human.

For a simple greeting such as "Hi", welcome the user with: "Welcome to ASTRA! What would you like to explore today?" Then offer suggestions such as the Solar System, stars, galaxies, or a big question about the universe.

Help users learn astronomy and space science. Explain clearly and adapt to the question. Be friendly and curious.

Be accurate. Never invent live sky conditions, current planetary positions, observation results, mission status, or scientific discoveries. State uncertainty when needed.`;

const MODELS = [
  "gemini-3.5-flash-lite",
];

const RETRYABLE_STATUSES = [429, 500, 502, 503, 504];

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function getGeminiKey(): string | undefined {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };

  return runtime.process?.env?.["GEMINI_API_KEY"]?.trim() || undefined;
}



type GeminiResult = {
  reply?: string;
  status: number;
  providerMessage?: string;
};

async function generateWithModel(
  apiKey: string,
  model: string,
  turns: ChatTurn[],
): Promise<GeminiResult> {
  let lastResult: GeminiResult = { status: 0 };

  for (let attempt = 0; attempt < 1; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: ASTRA_INSTRUCTIONS }],
            },
            contents: turns.map((turn) => ({
              role: turn.role === "assistant" ? "model" : "user",
              parts: [{ text: turn.content }],
            })),
            generationConfig: {
  maxOutputTokens: 700,
  temperature: 0.5,
},
          }),
          signal: AbortSignal.timeout(25000),
        },
      );

      const result = await response.json().catch(() => null) as
        | {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
            error?: { message?: string };
          }
        | null;

      if (response.ok) {
        const reply = result?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("")
          .trim();

        if (reply) {
          return { reply, status: 200 };
        }

        lastResult = {
          status: 502,
          providerMessage: "Gemini returned an empty response.",
        };
      } else {
        lastResult = {
          status: response.status,
          providerMessage: result?.error?.message ?? "Unknown provider error",
        };

        console.error(
          `Gemini ${model} failed:`,
          response.status,
          lastResult.providerMessage,
        );

        if (!RETRYABLE_STATUSES.includes(response.status)) {
          return lastResult;
        }
      }
    } catch (error) {
      lastResult = {
        status: 0,
        providerMessage:
          error instanceof Error ? error.message : "Unknown network error",
      };

      console.error(`Gemini ${model} request error:`, error);
    }

    if (attempt === 0) {
     
    }
  }

  return lastResult;
}

export const Route = createFileRoute("/api/astra")({
  server: {
    handlers: {
      GET: async () => {
        return json({ configured: Boolean(getGeminiKey()) });
      },

      POST: async ({ request }) => {
        const apiKey = getGeminiKey();

        if (!apiKey) {
          return json(
            { error: "GEMINI_API_KEY was not found. Check .env.local and restart the server." },
            503,
          );
        }

        let payload: unknown;

        try {
          const raw = await request.text();

          if (raw.length > 40000) {
            return json({ error: "Conversation too long. Start a new chat." }, 413);
          }

          payload = JSON.parse(raw);
        } catch {
          return json({ error: "Invalid chat request." }, 400);
        }

        const messages = (payload as { messages?: unknown } | null)?.messages;

        if (!Array.isArray(messages) || messages.length === 0 || messages.length > 16) {
          return json({ error: "Invalid message history." }, 400);
        }

        const turns: ChatTurn[] = [];

        for (const message of messages) {
          if (
            !message ||
            typeof message !== "object" ||
            !["user", "assistant"].includes(
              (message as { role?: string }).role ?? "",
            ) ||
            typeof (message as { content?: unknown }).content !== "string"
          ) {
            return json({ error: "Invalid chat message." }, 400);
          }

          const content = (message as { content: string }).content.trim();

          if (!content || content.length > 8000) {
            return json({ error: "Message is empty or too long." }, 400);
          }

          turns.push({
            role: (message as { role: "user" | "assistant" }).role,
            content,
          });
        }

        if (turns[turns.length - 1]?.role !== "user") {
          return json({ error: "The latest message must be from the user." }, 400);
        }

        let lastResult: GeminiResult = { status: 0 };

        for (const model of MODELS) {
          console.log(`ASTRA trying Gemini model: ${model}`);

          const result = await generateWithModel(apiKey, model, turns);

          if (result.reply) {
            console.log(`ASTRA received response from ${model}`);
            return json({ reply: result.reply });
          }

          lastResult = result;

          if (
            result.status !== 0 &&
            !RETRYABLE_STATUSES.includes(result.status) &&
            result.status !== 404
          ) {
            break;
          }

          console.warn(`ASTRA moving to next model after ${model}`);
        }

        let message = "Gemini could not complete the request. Please try again.";

        if (lastResult.status === 503) {
          message = "Gemini is experiencing high demand. ASTRA tried its available models, but none could respond. Please try again later.";
        } else if (lastResult.status === 429) {
          message = "Gemini request limits were reached. Please wait before trying again.";
        } else if (lastResult.status === 401 || lastResult.status === 403) {
          message = "Gemini rejected the API key. Check your API key and project permissions.";
        } else if (lastResult.status === 404) {
          message = "The requested Gemini model is unavailable for this API project.";
        } else if (lastResult.status === 0) {
          message = "Gemini did not respond in time or could not be reached. Please try again.";
        }

        console.error("ASTRA final Gemini error:", lastResult);

        return json(
          {
            error: message,
            providerStatus: lastResult.status || undefined,
          },
          502,
        );
      },
    },
  },
});
