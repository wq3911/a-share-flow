import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "多米罗盘",
    short_name: "多米罗盘",
    description: "A股公开行情学习看板",
    start_url: "/",
    display: "standalone",
    background_color: "#03070f",
    theme_color: "#03070f",
    lang: "zh-CN",
  };
}
