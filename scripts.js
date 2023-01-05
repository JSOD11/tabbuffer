
const deleteTabs = () => { // delete all discarded tabs in current window
  chrome.tabs.query({discarded: true, active: false, currentWindow: true}, function (tabs) {
    for (let tab of tabs) {
      chrome.tabs.remove(tab.id);
    }
  });
}

var visitTimes = {}; // JS object with visit times
var finalTabs = []; // array that will hold oldest tabs

const getLeastRecentTabs = () => {
  chrome.tabs.query({active: false, currentWindow: true}, function (tabs) { // get all inactive tabs
    for (let tab of tabs) {
      chrome.history.search({text: tab.url, maxResults: 1}, function (histories) {
        visitTimes[histories[0].lastVisitTime] = tab;
      });
    }
  });
  var keys = Object.keys(visitTimes);
  finalTabs = [];
  for (key in keys) {
    finalTabs.push(visitTimes[key]);
  }
  return finalTabs;
}

var closeAllButton = document.getElementById("closeAllButton");
var inactiveList = document.getElementById("inactiveList");

const populateList = (reload) => {
  if (reload == true) {
    var lis = document.querySelectorAll('#inactiveList li');
    for (var i=0; li=lis[i]; i++) {
      li.parentNode.removeChild(li);
    }
  }
  chrome.tabs.query({active: false, currentWindow: true}, function (tabs) {
    for (let tab of tabs) {
      chrome.history.search({text: tab.url, maxResults: 1}, function (histories) {
        if (tab.discarded == true || histories[0].lastVisitTime < (Date.now() - 6*3600000)) {
          if (tab.discarded == false) chrome.tabs.discard(tab.id);
          var li = document.createElement("li");
          li.className = "list-group-item list-group-item-action";
          var tbl = document.createElement("table");
          var tblBody = document.createElement("tbody");
          tbl.appendChild(tblBody);
          var row =  tblBody.insertRow();
          const td2 = row.insertCell();
          const td1 = row.insertCell();
          td1.className = "tab-link";
          td1.appendChild(document.createTextNode(tab.title));
          td1.onclick = function() {
            chrome.tabs.update(tab.id, {active: true});
          }

          var deleteButton = document.createElement("button"); // delete button bg: #F8F9FA
          deleteButton.innerHTML = '<i class="gg-trash" style="color: rgb(34, 34, 34);"></i>';
          deleteButton.onclick = function() {
            chrome.tabs.remove(tab.id);
            li.parentNode.removeChild(li);
            if (document.querySelectorAll('#inactiveList li').length == 0) setTimeout(function() {
              populateList(true);
            }, 500);
            loadStatistics();
          };

          td2.appendChild(deleteButton);
          li.appendChild(tbl);
          inactiveList.appendChild(li);
        }
      });
    }
  });
}

const loadStatistics = () => { // generate statistics in popup window

  // stats for current window
  chrome.tabs.query({currentWindow: true}, function (tabs) { // # tabs in current window
    var count = document.getElementById("windowCount");
    count.innerHTML = tabs.length;
  });
  chrome.tabs.query({discarded: true, active: false, currentWindow: true}, function (tabs) { // # inactive tabs in current window
    var count = document.getElementById("inactiveCount");
    count.innerHTML = tabs.length;
  });

  // stats for all windows
  chrome.tabs.query({}, function (tabs) { // # tabs, total
    var count = document.getElementById("totalCount");
    count.innerHTML = tabs.length;
  });
  chrome.tabs.query({discarded: true}, function (tabs) { // # inactive tabs, total
    var count = document.getElementById("totalInactive");
    count.innerHTML = tabs.length;
  });

}

populateList(true);
loadStatistics();
checkAlarm();

closeAllButton.onclick = function() {
  deleteTabs();
};