const {
  fetchFlowList,
  fetchIndices,
} = require("../../utils/eastmoney");
const {
  formatQty,
  formatPct,
  formatPrice,
  signedClass,
  marketStatus,
  STATUS_LABEL,
  heatColor,
  aliasIndexName,
  aliasSampleName,
  maskFinanceWords,
} = require("../../utils/format");
const {
  shareAppMessage,
  shareTimeline,
  enableShareMenu,
} = require("../../utils/share");

const PERIODS = [
  { id: "today", label: "当日" },
  { id: "3d", label: "三日" },
  { id: "5d", label: "五日" },
  { id: "10d", label: "十日" },
];

Page({
  data: {
    tab: "radar",
    boardKind: "industry",
    period: "today",
    order: "in",
    query: "",
    clock: "--:--:--",
    statusLabel: "同步中",
    live: false,
    indices: [],
    boardSumText: "0.00",
    boardSumClass: "flat",
    topBoardName: "--",
    topBoardNet: "0.00",
    topBoardClass: "flat",
    topStockName: "--",
    topStockNet: "0.00",
    topStockClass: "flat",
    topEtfName: "--",
    topEtfCode: "",
    topEtfNet: "0.00",
    topEtfClass: "flat",
    boardsView: [],
    stocksView: [],
    etfsView: [],
    error: "",
    picked: null,
    pickedKind: "stock",
    pickedNet: "",
    pickedNetClass: "flat",
    pickedPct: "",
    parts: [],
    membersView: [],
    periods: PERIODS,
    showGate: false,
  },

  onLoad() {
    this._rawBoards = [];
    this._rawStocks = [];
    this._rawEtfs = [];
    this._indices = [];
    this.setData({ showGate: !wx.getStorageSync("disclaimer_ok") });
    enableShareMenu();
    this.load();
    this._clock = setInterval(() => this.tick(), 1000);
    this._refresh = setInterval(() => this.load(), 20000);
    this.tick();
  },

  onUnload() {
    clearInterval(this._clock);
    clearInterval(this._refresh);
  },

  onShareAppMessage() {
    return shareAppMessage();
  },

  onShareTimeline() {
    return shareTimeline();
  },

  tick() {
    const clock = new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).format(new Date());
    const status = marketStatus();
    this.setData({
      clock,
      statusLabel: STATUS_LABEL[status],
      live: status === "open",
    });
  },

  async load() {
    try {
      const [idx, b, s, e] = await Promise.all([
        fetchIndices(),
        fetchFlowList({
          kind: this.data.boardKind,
          period: this.data.period,
          order: this.data.order,
          pn: 1,
          pz: 80,
        }),
        fetchFlowList({
          kind: "stock",
          period: this.data.period,
          order: this.data.order,
          pn: 1,
          pz: 80,
        }),
        fetchFlowList({
          kind: "etf",
          period: this.data.period,
          order: this.data.order,
          pn: 1,
          pz: 80,
        }),
      ]);
      this._rawBoards = b.list;
      this._rawStocks = s.list;
      this._rawEtfs = e.list;
      this._indices = idx;
      this.applyView();
    } catch (e) {
      this.setData({ error: e.message || "加载失败" });
    }
  },

  applyView() {
    const indices = this._indices || [];
    const boards = this._rawBoards;
    const stocks = this._rawStocks;
    const etfs = this._rawEtfs || [];
    const maxAbs = Math.max(...boards.map((x) => Math.abs(x.mainNet)), 1);
    const topAbs = Math.max(Math.abs((stocks[0] && stocks[0].mainNet) || 1), 1);
    const etfAbs = Math.max(Math.abs((etfs[0] && etfs[0].mainNet) || 1), 1);
    const boardSum = boards.reduce((sum, x) => sum + x.mainNet, 0);
    const q = this.data.query.trim().toLowerCase();
    const matchItem = (x) => {
      if (!q) return true;
      const alias = aliasSampleName(x.name).toLowerCase();
      return (
        (x.name && x.name.toLowerCase().includes(q)) ||
        (x.code && String(x.code).toLowerCase().includes(q)) ||
        alias.includes(q)
      );
    };
    const filtered = stocks.filter(matchItem);
    const filteredEtfs = etfs.filter(matchItem);
    const topBoard = boards[0];
    const topStock = stocks[0];
    const topEtf = etfs[0];
    this.setData({
      error: "",
      indices: indices.map((x) => ({
        ...x,
        name: aliasIndexName(x.code),
        priceText: formatPrice(x.price),
        pctText: formatPct(x.changePct),
        cls: signedClass(x.changePct),
      })),
      boardSumText: formatQty(boardSum),
      boardSumClass: signedClass(boardSum),
      topBoardName: topBoard ? maskFinanceWords(topBoard.name) : "--",
      topBoardNet: formatQty((topBoard && topBoard.mainNet) || 0),
      topBoardClass: signedClass((topBoard && topBoard.mainNet) || 0),
      topStockName: topStock ? aliasSampleName(topStock.name) : "--",
      topStockNet: formatQty((topStock && topStock.mainNet) || 0),
      topStockClass: signedClass((topStock && topStock.mainNet) || 0),
      topEtfName: topEtf ? maskFinanceWords(topEtf.name) : "--",
      topEtfCode: (topEtf && topEtf.code) || "",
      topEtfNet: formatQty((topEtf && topEtf.mainNet) || 0),
      topEtfClass: signedClass((topEtf && topEtf.mainNet) || 0),
      boardsView: boards.slice(0, 16).map((x) => ({
        code: x.code,
        name: x.name,
        mainNet: x.mainNet,
        mainNetRate: x.mainNetRate,
        changePct: x.changePct,
        superNet: x.superNet,
        largeNet: x.largeNet,
        midNet: x.midNet,
        smallNet: x.smallNet,
        displayName: maskFinanceWords(x.name),
        netText: formatQty(x.mainNet),
        pctText: formatPct(x.changePct),
        netCls: signedClass(x.mainNet),
        pctCls: signedClass(x.changePct),
        bg: heatColor(x.mainNet, maxAbs),
      })),
      stocksView: filtered.slice(0, 20).map((x, i) => ({
        code: x.code,
        name: x.name,
        mainNet: x.mainNet,
        mainNetRate: x.mainNetRate,
        changePct: x.changePct,
        superNet: x.superNet,
        largeNet: x.largeNet,
        midNet: x.midNet,
        smallNet: x.smallNet,
        displayName: aliasSampleName(x.name),
        rank: String(i + 1).padStart(2, "0"),
        netText: formatQty(x.mainNet),
        pctText: formatPct(x.changePct),
        netCls: signedClass(x.mainNet),
        pctCls: signedClass(x.changePct),
        bar: `${Math.min(100, (Math.abs(x.mainNet) / topAbs) * 100)}%`,
        barColor: x.mainNet >= 0 ? "#ff3b5c" : "#19e6a0",
      })),
      etfsView: filteredEtfs.slice(0, 20).map((x, i) => ({
        code: x.code,
        name: x.name,
        mainNet: x.mainNet,
        mainNetRate: x.mainNetRate,
        changePct: x.changePct,
        superNet: x.superNet,
        largeNet: x.largeNet,
        midNet: x.midNet,
        smallNet: x.smallNet,
        displayName: maskFinanceWords(x.name),
        rank: String(i + 1).padStart(2, "0"),
        netText: formatQty(x.mainNet),
        pctText: formatPct(x.changePct),
        netCls: signedClass(x.mainNet),
        pctCls: signedClass(x.changePct),
        bar: `${Math.min(100, (Math.abs(x.mainNet) / etfAbs) * 100)}%`,
        barColor: x.mainNet >= 0 ? "#ff3b5c" : "#19e6a0",
      })),
    });
  },

  setTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  setPeriod(e) {
    this.setData({ period: e.currentTarget.dataset.id }, () => this.load());
  },

  setOrder(e) {
    this.setData({ order: e.currentTarget.dataset.id }, () => this.load());
  },

  setBoardKind(e) {
    this.setData({ boardKind: e.currentTarget.dataset.id }, () => this.load());
  },

  onQuery(e) {
    this.setData({ query: e.detail.value }, () => this.applyView());
  },

  openBoard(e) {
    const item = e.currentTarget.dataset.item;
    this.openDetail(item, "board");
  },

  openStock(e) {
    const item = e.currentTarget.dataset.item;
    this.openDetail(item, "stock");
  },

  openEtf(e) {
    const item = e.currentTarget.dataset.item;
    this.openDetail(item, "etf");
  },

  async openDetail(item, kind) {
    const parts = [
      { k: "档位甲", v: item.superNet, c: "#ff3b5c" },
      { k: "档位乙", v: item.largeNet, c: "#ff7a93" },
      { k: "档位丙", v: item.midNet, c: "#3df2ff" },
      { k: "档位丁", v: item.smallNet, c: "#19e6a0" },
    ];
    const total = parts.reduce((s, p) => s + Math.abs(p.v), 0) || 1;
    const displayName =
      kind === "stock" ? aliasSampleName(item.name) : maskFinanceWords(item.name);
    this.setData({
      picked: {
        code: item.code,
        mainNet: item.mainNet,
        mainNetRate: item.mainNetRate,
        changePct: item.changePct,
        superNet: item.superNet,
        largeNet: item.largeNet,
        midNet: item.midNet,
        smallNet: item.smallNet,
        displayName,
      },
      pickedKind: kind,
      pickedNet: formatQty(item.mainNet),
      pickedNetClass: signedClass(item.mainNet),
      pickedPct: `变动比 ${formatPct(item.changePct)} · 占比 ${formatPct(item.mainNetRate)}`,
      parts: parts.map((p) => ({
        ...p,
        text: formatQty(p.v),
        cls: signedClass(p.v),
        width: `${(Math.abs(p.v) / total) * 100}%`,
        opacity: p.v >= 0 ? 1 : 0.4,
      })),
      membersView: [],
    });
    if (kind === "board") {
      try {
        const data = await fetchFlowList({
          kind: "stock",
          period: this.data.period,
          order: "in",
          pn: 1,
          pz: 50,
          fs: `b:${item.code}`,
        });
        this.setData({
          membersView: data.list.map((x, i) => ({
            code: x.code,
            name: x.name,
            mainNet: x.mainNet,
            mainNetRate: x.mainNetRate,
            changePct: x.changePct,
            superNet: x.superNet,
            largeNet: x.largeNet,
            midNet: x.midNet,
            smallNet: x.smallNet,
            displayName: maskFinanceWords(x.name),
            rank: String(i + 1).padStart(2, "0"),
            netText: formatQty(x.mainNet),
            netCls: signedClass(x.mainNet),
          })),
        });
      } catch (e) {
        this.setData({ membersView: [] });
      }
    }
  },

  closeDetail() {
    this.setData({ picked: null, membersView: [] });
  },

  acceptGate() {
    wx.setStorageSync("disclaimer_ok", 1);
    this.setData({ showGate: false });
  },

  goAbout() {
    wx.navigateTo({ url: "/pages/about/about" });
  },
  goAgreement() {
    wx.navigateTo({ url: "/pages/agreement/agreement" });
  },
  goPrivacy() {
    wx.navigateTo({ url: "/pages/privacy/privacy" });
  },
  goDisclaimer() {
    wx.navigateTo({ url: "/pages/disclaimer/disclaimer" });
  },
});
