import { NextResponse } from "next/server";
import OpenAI from "openai";

type OcrPayload = {
  ingredients: string;
};

function toDataUrlFromBase64(imageBase64: string, mimeType?: string): string {
  const trimmed = imageBase64.trim();
  if (trimmed.startsWith("data:image/")) return trimmed;
  const mime = (mimeType || "image/jpeg").trim() || "image/jpeg";
  return `data:${mime};base64,${trimmed}`;
}

function normalizeIngredientOutput(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "UNREADABLE";
  if (trimmed.toUpperCase().includes("UNREADABLE")) return "UNREADABLE";
  return trimmed
    .replace(/\r?\n+/g, ", ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/,{2,}/g, ",")
    .replace(/^ingredients?\s*:\s*/i, "")
    .trim();
}

async function getImageDataUrl(request: Request): Promise<string> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const image = formData.get("image");
    if (!(image instanceof File)) {
      throw new Error("Image file is required.");
    }
    const mime = image.type || "image/jpeg";
    const buffer = Buffer.from(await image.arrayBuffer());
    return `data:${mime};base64,${buffer.toString("base64")}`;
  }

  const body = (await request.json().catch(() => ({}))) as {
    imageBase64?: unknown;
    imageDataUrl?: unknown;
    mimeType?: unknown;
  };

  if (typeof body.imageDataUrl === "string" && body.imageDataUrl.trim()) {
    return body.imageDataUrl.trim();
  }
  if (typeof body.imageBase64 === "string" && body.imageBase64.trim()) {
    return toDataUrlFromBase64(
      body.imageBase64,
      typeof body.mimeType === "string" ? body.mimeType : undefined
    );
  }

  throw new Error("Image file or base64 image is required.");
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[skincare-ocr] Missing OPENAI_API_KEY");
      return NextResponse.json(
        { error: "Unable to read ingredients right now." },
        { status: 500 }
      );
    }

    const imageDataUrl = await getImageDataUrl(request);
    const client = new OpenAI({ apiKey });

    const visionPrompt = [
      "Extract only the cosmetic ingredients list from this image.",
      "Ignore directions, warnings, brand name, lot number, expiry date, marketing text.",
      "Return only clean comma-separated ingredients.",
      "If unreadable return: UNREADABLE",
    ].join(" ");

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: visionPrompt },
            {
              type: "image_url",
              image_url: { url: imageDataUrl },
            },
          ],
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "";
    const ingredients = normalizeIngredientOutput(content);
    const payload: OcrPayload = { ingredients };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[skincare-ocr] error", error);
    return NextResponse.json(
      { error: "Unable to read ingredients right now." },
      { status: 500 }
    );
  }
}
