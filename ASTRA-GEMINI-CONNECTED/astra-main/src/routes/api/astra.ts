
import { createFileRoute } from "@tanstack/react-router";

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

const ASTRA_INSTRUCTIONS = `
You are ASTRA, Ankit Das's astronomy and space-discovery learning companion.

Your creator is Ankit Das. If asked who made, created, or developed you, clearly answer that Ankit Das made you.

You may say:
"Ankit Das made me. I'm ASTRA, your personal universe explorer."

Never claim to be human.

For a simple greeting such as "Hi", respond:
"Welcome to ASTRA! What would you like to explore today?"

You may suggest:
- The Solar System
- Stars and galaxies
- Black holes
- Space exploration and missions
- Big questions about the universe

Your purpose is to help users understand astronomy, astrophysics, and space science.

Explain difficult topics in simple language.
Adapt the depth of your explanation to the user's question.
Be friendly, curious, patient, and scientifically accurate.

For complex questions, explain the reasoning in clear steps.

Never invent:
- Live sky conditions
- Current planetary positions
- Observation results
- Mission status
- Scientific discoveries

If information may be outdated or uncertain, clearly say so.

Do not pretend to have live internet access or real-time telescope data.
`;

const MODELS = [
  {
    name: "gemini-3.5-flash-lite",
    timeout: 20000,
  },
  {
    name: "gemini-3.1-flash-lite",
    timeout: 14000,
  },
  {
    name: "gemini-3.5-flash",
    timeout: 14000,
  },
];

const RETRYABLE_STATUSES = [429, 500, 502, 503, 504];

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
  timeout: number,
  turns: ChatTurn[],
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

        signal: AbortSignal.timeout(timeout),
      },
    );

    const result = await response.json().catch(() => null) as
      | {
          candidates?: Array<{
            content?: {
              parts?: Array<{
                text?: string;
              }>;
            };
          }>;
          error?: {
            message?: string;
          };
        }
      | null;

    if (!response.ok) {
      return {
        status: response.status,
        providerMessage:
          result?.error?.message ??
          `Gemini returned HTTP ${response.status}.`,
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
          "Gemini returned an empty or unavailable response.",
      };
    }

    return {
      reply,
      status: 200,
    };
  } catch (error) {
    return {
      status: 0,
      providerMessage:
        error instanceof Error
          ? error.message
          : "Unknown network error.",
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
                "ASTRA's Gemini API key is missing from server configuration.",
            },
            503,
          );
        }

        let payload: unknown;

        try {
          const raw = await request.text();

          if (raw.length > 40000) {
            return json(
              {
                error:
                  "Conversation is too long. Please start a new chat.",
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
            typeof (message as { content?: unknown }).content !==
              "string"
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
            role: (
              message as {
                role: "user" | "assistant";
              }
            ).role,
            content,
          });
        }

        if (turns[turns.length - 1]?.role !== "user") {
          return json(
            {
              error:
                "The latest message must be from the user.",
            },
            400,
          );
        }

        let lastResult: GeminiResult = {
          status: 0,
          providerMessage: "No Gemini model was attempted.",
        };

        for (const model of MODELS) {
          console.log(
            `ASTRA trying Gemini model: ${model.name}`,
          );

          const result = await generateWithModel(
            apiKey,
            model.name,
            model.timeout,
            turns,
          );

          if (result.reply) {
            console.log(
              `ASTRA received response from ${model.name}`,
            );

            return json({
              reply: result.reply,
            });
          }

          lastResult = result;

          console.warn(
            `ASTRA model failed: ${model.name}`,
            result.status,
            result.providerMessage,
          );

          const shouldContinue =
            result.status === 0 ||
            result.status === 404 ||
            RETRYABLE_STATUSES.includes(result.status);

          if (!shouldContinue) {
            break;
          }
        }

        console.error(
          "ASTRA all Gemini attempts failed:",
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
            providerStatus:
              lastResult.status || undefined,
          },
          502,
        );
      },
    },
  },
});
