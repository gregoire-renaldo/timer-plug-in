chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "closeTab") {
    chrome.tabs.remove(sender.tab.id);
  }
});

