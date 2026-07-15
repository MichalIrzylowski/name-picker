import { castVote, type VoteValue } from "@/lib/db";

const VOTE_VALUES: VoteValue[] = ["love", "maybe", "no"];

export async function POST(request: Request) {
  const body = await request.json();
  const { nameId, participantId, value } = body;

  if (typeof nameId !== "string" || !nameId.trim()) {
    return Response.json({ error: "nameId is required" }, { status: 400 });
  }
  if (typeof participantId !== "string" || !participantId.trim()) {
    return Response.json({ error: "participantId is required" }, { status: 400 });
  }
  if (!VOTE_VALUES.includes(value)) {
    return Response.json({ error: "value must be one of love, maybe, no" }, { status: 400 });
  }

  await castVote(nameId, participantId, value);
  return Response.json({ ok: true });
}
