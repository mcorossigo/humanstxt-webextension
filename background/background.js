var humansByDomain = {}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  let tabURL = new URL(tab.url)
  let tabDomain = tabURL.host
  if (humansByDomain[tabDomain]) return showPageAction(tab); // already cached
  callHumans(tab);
});

function callHumans(tab) {

  let tabURL = new URL(tab.url)
  let tabDomain = tabURL.host

  let humanstxtURL = tabURL.protocol + "//" + tabDomain + "/humans.txt"

  checkHumans(humanstxtURL, tab,
    function (tab) {
      showPageAction(tab);
      humansByDomain[new URL(tab.url).host] = {}
    }, function (tab) {
      hidePageAction(tab);
    }
  );
}

function loadHumans(url, tab, successCB, errorCB) {
  let headers = new Headers({
    "Content-Type": "text/plain; charset=utf-8",
    "Accept-Charset": "utf-8"
  });
  let request = { method: 'GET', headers: headers, cache: "force-cache" };

  fetch(url, request).then(function (response) {

    if (response.ok) {
      let contentType = response.headers.get("content-type");
      if (contentType && (contentType.indexOf("text/") !== -1)) {
        return response.text().then(function (content) {
          return successCB(content, tab);
        });
      } else {
        console.warn("Error loading " + url + ": invalid content type")
        return errorCB(tab);
      }
    } else {
      console.warn("Error loading " + url + ": no resource")
      return errorCB(tab);
    }

  }).catch(function (e) {
    console.error("Error loading " + url + ": connection error: " + e.message)
    return errorCB(tab);
  });
}

function checkHumans(url, tab, successCB, errorCB) {

  let headers = new Headers({
    "Content-Type": "text/plain; charset=utf-8",
    "Accept-Charset": "utf-8",
  });

  let request = { method: 'HEAD', headers: headers, cache: "force-cache" };

  fetch(url, request).then(function (response) {

    if (response.ok) {
      let contentType = response.headers.get("content-type");
      if (contentType && (contentType.indexOf("text/") !== -1)) {
        return successCB(tab);
      } else {
        console.warn("Error checking " + url + ": invalid content type")
        return errorCB(tab);
      }
    } else {
      console.warn("Error checking " + url + ": no resource")
      return errorCB(tab);
    }

  }).catch(function (e) {
    console.error("Error checking " + url + ": connection error: " + e.message)
    return errorCB(tab);
  });
}


function showPageAction(tab) {
  chrome.pageAction.show(tab.id);
  chrome.pageAction.setIcon({
    tabId: tab.id,
    path: "../icons/icon-48.png"
  });
}

function hidePageAction(tab) {
  chrome.pageAction.setIcon({
    tabId: tab.id,
    path: "../icons/icon-48.png"
  });
  chrome.pageAction.hide(tab.id);
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {

    if (request.action == "loadHumans") {

      let tabURL = new URL(request.tab.url)
      let tabDomain = tabURL.host

      let humanstxtURL = tabURL.protocol + "//" + tabDomain + "/humans.txt"

      if (humansByDomain[tabDomain] && humansByDomain[tabDomain].text) {
        sendResponse({ content: humansByDomain[tabDomain].text, url: humanstxtURL });
      }

      loadHumans(humanstxtURL, request.tab,
        function (content, tab) {

          showPageAction(tab);
          humansByDomain[new URL(tab.url).host] = {}
          humansByDomain[new URL(tab.url).host].text = content

          sendResponse({ content: content, url: humanstxtURL });

        }, function (tab) {
          hidePageAction(tab);
        }
      );

    }
    return true
  }
);
