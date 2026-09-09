"use client";

import { fetchFlowList, fetchIndices, fetchShanghaiFlow } from "@/lib/eastmoney";
import { formatPct, formatPrice, formatYi, marketStatus, signedClass, STATUS_LABEL } from "@/lib/format";
import type { FlowKind, FlowRow, Order, Period } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState } from "react";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "今日" },
  { id: "3d", label: "3日" },
  { id: "5d", label: "5日" },
  { id: "10d", label: "10日" },
];

type Tab = "radar" | "board" | "stock";

function heatColor(value: number, maxAbs: number): string {
  const t = Math.min(1, Math.abs(value) / Math.max(maxAbs, 1));
  const a = 0.18 + t * 0.62;
  return value >= 0 ? `rgba(255, 59, 92, ${a})` : `rgba(25, 230, 160, ${a})`;
}

function Sparkline({ series }: { series: number[] }) {
  if (series.length < 2) return null;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const w = 280;
  const h = 42;
  const pts = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const positive = (series.at(-1) ?? 0) >= 0;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={positive ? "#ff3b5c" : "#19e6a0"} strokeWidth="2" points={pts} />
    </svg>
  );
}

function Breakdown({ row }: { row: FlowRow }) {
  const parts = [
    { k: "超大单", v: row.superNet, c: "#ff3b5c" },
    { k: "大单", v: row.largeNet, c: "#ff7a93" },
    { k: "中单", v: row.midNet, c: "#3df2ff" },
    { k: "小单", v: row.smallNet, c: "#19e6a0" },
  ];
  const total = parts.reduce((s, p) => s + Math.abs(p.v), 0) || 1;
  return (
    <>
      <div className="stack-bar">
        {parts.map((p) => (
          <span key={p.k} style={{ width: `${(Math.abs(p.v) / total) * 100}%`, background: p.c, opacity: p.v >= 0 ? 1 : 0.4 }} />
        ))}
      </div>
      <div className="split">
        {parts.map((p) => (
          <div key={p.k} className="panel">
            <div className="kpi-label">{p.k}</div>
            <div className={`kpi-value ${signedClass(p.v)}`} style={{ fontSize: 16 }}>
              {formatYi(p.v)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function RadarClient() {
  const [tab, setTab] = useState<Tab>("radar");
  const [boardKind, setBoardKind] = useState<Exclude<FlowKind, "stock">>("industry");
  const [period, setPeriod] = useState<Period>("today");
  const [order, setOrder] = useState<Order>("in");
  const [query, setQuery] = useState("");
  const [clock, setClock] = useState("--:--:--");
  const [indices, setIndices] = useState<{ name: string; code: string; price: number; changePct: number; amount: number }[]>([]);
  const [shMainNet, setShMainNet] = useState(0);
  const [shSeries, setShSeries] = useState<number[]>([]);
  const [status, setStatus] = useState<"pre" | "open" | "lunch" | "closed">("closed");
  const [boards, setBoards] = useState<FlowRow[]>([]);
  const [stocks, setStocks] = useState<FlowRow[]>([]);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<FlowRow | null>(null);
  const [pickedKind, setPickedKind] = useState<"board" | "stock">("stock");
  const [members, setMembers] = useState<FlowRow[]>([]);

  const load = useCallback(async () => {
    try {
      setError("");
      const [idx, sh, b, s] = await Promise.all([
        fetchIndices(),
        fetchShanghaiFlow(),
        fetchFlowList({ kind: boardKind, period, order, pn: 1, pz: 80 }),
        fetchFlowList({ kind: "stock", period, order, pn: 1, pz: 80 }),
      ]);
      setIndices(idx);
      setShMainNet(sh.latest);
      setShSeries(sh.series);
      setStatus(marketStatus());
      setBoards(b.list);
      setStocks(s.list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    }
  }, [boardKind, period, order]);

  useEffect(() => {
    const tick = () => {
      setClock(
        new Intl.DateTimeFormat("zh-CN", {
          timeZone: "Asia/Shanghai",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
        }).format(new Date()),
      );
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!picked || pickedKind !== "board") {
      setMembers([]);
      return;
    }
    fetchFlowList({ kind: "stock", period, order: "in", pn: 1, pz: 50, fs: `b:${picked.code}` })
      .then((d) => setMembers(d.list))
      .catch(() => setMembers([]));
  }, [picked, pickedKind, period]);

  const maxAbs = useMemo(() => Math.max(...boards.map((b) => Math.abs(b.mainNet)), 1), [boards]);
  const twoMarketAmount = (indices[0]?.amount ?? 0) + (indices[1]?.amount ?? 0);
  const boardSum = boards.reduce((s, b) => s + b.mainNet, 0);
  const filteredStocks = stocks.filter((s) => !query || s.name.includes(query) || s.code.includes(query));
  const topBoard = boards[0];
  const topStock = stocks[0];
  const live = status === "open";

  const openBoard = (row: FlowRow) => {
    setPicked(row);
    setPickedKind("board");
  };
  const openStock = (row: FlowRow) => {
    setPicked(row);
    setPickedKind("stock");
  };

  return (
    <div className="stage" data-tab={tab}>
      <div className="scan" />
      <div className="wrap">
        <header className="topbar">
          <div className="brand">
            <div className="logo">
              <span>多</span>
            </div>
            <div>
              <h1>多米罗盘</h1>
              <p>公开盘面学习看板</p>
            </div>
          </div>
          <div className="livebox">
            <div className="clock">{clock}</div>
            <div className="badge">
              <i className={`dot ${live ? "hot" : "off"}`} />
              {STATUS_LABEL[status]} · 北京时间
            </div>
          </div>
        </header>

        <section className="kpis">
          <article className="panel">
            <div className="kpi-label">上证主力净流入 / 分时</div>
            <div className={`kpi-value ${signedClass(shMainNet)}`}>{formatYi(shMainNet)}</div>
            <Sparkline series={shSeries} />
          </article>
          {indices.map((idx) => (
            <article className="panel" key={idx.code}>
              <div className="kpi-label">{idx.name}</div>
              <div className="kpi-value">{formatPrice(idx.price)}</div>
              <div className={`kpi-sub ${signedClass(idx.changePct)}`}>{formatPct(idx.changePct)}</div>
            </article>
          ))}
        </section>

        <section className="kpis kpis-4">
          <article className="panel">
            <div className="kpi-label">板块资金合计</div>
            <div className={`kpi-value ${signedClass(boardSum)}`}>{formatYi(boardSum)}</div>
          </article>
          <article className="panel">
            <div className="kpi-label">最强板块</div>
            <div className="kpi-value" style={{ fontSize: 18 }}>
              {topBoard?.name ?? "--"}
            </div>
            <div className={`kpi-sub ${signedClass(topBoard?.mainNet ?? 0)}`}>{formatYi(topBoard?.mainNet ?? 0)}</div>
          </article>
          <article className="panel">
            <div className="kpi-label">最强个股</div>
            <div className="kpi-value" style={{ fontSize: 18 }}>
              {topStock?.name ?? "--"}
            </div>
            <div className={`kpi-sub ${signedClass(topStock?.mainNet ?? 0)}`}>{formatYi(topStock?.mainNet ?? 0)}</div>
          </article>
          <article className="panel">
            <div className="kpi-label">沪深成交额</div>
            <div className="kpi-value">{formatYi(twoMarketAmount)}</div>
          </article>
        </section>

        <div className="toolbar">
          <div className="seg">
            {PERIODS.map((p) => (
              <button key={p.id} className={period === p.id ? "on" : ""} onClick={() => setPeriod(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="seg">
            <button className={order === "in" ? "on" : ""} onClick={() => setOrder("in")}>
              流入榜
            </button>
            <button className={order === "out" ? "on" : ""} onClick={() => setOrder("out")}>
              流出榜
            </button>
          </div>
          <input className="search" placeholder="搜索个股代码 / 名称" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        {error ? <div className="err">{error}</div> : null}

        <div className="grid-2">
            <section className="panel board-panel">
              <div className="toolbar" style={{ marginTop: 0 }}>
                <div className="kpi-label">板块资金流热力</div>
                <div className="seg">
                  <button className={boardKind === "industry" ? "on" : ""} onClick={() => setBoardKind("industry")}>
                    行业
                  </button>
                  <button className={boardKind === "concept" ? "on" : ""} onClick={() => setBoardKind("concept")}>
                    概念
                  </button>
                </div>
              </div>
              <div className="heat">
                {boards.slice(0, 16).map((b) => (
                  <button
                    key={b.code}
                    className="tile"
                    onClick={() => openBoard(b)}
                    style={{ background: heatColor(b.mainNet, maxAbs), borderColor: "rgba(255,255,255,0.06)" }}
                  >
                    <div className="name">{b.name}</div>
                    <div className={`net ${signedClass(b.mainNet)}`}>{formatYi(b.mainNet)}</div>
                    <div className={`meta ${signedClass(b.changePct)}`}>
                      {formatPct(b.changePct)} {b.leaderName ? `· ${b.leaderName}` : ""}
                    </div>
                  </button>
                ))}
              </div>
            </section>

          <section className="panel stock-panel">
            <div className="kpi-label" style={{ marginBottom: 10 }}>
              个股主力净流入 TOP
            </div>
            <div className="list">
              {filteredStocks.slice(0, 20).map((s, i) => (
                <button key={s.code} className="row" onClick={() => openStock(s)}>
                  <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <div>
                      {s.name} <span className="flat">{s.code}</span>
                    </div>
                    <div className="bar">
                      <i
                        style={{
                          width: `${Math.min(100, (Math.abs(s.mainNet) / Math.max(Math.abs(stocks[0]?.mainNet || 1), 1)) * 100)}%`,
                          background: s.mainNet >= 0 ? "var(--up)" : "var(--down)",
                        }}
                      />
                    </div>
                  </div>
                  <div className="num">
                    <div className={signedClass(s.mainNet)}>{formatYi(s.mainNet)}</div>
                    <div className={signedClass(s.changePct)}>{formatPct(s.changePct)}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="panel desktop-only" style={{ marginTop: 12 }}>
          <div className="kpi-label" style={{ marginBottom: 8 }}>
            个股资金流明细
          </div>
          <div className="hscroll">
            <table>
              <thead>
                <tr>
                  <th>代码</th>
                  <th>名称</th>
                  <th>最新</th>
                  <th>涨跌幅</th>
                  <th>主力净流入</th>
                  <th>主力净占比</th>
                  <th>超大单</th>
                  <th>大单</th>
                  <th>中单</th>
                  <th>小单</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((s) => (
                  <tr key={s.code} className="clickable" onClick={() => openStock(s)}>
                    <td className="num">{s.code}</td>
                    <td>{s.name}</td>
                    <td className="num">{formatPrice(s.price)}</td>
                    <td className={`num ${signedClass(s.changePct)}`}>{formatPct(s.changePct)}</td>
                    <td className={`num ${signedClass(s.mainNet)}`}>{formatYi(s.mainNet)}</td>
                    <td className={`num ${signedClass(s.mainNetRate)}`}>{formatPct(s.mainNetRate)}</td>
                    <td className={`num ${signedClass(s.superNet)}`}>{formatYi(s.superNet)}</td>
                    <td className={`num ${signedClass(s.largeNet)}`}>{formatYi(s.largeNet)}</td>
                    <td className={`num ${signedClass(s.midNet)}`}>{formatYi(s.midNet)}</td>
                    <td className={`num ${signedClass(s.smallNet)}`}>{formatYi(s.smallNet)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="foot">数据来源：东方财富公开行情 · 约 20 秒刷新 · 仅供信息展示，不构成任何投资建议</p>
      </div>

      <nav className="tabbar">
        <button className={tab === "radar" ? "on" : ""} onClick={() => setTab("radar")}>
          雷达
        </button>
        <button className={tab === "board" ? "on" : ""} onClick={() => setTab("board")}>
          板块
        </button>
        <button className={tab === "stock" ? "on" : ""} onClick={() => setTab("stock")}>
          个股
        </button>
      </nav>

      {picked ? (
        <>
          <div className="drawer-mask" onClick={() => setPicked(null)} />
          <aside className="drawer">
            <div className="kpi-label">{pickedKind === "board" ? picked.code : "个股资金结构"}</div>
            <h3>{picked.name}</h3>
            <div className={`kpi-value ${signedClass(picked.mainNet)}`}>{formatYi(picked.mainNet)}</div>
            <div className={`kpi-sub ${signedClass(picked.changePct)}`}>
              涨跌 {formatPct(picked.changePct)} · 主力净占比 {formatPct(picked.mainNetRate)}
            </div>
            <Breakdown row={picked} />
            {pickedKind === "board" ? (
              <>
                <div className="kpi-label" style={{ marginBottom: 8 }}>
                  成分股资金排名
                </div>
                <div className="list">
                  {members.map((s, i) => (
                    <button key={s.code} className="row" onClick={() => openStock(s)}>
                      <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        {s.name} {s.code}
                      </div>
                      <div className={`num ${signedClass(s.mainNet)}`}>{formatYi(s.mainNet)}</div>
                    </button>
                  ))}
                </div>
              </>
            ) : null}
            <button className="search" style={{ marginTop: 18, width: "100%", cursor: "pointer" }} onClick={() => setPicked(null)}>
              关闭
            </button>
          </aside>
        </>
      ) : null}
    </div>
  );
}
