const {
  fetchFlowList,
  fetchIndices,
  fetchShanghaiFlow,
} = require("../../utils/eastmoney");
const {
  formatYi,
  formatPct,
  formatPrice,
  signedClass,
  marketStatus,
  STATUS_LABEL,
  heatColor,
} = require("../../utils/format");

const PERIODS = [
  { id: "today", label: "今日" },
  { id: "3d", label: "3日" },
  { id: "5d", label: "5日" },
  { id: "10d", label: "10日" },
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
    shMainNetText: "0.00",
    shMainNetClass: "flat",
    boardSumText: "0.00",
    boardSumClass: "flat",
    twoMarketText: "0.00",
    topBoardName: "--",
    topBoardNet: "0.00",
    topBoardClass: "flat",
    topStockName: "--",
    topStockNet: "0.00",
    topStockClass: "flat",
    boardsView: [],
    stocksView: [],
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
    this._shSeries = [];
    this._indices = [];
    this._shMainNet = 0;
    this.setData({ showGate: !wx.getStorageSync("disclaimer_ok") });
    this.load();
    this._clock = setInterval(() => this.tick(), 1000);
    this._refresh = setInterval(() => this.load(), 20000);
    this.tick();
  },

  onUnload() {
    clearInterval(this._clock);
    clearInterval(this._refresh);
  },

  onReady() {
    this.drawSpark();
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
      const [idx, sh, b, s] = await Promise.all([
        fetchIndices(),
        fetchShanghaiFlow(),
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
      ]);
      this._rawBoards = b.list;
      this._rawStocks = s.list;
      this._shSeries = sh.series;
      this._indices = idx;
      this._shMainNet = sh.latest;
      this.applyView();
      this.drawSpark();
    } catch (e) {
      this.setData({ error: e.message || "加载失败" });
    }
  },

  applyView() {
    const indices = this._indices || [];
    const shMainNet = this._shMainNet || 0;
    const boards = this._rawBoards;
    const stocks = this._rawStocks;
    const maxAbs = Math.max(...boards.map((x) => Math.abs(x.mainNet)), 1);
    const topAbs = Math.max(Math.abs((stocks[0] && stocks[0].mainNet) || 1), 1);
    const boardSum = boards.reduce((sum, x) => sum + x.mainNet, 0);
    const twoMarket = ((indices[0] && indices[0].amount) || 0) + ((indices[1] && indices[1].amount) || 0);
    const q = this.data.query.trim();
    const filtered = stocks.filter((x) => !q || x.name.includes(q) || x.code.includes(q));
    const topBoard = boards[0];
    const topStock = stocks[0];
    this.setData({
      error: "",
      indices: indices.map((x) => ({
        ...x,
        priceText: formatPrice(x.price),
        pctText: formatPct(x.changePct),
        cls: signedClass(x.changePct),
      })),
      shMainNetText: formatYi(shMainNet),
      shMainNetClass: signedClass(shMainNet),
      boardSumText: formatYi(boardSum),
      boardSumClass: signedClass(boardSum),
      twoMarketText: formatYi(twoMarket),
      topBoardName: (topBoard && topBoard.name) || "--",
      topBoardNet: formatYi((topBoard && topBoard.mainNet) || 0),
      topBoardClass: signedClass((topBoard && topBoard.mainNet) || 0),
      topStockName: (topStock && topStock.name) || "--",
      topStockNet: formatYi((topStock && topStock.mainNet) || 0),
      topStockClass: signedClass((topStock && topStock.mainNet) || 0),
      boardsView: boards.slice(0, 16).map((x) => ({
        ...x,
        netText: formatYi(x.mainNet),
        pctText: formatPct(x.changePct),
        netCls: signedClass(x.mainNet),
        pctCls: signedClass(x.changePct),
        bg: heatColor(x.mainNet, maxAbs),
      })),
      stocksView: filtered.slice(0, 20).map((x, i) => ({
        ...x,
        rank: String(i + 1).padStart(2, "0"),
        netText: formatYi(x.mainNet),
        pctText: formatPct(x.changePct),
        netCls: signedClass(x.mainNet),
        pctCls: signedClass(x.changePct),
        bar: `${Math.min(100, (Math.abs(x.mainNet) / topAbs) * 100)}%`,
        barColor: x.mainNet >= 0 ? "#ff3b5c" : "#19e6a0",
      })),
    });
  },

  drawSpark() {
    const series = this._shSeries || [];
    if (series.length < 2) return;
    const query = wx.createSelectorQuery();
    query
      .select("#spark")
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext("2d");
        const sys = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
        const dpr = sys.pixelRatio || 2;
        const w = res[0].width;
        const h = res[0].height;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);
        const min = Math.min(...series);
        const max = Math.max(...series);
        const span = max - min || 1;
        ctx.beginPath();
        series.forEach((v, i) => {
          const x = (i / (series.length - 1)) * w;
          const y = h - ((v - min) / span) * (h - 4) - 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = (series[series.length - 1] || 0) >= 0 ? "#ff3b5c" : "#19e6a0";
        ctx.lineWidth = 1.5;
        ctx.stroke();
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

  async openDetail(item, kind) {
    const parts = [
      { k: "超大单", v: item.superNet, c: "#ff3b5c" },
      { k: "大单", v: item.largeNet, c: "#ff7a93" },
      { k: "中单", v: item.midNet, c: "#3df2ff" },
      { k: "小单", v: item.smallNet, c: "#19e6a0" },
    ];
    const total = parts.reduce((s, p) => s + Math.abs(p.v), 0) || 1;
    this.setData({
      picked: item,
      pickedKind: kind,
      pickedNet: formatYi(item.mainNet),
      pickedNetClass: signedClass(item.mainNet),
      pickedPct: `涨跌幅 ${formatPct(item.changePct)} · 净占比 ${formatPct(item.mainNetRate)}（公开数据）`,
      parts: parts.map((p) => ({
        ...p,
        text: formatYi(p.v),
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
            ...x,
            rank: String(i + 1).padStart(2, "0"),
            netText: formatYi(x.mainNet),
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
