const { env } = require("./config/cloud");

App({
  onLaunch() {
    if (!wx.cloud) return;
    wx.cloud.init({
      env,
      traceUser: false,
    });
  },
  globalData: {},
});
