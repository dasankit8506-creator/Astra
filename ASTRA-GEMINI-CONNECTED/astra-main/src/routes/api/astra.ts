
import { createFileRoute } from "@tanstack/react-router";

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

const ASTRA_INSTRUCTIONS = `You are ASTRA, Ankit Das's astronomy and space-discovery learning companion.

Your creator is Ankit Das. If asked who made, created, or developed you, clearly answer that Ankit Das made you. You may say: "Ankit Das made me. I'm ASTRA, your personal universe explorer." Do not claim to be human.

For a simple greeting such as "Hi", welcome the user with: "Welcome to ASTRA! What would you like to explore today?" Then offer suggestions such as the Solar System, stars, galaxies, or a big question about the universe.

Help users learn astronomy and space science. Explain clearly, accurately, and patiently. Adapt the depth of your explanation to the question. For difficult questions, break the explanation into understandable steps.

Be accurate. Never invent live sky conditions, current planetary positions, observation results, mission status, or scientific discoveries. State uncertainty when needed.`;

const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
] as const;

const RETRYABLE_STATUSES = [429, 500, 502, 503, 504];

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function getGeminiKey(): string | undefined {
  const runtime = globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  };

  return runtime.process?.env?.GEMINI_API_KEY?.trim() || undefined;
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
  timeoutMs: number,
): Promise<GeminiResult> {
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
            maxOutputTokens: 900,
            temperature: 0.5,
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      },
    );

    const rawResponse = await response.text();

    let result:
      | {
          candidates?: Array<{
            content?: {
              parts?: Array<{ text?: string }>;
            };
          }>;
          error?: {
            message?: string;
          };
        }
      | null = null;

    try {
      result = JSON.parse(rawResponse);
    } catch {
      result = null;
    }

    if (!response.ok) {
      return {
        status: response.status,
        providerMessage:
          result?.error?.message ??
          rawResponse.slice(0, 500) ??
          "Unknown Gemini provider error.",
      };
    }

    const reply = result?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!reply) {
      return {
        status: 502,
        providerMessage:
          "Gemini returned an empty response. The response may have been blocked or incomplete.",
      };
    }

    return {
      reply,
      status: 200,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown network error.";

    return {
      status: 0,
      providerMessage:
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError")
          ? `Gemini request timed out after ${timeoutMs}ms.`
          : errorMessage,
    };
  }
}

export const Route = createFileRoute("/api/astra")({
  server: {
    handlers: {
      GET: async () => {
        return json({
          configured: Boolean(getGeminiKey()),
        });
      },

      POST: async ({ request }) => {
        const apiKey = getGeminiKey();

        if (!apiKey) {
          return json(
            {
              error:
                "GEMINI_API_KEY was not found in server configuration.",
            },
            503,
          );
        }

        // Read and validate the incoming request.
        let payload: unknown;

        try {
          const raw = await request.text();

          if (raw.length > 40000) {
            return json(
              {
                error: "Conversation too long. Please start a new chat.",
              },
              413,
            );
          }

          payload = JSON.parse(raw);
        } catch {
          return json(
            {
              error: "Invalid chat request.",
            },
            400,
          );
        }

        const messages = (
          payload as { messages?: unknown } | null
        )?.messages;

        if (
          !Array.isArray(messages) ||
          messages.length === 0 ||
          messages.length > 16
        ) {
          return json(
            {
              error: "Invalid message history.",
            },
            400,
          );
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
            return json(
              {
                error: "Invalid chat message.",
              },
              400,
            );
          }

          const content = (
            message as { content: string }
          ).content.trim();

          if (!content || content.length > 8000) {
            return json(
              {
                error: "Message is empty or too long.",
              },
              400,
            );
          }

          turns.push({
            role: (message as { role: "user" | "assistant" }).role,
            content,
          });
        }

        if (turns[turns.length - 1]?.role !== "user") {
          return json(
            {
              error: "The latest message must be from the user.",
            },
            400,
          );
        }

        // Keep all attempts inside a single execution-time budget.
        const deadline = Date.now() + 55000;

        let lastResult: GeminiResult = {
          status: 0,
          providerMessage: "No Gemini model was reached.",
        };

        for (let modelIndex = 0; modelIndex < MODELS.length; modelIndex++) {
          const model = MODELS[modelIndex];

          // Give the main model more time. Backups get shorter,
          // but still have time to respond.
          const attempts = modelIndex === 0 ? 2 : 1;

          for (let attempt = 0; attempt < attempts; attempt++) {
            const remainingMs = deadline - Date.now();

            if (remainingMs < 1500) {
              break;
            }

            const preferredTimeout =
              modelIndex === 0
                ? attempt === 0
                  ? 24000
                  : 16000
                : 7000;

            const timeoutMs = Math.max(
              1000,
              Math.min(preferredTimeout, remainingMs - 500),
            );

            console.log(
              `ASTRA trying ${model}, attempt ${attempt + 1}, timeout ${timeoutMs}ms`,
            );

            const result = await generateWithModel(
              apiKey,
              model,
              turns,
              timeoutMs,
            );

            if (result.reply) {
              console.log(
                `ASTRA successfully received a response from ${model}`,
              );

              return json({
                reply: result.reply,
              });
            }

            lastResult = result;

            console.warn(
              `ASTRA model failed: ${model}`,
              result.status,
              result.providerMessage,
            );

            const retryable =
              result.status === 0 ||
              RETRYABLE_STATUSES.includes(result.status) ||
              result.status === 404;

            if (!retryable) {
              break;
            }

            // A timeout is unlikely to improve by immediately
            // repeating the same model. Move to the backup instead.
            if (result.status === 0) {
              break;
            }

            if (attempt + 1 < attempts) {
              await sleep(700);
            }
          }

          if (
            lastResult.status !== 0 &&
            !RETRYABLE_STATUSES.includes(lastResult.status) &&
            lastResult.status !== 404
          ) {
            break;
          }

          if (modelIndex < MODELS.length - 1) {
            await sleep(400);
          }
        }

        console.error(
          "ASTRA could not get a response from any Gemini model:",
          lastResult,
        );

        let errorMessage =
          "ASTRA could not get a response right now. Please try again shortly.";

        if (lastResult.status === 503) {
          errorMessage =
            "Gemini is temporarily experiencing high demand. ASTRA tried its backup models, but they were also unavailable. Please try again shortly.";
        } else if (lastResult.status === 429) {
          errorMessage =
            "Gemini request limits have been reached. Please wait a little before trying again.";
        } else if (
          lastResult.status === 401 ||
          lastResult.status === 403
        ) {
          errorMessage =
            "Gemini rejected the API key. Please check the server API configuration.";
        } else if (lastResult.status === 404) {
          errorMessage =
            "The configured Gemini models are unavailable for this API project. Check model access in Google AI Studio.";
        } else if (lastResult.status === 0) {
          errorMessage =
            "Gemini took too long to respond or could not be reached. Please try again.";
        }

        return json(
          {
            error: errorMessage,
            providerStatus: lastResult.status || undefined,
          },
          502,
        );
      },
    },
  },
});
