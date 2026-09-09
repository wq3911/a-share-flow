import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #03070f 0%, #0b1c2e 55%, #1a0b12 100%)",
          color: "#d7f6ff",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 10, color: "#3df2ff" }}>A-SHARE STUDY BOARD</div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, letterSpacing: 8, marginTop: 16 }}>多米罗盘</div>
        <div style={{ display: "flex", fontSize: 32, marginTop: 12, color: "#6f8fa3" }}>公开盘面学习看板</div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 24, color: "#3df2ff" }}>仅供学习 · 不构成投资建议</div>
      </div>
    ),
    size,
  );
}
