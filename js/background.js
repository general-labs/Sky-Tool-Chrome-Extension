var rockToolErroTrap = '';
const enableErrorTrap = false;

// Set console for background pages.
console = chrome.extension.getBackgroundPage().console;
const version = "1.0";
let id = 100;

// Helper function to display UI for NOS reporting window.
const display_msg_box = (tab) => {
  let urltoPass = tab.url;
  chrome.tabs.sendMessage(tab.id, { action: "open_msg_box", url: urltoPass }, function (response) { 
    return true;
  });
}

// Helper function to compile list of errors.
const TrackRequest = (info) => {
  if (enableErrorTrap) {
    const validDomains = new RegExp(/.*((blabla\.com)|(blabla\.com)|(blabla\.com)|(blabla\.net))/, "i");
    if (validDomains.test(info.initiator) && info.initiator && (info.statusCode == 500 || info.statusCode == 404)) {
      rockToolErroTrap = rockToolErroTrap + '\nCaptured Console Log Error ```Initiator:' + info.initiator + '\nError: ' + info.statusLine + '\nURL: ' + info.url + '```';
    }
  }
}

// Helper function to capture screenshot and send to NOS or other channels.
const captureScreeShot = (tab, msg, rockToolErroTrap) => {
  chrome.tabs.captureVisibleTab(function (screenshotUrl) {
    var viewTabUrl = chrome.extension.getURL('screenshot.html?id=' + id++)
    var targetId = null;

    chrome.tabs.onUpdated.addListener(function listener(tabId, changedProps) {
      // We are waiting for the tab we opened to finish loading.
      // Check that the tab's id matches the tab we opened,
      // and that the tab is done loading.
      if (tabId != targetId || changedProps.status != "complete")
        return;

      // Passing the above test means this is the event we were waiting for.
      // There is nothing we need to do for future onUpdated events, so we
      // use removeListner to stop getting called when onUpdated events fire.
      chrome.tabs.onUpdated.removeListener(listener);

      // Look through all views to find the window which will display
      // the screenshot.  The url of the tab which will display the
      // screenshot includes a query parameter with a unique id, which
      // ensures that exactly one view will have the matching URL.
      var views = chrome.extension.getViews();
      for (var i = 0; i < views.length; i++) {
        var view = views[i];
        if (view.location.href == viewTabUrl) {
          view.setScreenshotUrl(screenshotUrl, tab, msg, rockToolErroTrap);
          break;
        }
      }
    });

    chrome.tabs.create({ url: viewTabUrl }, function (tab) {
      targetId = tab.id;
    });
  });
}

// Get article id from URL
const getNID = (url) => {
  let seperateTags = url.split('?');
  let URLParts = seperateTags[0].split('-');
  let NIDSplit = URLParts[URLParts.length - 1].toString();
  let NIDParts = NIDSplit.split(/[^A-Za-z]/);
  let NIDParts2 = NIDSplit.split(NIDParts[0].toString());
  return NIDParts2[1];
}

// Helper function to compile associated URLs.
const processLinks = (domain, nodeID) => {
  let cmsURL, cmsDomain = '';

  if (domain == 'www.blablabal.com') {
    cmsDomain = 'http://somewhere.google.com';
  }

  cmsURL = `${cmsDomain}/node/${nodeID}/view`;
  cmsEndpoint = `${cmsDomain}/blabla/v1/blabla/${nodeID}`;
  return {
    cms: cmsURL,
    cms_endpoint: cmsEndpoint,
  };
}

/**
 * Create context menu options.
 */
chrome.contextMenus.create({ "id": "go_to_my_app", "title": 'Go To My APP', "contexts": ['all'] });
chrome.contextMenus.create({ "id": "display_msg_box", "title": 'Report To SUPPORT/Other Channels', "contexts": ['all'] });
let parentContextMenu = chrome.contextMenus.create({ "title": 'More Options', "contexts": ['all'] });

/**
 * Omnibox integration with a keyword "myapp".
 * If you type "myapp" and hit "tab" it will display a different search bar.
 * Rock search bar is used to quickly navigate around JIRA, OTHER APPs etc.
 */
chrome.omnibox.onInputChanged.addListener(
  function (text, suggest) {
    text = text.replace(" ", "");
    // Add suggestions to an array
    var suggestions = [];
    suggestions.push({ content: "https://your-custom-link-1.google.com" + text, description: "Open MY APP [SKY-" + text + ' ]' });
    suggestions.push({ content: `http://your-custom-link-2.google.com/${text}/edit`, description: `Open Article ${text}` });
    // Set first suggestion as the default suggestion
    chrome.omnibox.setDefaultSuggestion({ description: suggestions[0].description });
    // Remove the first suggestion from the array since we just suggested it
    suggestions.shift();
    // Suggest the remaining suggestions
    suggest(suggestions);
  }
);

// Get logged in user_id (GMAIL ID) info.
chrome.identity.getProfileUserInfo(function(userInfo) {
  let getUserName = userInfo.email.split('@');
  let userName = getUserName[0];
  chrome.storage.sync.set({sky_tool_user: userName}, function() {
  });
 });

 // Scrub domain name from any URL.
const getDoman = (url) => {
  let matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
  let domain = matches && matches[1];
  if (domain) {
    let domainPart = domain.split('.');
    let domainPartJoin;
    domainPartJoin = domainPart[0] + '.' + domainPart[1];
    if (domainPart[2]) {
      domainPartJoin = domainPartJoin + '.' + domainPart[2];
    }
    if (domainPart[3]) {
      domainPartJoin = domainPartJoin + '.' + domainPart[3];
    }
    return domainPartJoin;
  }
}

// Intercept URLs to trap http error codes.
chrome.webRequest.onCompleted.addListener (
    TrackRequest,
    {urls: ["<all_urls>"]},
    ["responseHeaders"]
);

// Context menu handler callback
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
  }, function(tabs) {
      let nodeID, domainFound, linkData;
      var tab = tabs[0];
      if (typeof tab === 'undefined') {
        alert("You have navigated away from current tab. Please click on your browsers tab you to perform action.");
      } else {
        nodeID = getNID(tab.url);
        domain = getDoman(tab.url);
      }
      switch (info.menuItemId) {
        case "go_to_my_app":
          if (isNaN(nodeID)) {
            alert("There is no article id found in the URL");
          } else {
            linkData = processLinks(domain, nodeID);
            window.open(linkData.cms, "_blank");
          }
          break;
        case "capture_screenshot":
          captureScreeShot(tab, msg, rockToolErroTrap);
          break;
        case "display_msg_box":
          display_msg_box(tab);
          break;
        default:
      }
  });
});

chrome.omnibox.onInputEntered.addListener(
  function(text) {
    text = text.replace(" ", "");
    chrome.tabs.getSelected(null, function(tab) {
      var url = (text.substr(0, 7) == 'http://' || text.substr(0, 8) == 'https://') ? text : 'https://custom-link-123.google.com/' + text;
      chrome.tabs.create({ url: url });
    });
  }
);

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.action == 'open_msg_box') {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tab) {
      tabURL = tab[0].url;
      captureScreeShot(tab, msg, rockToolErroTrap);
      rockToolErroTrap = '';
   });
  }
  return Promise.resolve("Dummy response to keep the console quiet");
});
