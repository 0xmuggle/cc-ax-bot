// background.js

const AXIOM_WINDOW_NAME = 'AXIOM_TRADER_WINDOW';
const DASHBOARD_URL_PATTERN = 'http://192.168.1.21:3000/'; // Adjust as per your dashboard URL

// Function to get window.name from a tab via content script
async function getTabWindowName(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: () => window.name,
    });
    return results[0].result;
  } catch (e) {
    console.error(`Failed to get window.name for tab ${tabId}:`, e);
    return null;
  }
}

// Periodic check for Axiom windows
setInterval(async () => {
  // 1. Check if dashboard is open
  const dashboardTabs = await chrome.tabs.query({ url: `${DASHBOARD_URL_PATTERN}*` });
  const isDashboardOpen = dashboardTabs.length > 0;

  // 2. Find all Axiom trading windows
  const axiomTabs = await chrome.tabs.query({ url: 'https://axiom.trade/discover*' });

  let axiomTraderWindows = [];
  for (const tab of axiomTabs) {
    const windowName = await getTabWindowName(tab.id);
    if (windowName === AXIOM_WINDOW_NAME) {
      axiomTraderWindows.push(tab);
    }
  }

  // 3. Apply closure logic
  if (!isDashboardOpen) {
    // Dashboard is not open, close all Axiom trading windows
    for (const tab of axiomTraderWindows) {
      chrome.tabs.remove(tab.id);
      console.log(`Closed Axiom window (dashboard not open): ${tab.url}`);
    }
  } else if (axiomTraderWindows.length > 1) {
    // Dashboard is open, but multiple Axiom trading windows exist, close all
    for (const tab of axiomTraderWindows) {
      chrome.tabs.remove(tab.id);
      console.log(`Closed duplicate Axiom window: ${tab.url}`);
    }
  }
}, 5000); // Check every 5 seconds

chrome.runtime.onInstalled.addListener(() => {
  console.log("Axiom Trader Assistant extension installed.");
});
