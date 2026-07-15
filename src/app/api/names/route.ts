import { getNames } from "@/lib/db";
import { cohortMapOf, toApiItem } from "@/lib/names";

// Names only change on re-seed, never on user activity. Serving via a dynamic
// handler (rather than static revalidate) keeps `next build` from needing a
// live DB connection; the long Cache-Control header still lets Vercel's edge
// cache the response aggressively after the first request. This must never
// be the polled endpoint.
export const dynamic = "force-dynamic";

export async function GET() {
  const { names, cohorts } = await getNames();
  const cohortMap = cohortMapOf(cohorts);
  const items = names.map((row) => toApiItem(row, cohortMap));
  return Response.json(items, {
    headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
  });
}
