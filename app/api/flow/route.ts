import { fetchFlowList } from "@/lib/eastmoney";
import type { FlowKind, Order, Period } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const preferredRegion = ["hkg1"];

const KINDS: FlowKind[] = ["industry", "concept", "stock"];
const PERIODS: Period[] = ["today", "3d", "5d", "10d"];

export async function GET(req: NextRequest) {
  const kind = (req.nextUrl.searchParams.get("kind") ?? "industry") as FlowKind;
  const period = (req.nextUrl.searchParams.get("period") ?? "today") as Period;
  const order = (req.nextUrl.searchParams.get("order") ?? "in") as Order;
  const pn = Number(req.nextUrl.searchParams.get("pn") ?? "1");
  const pz = Number(req.nextUrl.searchParams.get("pz") ?? "50");
  if (!KINDS.includes(kind) || !PERIODS.includes(period)) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 });
  }
  try {
    const data = await fetchFlowList({
      kind,
      period,
      order: order === "out" ? "out" : "in",
      pn: Number.isFinite(pn) && pn > 0 ? pn : 1,
      pz: Math.min(Math.max(pz || 50, 1), 100),
    });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "拉取失败";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
