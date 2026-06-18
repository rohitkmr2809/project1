import { supabase } from "@/lib/supabase";

// We don't check-then-insert (that has a time-of-check-to-time-of-use race).
// We just try to insert and let the unique(question_id, voter_id) constraint
// be the referee — it's enforced atomically as part of the insert.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionId } = await params;
    const { voterId } = await req.json();

    const { error } = await supabase
      .from("votes")
      .insert({ question_id: questionId, voter_id: voterId });

    if (error) {
      if (error.code === "23505") {
        return Response.json({ error: "already voted" }, { status: 409 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (error: any) {
    console.error("POST /api/questions/[id]/vote error:", error);
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
