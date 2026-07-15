import { addParticipant } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const participant = await addParticipant(name);
  return Response.json(participant);
}
