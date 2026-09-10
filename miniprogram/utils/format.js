const pinyin = require("./pinyin/index");

function toNumber(value) {
  if (value === "-" || value == null || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatYi(n, digits = 2) {
  return formatQty(n, digits);
}

function formatPct(n) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function formatPrice(n) {
  if (!n) return "--";
  return n.toFixed(2);
}

function signedClass(n) {
  if (n > 0) return "up";
  if (n < 0) return "down";
  return "flat";
}

function marketStatus(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value;
  if (weekday === "Sat" || weekday === "Sun") return "closed";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const t = hour * 60 + minute;
  if (t >= 9 * 60 + 15 && t < 9 * 60 + 30) return "pre";
  if (t >= 9 * 60 + 30 && t < 11 * 60 + 30) return "open";
  if (t >= 11 * 60 + 30 && t < 13 * 60) return "lunch";
  if (t >= 13 * 60 && t < 15 * 60) return "open";
  return "closed";
}

const STATUS_LABEL = {
  pre: "准备中",
  open: "进行中",
  lunch: "间歇中",
  closed: "已结束",
};

const INDEX_ALIAS = {
  "000001": "上",
  "399001": "深",
  "399006": "创",
  "000688": "科",
};

function aliasKey(code) {
  const s = String(code || "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h.toString(36).toUpperCase().padStart(4, "0").slice(0, 4);
}

function aliasIndexName(code) {
  return INDEX_ALIAS[String(code)] || `序列-${aliasKey(code)}`;
}

function aliasTopicName(code) {
  return `主题-${aliasKey(code)}`;
}

function aliasSampleName(name) {
  const s = String(name || "").trim();
  if (!s) return "";
  return pinyin
    .parse(s)
    .map((t) => String(t.target || "").charAt(0).toUpperCase())
    .join("");
}

const FINANCE_WORDS = [
  ["互联网金融", "HLWJR"],
  ["非银金融", "FYJR"],
  ["证券公司", "ZQGS"],
  ["证券", "ZQ"],
  ["金融", "JR"],
  ["银行", "YH"],
  ["保险", "BX"],
  ["券商", "QS"],
  ["期货", "QH"],
  ["信托", "XT"],
  ["投资", "TZ"],
  ["理财", "LC"],
  ["基金", "JJ"],
  ["债券", "ZQ"],
  ["股票", "GP"],
  ["股市", "GS"],
  ["融资", "RZ"],
  ["融券", "RQ"],
];

function maskFinanceWords(text) {
  let s = String(text || "");
  for (let i = 0; i < FINANCE_WORDS.length; i += 1) {
    const word = FINANCE_WORDS[i][0];
    const alias = FINANCE_WORDS[i][1];
    s = s.split(word).join(alias);
  }
  return s;
}

function formatQty(n, digits = 2) {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs === 0) return "0.00";
  if (abs >= 1e8) return `${sign}${(abs / 1e8).toFixed(abs >= 1e10 ? 1 : digits)}亿`;
  if (abs >= 1e4) return `${sign}${(abs / 1e4).toFixed(abs >= 1e6 ? 0 : 1)}万`;
  return `${sign}${abs.toFixed(0)}`;
}

function heatColor(value, maxAbs) {
  const t = Math.min(1, Math.abs(value) / Math.max(maxAbs, 1));
  const a = 0.18 + t * 0.62;
  return value >= 0 ? `rgba(255, 59, 92, ${a})` : `rgba(25, 230, 160, ${a})`;
}

module.exports = {
  toNumber,
  formatYi,
  formatQty,
  formatPct,
  formatPrice,
  signedClass,
  marketStatus,
  STATUS_LABEL,
  heatColor,
  aliasIndexName,
  aliasTopicName,
  aliasSampleName,
  maskFinanceWords,
};
