const {
  shareAppMessage,
  shareTimeline,
  enableShareMenu,
} = require("../../utils/share");

Page({
  onLoad() {
    enableShareMenu();
  },

  onShareAppMessage() {
    return shareAppMessage();
  },

  onShareTimeline() {
    return shareTimeline();
  },
});
