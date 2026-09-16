const SHARE_IMAGE = "/assets/duomi-avatar.png";
const SHARE_PATH = "/pages/index/index";
const SHARE_TITLE = "多米罗盘 · 公开序列观察台";

function shareAppMessage() {
  return {
    title: SHARE_TITLE,
    path: SHARE_PATH,
    imageUrl: SHARE_IMAGE,
  };
}

function shareTimeline() {
  return {
    title: SHARE_TITLE,
    query: "",
    imageUrl: SHARE_IMAGE,
  };
}

function enableShareMenu() {
  wx.showShareMenu({
    withShareTicket: false,
    menus: ["shareAppMessage", "shareTimeline"],
  });
}

module.exports = {
  shareAppMessage,
  shareTimeline,
  enableShareMenu,
};
