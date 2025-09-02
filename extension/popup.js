document.addEventListener('DOMContentLoaded', function() {
  const openAppButton = document.getElementById('openApp');
  
  openAppButton.addEventListener('click', function() {
    // T
    // he URL of the Next.js app
    const appUrl = 'http://192.168.1.21:3000/';
    
    // Check if a tab with the app URL is already open
    chrome.tabs.query({ url: appUrl }, function(tabs = []) {
      if (tabs.length > 0) {
        // If found, focus on that tab
        chrome.tabs.update(tabs[0].id, { active: true });
        chrome.windows.update(tabs[0].windowId, { focused: true });
      } else {
        // Otherwise, open a new tab
        chrome.tabs.create({ url: appUrl });
      }
      window.close(); // Close the popup
    });
  });
});
