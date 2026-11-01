import { NextRequest, NextResponse } from "next/server";
import { getAllTemplates } from "@personaforge/core";

export async function GET(req: NextRequest) {
  const secret = process.env.INTERNAL_API_SECRET;
  const provided = req.headers.get("x-internal-secret");

  if (secret && provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = getAllTemplates();
  const bots = templates.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    industry: t.industry,
    useCode: t.slug.replace(/[^a-z0-9]/g, "").slice(0, 6),
  }));

  return NextResponse.json({ bots });
}
