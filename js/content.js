/**
 * Content Script Page
 */

$(function() {
  // Display Support Ticket UI.
  rockTools__Display_Popup = (url, lastError) => {
    chrome.storage.sync.get(['sky_tool_user'], function(result) {
      let urlToPass = url;
      setTimeout(function () { 
          chrome.runtime.sendMessage({ 
            action: "open_msg_box", 
            data: '', 
            nos_reporter: '', 
            url: urlToPass, 
            options: {} }, (response) => {
            });
        }, 1000);
    });
  }

  /*****************************************************************
   * onMessage from the extension or tab (a content script)
   *****************************************************************/
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action == 'open_msg_box') {
      rockTools__Display_Popup(request.url, request.error);
    }
  });

});
