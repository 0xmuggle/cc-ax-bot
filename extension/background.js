// background.js - Kept minimal as tab management is now handled by the app.

chrome.runtime.onInstalled.addListener(() => {
  console.log("Axiom Trader Assistant extension installed.");
});