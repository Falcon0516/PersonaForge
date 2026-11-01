import { NextRequest, NextResponse } from "next/server";
import { getTemplateById, getTemplateBySlug, agricultureTemplate } from "@personaforge/core";
import { generateStandaloneHtml } from "@/lib/exporter/htmlExporter";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const mode = (searchParams.get("mode") as "hosted" | "byok") || "hosted";

    // Find bot config (check template preset, or fallback to starter)
    let botConfig =
      getTemplateById(id)?.config ||
      getTemplateBySlug(id)?.config ||
      agricultureTemplate.config;

    const htmlContent = generateStandaloneHtml({
      config: botConfig,
      mode,
      baseUrl: req.nextUrl.origin,
    });

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${botConfig.slug}-${mode}.html"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
