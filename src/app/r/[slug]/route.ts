import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const url = new URL(`/l/${slug}`, req.url);
  return NextResponse.redirect(url, { status: 302 });
}