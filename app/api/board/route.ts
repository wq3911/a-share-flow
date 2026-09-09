import { fetchFlowList } from "@/lib/eastmoney";
import type { Period } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const preferredRegion = ["hkg1"];

const PERIODS: Period[] = ["today", "3d", "5d", "10d"];

export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") ?? "").toUpperCase();
  const period = (req.nextUrl.searchParams.get("period") ?? "today") as Period;
  if (!/^BK\d{4}$/.test(code) || !PERIODS.includes(period)) {
    return NextResponse.json({ error: "板块代码无效" }, { status: 400 });
  }
  try {
    const data = await fetchFlowList({
      kind: "stock",
      period,
      order: "in",
      pn: 1,
      pz: 50,
      fs: `b:${code}`,
    });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "拉取失败";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
