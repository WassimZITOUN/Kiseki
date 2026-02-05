"use strict";

const ImpactFeedbackStyle = {
  Light: "light",
  Medium: "medium",
  Heavy: "heavy",
};

const NotificationFeedbackType = {
  Success: "success",
  Warning: "warning",
  Error: "error",
};

async function impactAsync() {}
async function notificationAsync() {}
async function selectionAsync() {}

module.exports = {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  impactAsync,
  notificationAsync,
  selectionAsync,
};
