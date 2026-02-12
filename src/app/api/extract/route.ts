import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a scientific paper metadata extractor. Analyze this PDF document and extract the following fields. Return ONLY a valid JSON object with these exact keys:

{
  "doi": "the DOI of the paper, e.g. 10.1234/example",
  "title": "the full title of the paper",
  "author": "all authors separated by semicolons",
  "publicationTitle": "the journal or conference name",
  "publicationDate": "publication date in YYYY-MM-DD or YYYY format",
  "url": "the URL if available, otherwise empty string",
  "keywords": "keywords separated by semicolons",
  "abstract": "the full abstract text",
  "publisher": "the publisher name",
  "fieldOfStudy": "the primary field of study",
  "isDataFusionPaper": true or false (whether this paper is related to data fusion, sensor fusion, or information fusion),
  "dataFusionClassificationReason": "brief explanation of why this is or is not a data fusion paper"
}

If a field cannot be determined from the text, use an empty string (or false for isDataFusionPaper).
Return ONLY the JSON object, no markdown formatting, no code blocks.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        },
      },
    ]);

    const response = result.response;
    const responseText = response.text().trim();

    let parsed;
    try {
      const cleanJson = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse Gemini response", raw: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, extracted: parsed });
  } catch (error: unknown) {
    console.error("Extraction error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
