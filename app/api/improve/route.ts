export async function POST(req: Request) {
  try {
    const { draft } = await req.json();
    if (!draft || draft.trim().length === 0) {
      return Response.json({ error: "Draft is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    const prompt = `You are a helpful AI assistant. The user is asking a question in a Q&A application. 
Improve the following draft question to make it clearer, more professional, and concise. 
Only return the improved question text. Do not add quotes, prefixes, or explanations.
Draft question: ${draft}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
        }
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Gemini API Error:", errorText);
      return Response.json({ error: "Failed to communicate with Gemini API" }, { status: 500 });
    }

    const data = await res.json();
    const improvedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!improvedText) {
      return Response.json({ error: "Failed to parse Gemini API response" }, { status: 500 });
    }

    return Response.json({ improved: improvedText.trim() });
  } catch (error: any) {
    console.error("POST /api/improve error:", error);
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
