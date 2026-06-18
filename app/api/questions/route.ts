import { supabase } from "@/lib/supabase";
import { getQuestionsPage, searchQuestions } from "@/lib/questions";

const PAGE_SIZE = 10;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (q) {
      const questions = await searchQuestions(q, PAGE_SIZE);
      return Response.json({ questions, hasMore: false });
    }

    const offset = Number(searchParams.get("offset") ?? 0);
    const { questions, hasMore } = await getQuestionsPage(offset, PAGE_SIZE);
    return Response.json({ questions, hasMore });
  } catch (error: any) {
    console.error("GET /api/questions error:", error);
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { body, author } = await req.json();

  const { data, error } = await supabase
    .from("questions")
    .insert({ body, author })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
