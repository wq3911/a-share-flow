export type Period = "today" | "3d" | "5d" | "10d";
export type FlowKind = "industry" | "concept" | "stock";
export type Order = "in" | "out";

export type FlowRow = {
  code: string;
  market: number;
  name: string;
  price: number;
  changePct: number;
  turnover: number;
  marketCap: number;
  mainNet: number;
  mainNetRate: number;
  superNet: number;
  superRate: number;
  largeNet: number;
  largeRate: number;
  midNet: number;
  midRate: number;
  smallNet: number;
  smallRate: number;
  leaderName: string;
  leaderCode: string;
};

export type IndexQuote = {
  code: string;
  name: string;
  price: number;
  changePct: number;
  amount: number;
};

export type MarketPayload = {
  indices: IndexQuote[];
  shMainNet: number;
  shSeries: number[];
  asOf: string;
  status: "pre" | "open" | "lunch" | "closed";
};
