import { addNote } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const nameId = typeof body.nameId === "string" ? body.nameId.trim() : "";
  const authorId = typeof body.authorId === "string" ? body.authorId.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!nameId) {
    return Response.json({ error: "nameId is required" }, { status: 400 });
  }
  if (!authorId) {
    return Response.json({ error: "authorId is required" }, { status: 400 });
  }
  if (!text) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  await addNote(nameId, authorId, text);
  return Response.json({ ok: true });
}
