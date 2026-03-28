chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ask-ai",
    title: "Ask AI about this",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "ask-ai") {
    // Send message to popup or sidepanel if open
    // Since it's a popup, we might need a different approach or just store it in local storage
    chrome.storage.local.set({ lastSelection: info.selectionText }, () => {
      // Potentially open the popup if it's not open? 
      // Popups can't be opened programmatically by extensions usually.
      // But we can notify the user or just have it ready when they open it.
    });
  }
});
