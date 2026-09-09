function toNumber(value) {
  if (value === "-" || value == null || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatYi(n, digits = 2) {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1e8) return `${sign}${(abs / 1e8).toFixed(abs >= 1e10 ? 1 : digits)}亿`;
  if (abs >= 1e4) return `${sign}${(abs / 1e4).toFixed(abs >= 1e6 ? 0 : 1)}万`;
  if (abs === 0) return "0.00";
  return `${sign}${abs.toFixed(0)}`;
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
  pre: "竞价中",
  open: "交易中",
  lunch: "午间休市",
  closed: "已收盘",
};

function heatColor(value, maxAbs) {
  const t = Math.min(1, Math.abs(value) / Math.max(maxAbs, 1));
  const a = 0.18 + t * 0.62;
  return value >= 0 ? `rgba(255, 59, 92, ${a})` : `rgba(25, 230, 160, ${a})`;
}

module.exports = {
  toNumber,
  formatYi,
  formatPct,
  formatPrice,
  signedClass,
  marketStatus,
  STATUS_LABEL,
  heatColor,
};
