const express = require("express");

const HOSTS = [
  "https://push2delay.eastmoney.com",
  "https://push2.eastmoney.com",
];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const app = express();
app.use(express.json());

let count = 0;

app.post("/api/count", (req, res) => {
  const action = req.body && req.body.action;
  if (action === "inc") count += 1;
  else if (action === "dec") count -= 1;
  else if (action === "reset") count = 0;
  res.json({ count });
});

function assertEastmoneyPath(pathAndQuery) {
  const path = String(pathAndQuery || "").split("?")[0];
  if (!path.startsWith("/api/qt/")) {
    throw new Error("invalid path");
  }
}

async function fetchEastmoney(pathAndQuery) {
  assertEastmoneyPath(pathAndQuery);
  let lastError = "empty reply";
  for (const host of HOSTS) {
    try {
      const res = await fetch(`${host}${pathAndQuery}`, {
        headers: {
          "User-Agent": UA,
          Referer: "https://data.eastmoney.com/bkzj/hy.html",
          Accept: "application/json,text/plain,*/*",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        continue;
      }
      return await res.json();
    } catch (error) {
      lastError = error instanceof Error ? error.message : "fetch failed";
    }
  }
  throw new Error(lastError);
}

app.get("/api/proxy", async (req, res) => {
  try {
    const pathAndQuery = req.query.p;
    if (!pathAndQuery) {
      res.status(400).json({ error: "missing p" });
      return;
    }
    const data = await fetchEastmoney(String(pathAndQuery));
    res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "proxy failed";
    res.status(502).json({ error: message });
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT) || 80;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
