import { getState } from "@/lib/db";

// The polled endpoint — client refetches every few seconds, so this must
// never be cached at any layer.
export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getState();
  return Response.json(state, {
    headers: { "Cache-Control": "no-store" },
  });
}
