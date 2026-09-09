import { fetchIndices, fetchShanghaiFlow } from "@/lib/eastmoney";
import { marketStatus } from "@/lib/format";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const preferredRegion = ["hkg1"];

export async function GET() {
  try {
    const [indices, sh] = await Promise.all([fetchIndices(), fetchShanghaiFlow()]);
    return NextResponse.json(
      {
        indices,
        shMainNet: sh.latest,
        shSeries: sh.series,
        asOf: new Date().toISOString(),
        status: marketStatus(),
      },
      { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "拉取失败";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
