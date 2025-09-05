document.addEventListener('DOMContentLoaded', function() {
  const openAppButton = document.getElementById('openApp');
  const saveUrlButton = document.getElementById('saveUrl');
  const dashboardUrlInput = document.getElementById('dashboardUrl');

  const defaultUrl = 'http://192.168.1.21:3000/';

  // Load saved URL
  chrome.storage.local.get('dashboardUrl', function(data) {
    dashboardUrlInput.value = data.dashboardUrl || defaultUrl;
  });

  // Save URL
  saveUrlButton.addEventListener('click', function() {
    const newUrl = dashboardUrlInput.value;
    chrome.storage.local.set({ 'dashboardUrl': newUrl }, function() {
      console.log('Dashboard URL saved:', newUrl);
      alert('URL saved!');
    });
  });

  // Open Dashboard
  openAppButton.addEventListener('click', function() {
    const appUrl = dashboardUrlInput.value;
    
    chrome.tabs.query({ url: `${appUrl}*` }, function(tabs = []) {
      if (tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, { active: true });
        chrome.windows.update(tabs[0].windowId, { focused: true });
      } else {
        chrome.tabs.create({ url: appUrl });
      }
      window.close();
    });
  });
});