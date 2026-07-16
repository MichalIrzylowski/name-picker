import { isGenderScope, setGenderScope, setSurname } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const hasSurname = typeof body.surname === "string";
  const hasGenderScope = "genderScope" in body;

  if (!hasSurname && !hasGenderScope) {
    return Response.json({ error: "surname or genderScope is required" }, { status: 400 });
  }

  if (hasSurname) {
    const surname = body.surname.trim();
    if (!surname) {
      return Response.json({ error: "surname is required" }, { status: 400 });
    }
    await setSurname(surname);
  }

  if (hasGenderScope) {
    if (!isGenderScope(body.genderScope)) {
      return Response.json({ error: "genderScope must be 'M', 'K' or 'all'" }, { status: 400 });
    }
    await setGenderScope(body.genderScope);
  }

  return Response.json({ ok: true });
}
