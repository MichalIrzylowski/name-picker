import { setSurname } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const surname = typeof body.surname === "string" ? body.surname.trim() : "";
  if (!surname) {
    return Response.json({ error: "surname is required" }, { status: 400 });
  }

  await setSurname(surname);
  return Response.json({ ok: true });
}
