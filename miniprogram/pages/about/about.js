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
