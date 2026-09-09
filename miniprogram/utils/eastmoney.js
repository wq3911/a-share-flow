const { toNumber } = require("./format");

const HOSTS = [
  "https://push2delay.eastmoney.com",
  "https://push2.eastmoney.com",
];

const PERIOD_FIELDS = {
  today: {
    fid: "f62",
    main: "f62",
    mainRate: "f184",
    super: "f66",
    superRate: "f69",
    large: "f72",
    largeRate: "f75",
    mid: "f78",
    midRate: "f81",
    small: "f84",
    smallRate: "f87",
  },
  "3d": {
    fid: "f267",
    main: "f267",
    mainRate: "f268",
    super: "f269",
    superRate: "f270",
    large: "f271",
    largeRate: "f272",
    mid: "f273",
    midRate: "f274",
    small: "f275",
    smallRate: "f276",
  },
  "5d": {
    fid: "f164",
    main: "f164",
    mainRate: "f165",
    super: "f166",
    superRate: "f167",
    large: "f168",
    largeRate: "f169",
    mid: "f170",
    midRate: "f171",
    small: "f172",
    smallRate: "f173",
  },
  "10d": {
    fid: "f174",
    main: "f174",
    mainRate: "f175",
    super: "f176",
    superRate: "f177",
    large: "f178",
    largeRate: "f179",
    mid: "f180",
    midRate: "f181",
    small: "f182",
    smallRate: "f183",
  },
};

const FS = {
  industry: "m:90+t:2",
  concept: "m:90+t:3",
  stock: "m:0+t:6+f:!2,m:0+t:13+f:!2,m:0+t:80+f:!2,m:1+t:2+f:!2,m:1+t:23+f:!2",
};

function periodFieldList(period) {
  const p = PERIOD_FIELDS[period];
  return [
    "f12",
    "f13",
    "f14",
    "f2",
    "f3",
    "f8",
    "f20",
    "f204",
    "f205",
    p.main,
    p.mainRate,
    p.super,
    p.superRate,
    p.large,
    p.largeRate,
    p.mid,
    p.midRate,
    p.small,
    p.smallRate,
  ].join(",");
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: "GET",
      timeout: 8000,
      success(res) {
        if (res.statusCode === 200) resolve(res.data);
        else reject(new Error(`HTTP ${res.statusCode}`));
      },
      fail(err) {
        reject(new Error(err.errMsg || "请求失败"));
      },
    });
  });
}

async function eastmoneyJson(pathAndQuery) {
  let lastError = "empty reply";
  for (const host of HOSTS) {
    try {
      return await requestJson(`${host}${pathAndQuery}`);
    } catch (error) {
      lastError = error instanceof Error ? error.message : "fetch failed";
    }
  }
  throw new Error(`东财接口不可用：${lastError}`);
}

function mapRow(item, period) {
  const p = PERIOD_FIELDS[period];
  return {
    code: String(item.f12 ?? ""),
    market: toNumber(item.f13),
    name: String(item.f14 ?? ""),
    price: toNumber(item.f2),
    changePct: toNumber(item.f3),
    turnover: toNumber(item.f8),
    marketCap: toNumber(item.f20),
    mainNet: toNumber(item[p.main]),
    mainNetRate: toNumber(item[p.mainRate]),
    superNet: toNumber(item[p.super]),
    superRate: toNumber(item[p.superRate]),
    largeNet: toNumber(item[p.large]),
    largeRate: toNumber(item[p.largeRate]),
    midNet: toNumber(item[p.mid]),
    midRate: toNumber(item[p.midRate]),
    smallNet: toNumber(item[p.small]),
    smallRate: toNumber(item[p.smallRate]),
    leaderName: String(item.f204 ?? "").replace(/^-*$/, ""),
    leaderCode: String(item.f205 ?? "").replace(/^-*$/, ""),
  };
}

async function fetchFlowList(options) {
  const fid = PERIOD_FIELDS[options.period].fid;
  const po = options.order === "in" ? 1 : 0;
  const fs = options.fs || FS[options.kind];
  const query = [
    `pn=${options.pn}`,
    `pz=${options.pz}`,
    `po=${po}`,
    "np=1",
    "fltt=2",
    "invt=2",
    `fid=${fid}`,
    `fs=${fs}`,
    `fields=${periodFieldList(options.period)}`,
  ].join("&");
  const json = await eastmoneyJson(`/api/qt/clist/get?${query}`);
  const diff = (json.data && json.data.diff) || [];
  return {
    total: (json.data && json.data.total) || diff.length,
    list: diff.map((item) => mapRow(item, options.period)).filter((row) => row.code && row.name),
  };
}

async function fetchIndices() {
  const json = await eastmoneyJson(
    "/api/qt/ulist.np/get?fltt=2&invt=2&secids=1.000001,0.399001,0.399006,1.000688&fields=f2,f3,f6,f12,f14",
  );
  const diff = (json.data && json.data.diff) || [];
  return diff.map((item) => ({
    code: String(item.f12 ?? ""),
    name: String(item.f14 ?? ""),
    price: toNumber(item.f2),
    changePct: toNumber(item.f3),
    amount: toNumber(item.f6),
  }));
}

async function fetchShanghaiFlow() {
  const json = await eastmoneyJson(
    "/api/qt/stock/fflow/kline/get?lmt=0&klt=1&secid=1.000001&fields1=f1,f2,f3,f7&fields2=f51,f52,f53,f54,f55,f56",
  );
  const klines = (json.data && json.data.klines) || [];
  const series = klines.map((line) => toNumber(String(line).split(",")[1]));
  const step = Math.max(1, Math.floor(series.length / 48));
  const sampled = series.filter((_, i) => i % step === 0 || i === series.length - 1);
  return {
    latest: series.length ? series[series.length - 1] : 0,
    series: sampled,
  };
}

module.exports = {
  fetchFlowList,
  fetchIndices,
  fetchShanghaiFlow,
};
