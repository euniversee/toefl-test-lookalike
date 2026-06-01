import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    // Get the form data from the incoming request
    const formData = await request.formData();
    const audioFile = formData.get("file");

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: "No audio file provided." },
        { status: 400 }
      );
    }

    // Build the request to Groq's Whisper API
    const groqFormData = new FormData();
    groqFormData.append("file", audioFile, "recording.webm");
    groqFormData.append("model", "whisper-large-v3");
    groqFormData.append("language", "en");
    groqFormData.append("response_format", "json");

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: groqFormData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Transcription failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error("Transcription route error:", error);
    return NextResponse.json(
      { error: "Internal server error during transcription." },
      { status: 500 }
    );
  }
}
