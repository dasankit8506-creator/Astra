
import { createFileRoute } from "@tanstack/react-router";

const MODEL = "gemini-3.5-flash-lite";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

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

export const Route = createFileRoute("/api/astra/vision")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = getGeminiKey();

        if (!apiKey) {
          return json(
            { error: "ASTRA AI is not configured. Check the server API key." },
            503,
          );
        }

        let payload: unknown;

        try {
          const raw = await request.text();

          // Supports the frontend's maximum 8 MB image upload.
          if (raw.length > 12_000_000) {
            return json({ error: "Image request is too large. Please use a smaller image." }, 413);
          }

          payload = JSON.parse(raw);
        } catch {
          return json({ error: "Invalid image analysis request." }, 400);
        }

        if (!payload || typeof payload !== "object") {
          return json({ error: "Invalid request data." }, 400);
        }

        type VisionPayload = {
  image?: unknown;
  mimeType?: unknown;
  location?: unknown;
  date?: unknown;
  time?: unknown;
  direction?: unknown;
  notes?: unknown;
};

const data = payload as VisionPayload;

        const image = data.image;
        const mimeType = data.mimeType;

        if (typeof image !== "string" || !image.trim()) {
          return json({ error: "Please upload an image first." }, 400);
        }

        if (
          typeof mimeType !== "string" ||
          !ALLOWED_MIME_TYPES.includes(mimeType)
        ) {
          return json(
            { error: "Please use a JPEG, PNG, or WEBP image." },
            400,
          );
        }

        // Reject malformed or unexpectedly large base64 data.
        if (
          image.length > 11_200_000 ||
          !/^[A-Za-z0-9+/]+={0,2}$/.test(image)
        ) {
          return json({ error: "The uploaded image data is invalid or too large." }, 400);
        }

        const location =
          typeof data.location === "string" ? data.location.slice(0, 300) : "";

        const date =
          typeof data.date === "string" ? data.date.slice(0, 50) : "";

        const time =
          typeof data.time === "string" ? data.time.slice(0, 50) : "";

        const direction =
          typeof data.direction === "string" ? data.direction.slice(0, 100) : "";

        const notes =
          typeof data.notes === "string" ? data.notes.slice(0, 1500) : "";

        const prompt = `
You are ASTRA VISION, the image-understanding assistant inside ASTRA,
an astronomy and space-discovery learning platform.

Your task is to carefully analyse the uploaded image and help the user
understand what it may show.

OBSERVATION DETAILS
Location: ${location || "Not provided"}
Date: ${date || "Not provided"}
Time: ${time || "Not provided"}
Viewing direction: ${direction || "Not provided"}
User notes: ${notes || "None"}

IMPORTANT SCIENTIFIC RULES:
- First describe what is actually visible in the image.
- If it appears to show a celestial object, explain the most likely possibilities.
- Never claim a star, planet, constellation, galaxy, or nebula is definitely identified unless the image and available evidence genuinely support that conclusion.
- A normal photograph alone may not provide enough information to identify exact stars or determine their positions.
- Do not invent coordinates, live sky positions, observation conditions, or astronomical measurements.
- If the image is blurry, dark, edited, downloaded, or otherwise inconclusive, explain the limitation.
- Clearly distinguish visual observations from possible interpretations.
- Do not pretend to perform plate-solving or verified astronomical identification.
- If the image is not astronomy-related, politely explain what it appears to show instead.

RESPONSE FORMAT:

1. WHAT I CAN SEE
Describe the visible contents.

2. POSSIBLE IDENTIFICATION
Give the most likely explanation, with uncertainty clearly stated.

3. ASTRONOMY EXPLANATION
Explain the relevant science in beginner-friendly language.

4. OBSERVATION DETAILS
Explain how the provided location, date, time, and direction help, or what information is missing.

5. CONFIDENCE
Choose one: Low, Moderate, or High.
Briefly explain why. This is an AI visual assessment, not a verified astronomical identification.

Use clear, friendly English. Be scientifically careful and helpful.
`;

        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
              },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        inline_data: {
                          mime_type: mimeType,
                          data: image,
                        },
                      },
                      {
                        text: prompt,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  maxOutputTokens: 900,
                  temperature: 0.3,
                },
              }),
              signal: AbortSignal.timeout(45000),
            },
          );

          const result = await response.json().catch(() => null) as
            | {
                candidates?: Array<{
                  content?: {
                    parts?: Array<{ text?: string }>;
                  };
                }>;
                error?: { message?: string };
              }
            | null;

          if (!response.ok) {
            console.error(
              "ASTRA VISION Gemini error:",
              response.status,
              result?.error?.message,
            );

            if (response.status === 429) {
              return json(
                { error: "ASTRA VISION is receiving too many requests. Please wait and try again." },
                429,
              );
            }

            if (response.status === 401 || response.status === 403) {
              return json(
                { error: "Gemini rejected the API key. Please check the server configuration." },
                502,
              );
            }

            return json(
              { error: "ASTRA could not analyse this image right now. Please try again." },
              502,
            );
          }

          const analysis = result?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text ?? "")
            .join("")
            .trim();

          if (!analysis) {
            return json(
              { error: "ASTRA received no analysis for this image. Please try another image." },
              502,
            );
          }

          return json({ analysis });
        } catch (error) {
          console.error("ASTRA VISION request failed:", error);

          return json(
            { error: "ASTRA VISION could not reach the AI service in time. Please try again." },
            502,
          );
        }
      },
    },
  },
});
