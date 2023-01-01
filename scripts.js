
const deleteTabs = () => { // delete all discarded tabs in current window
  chrome.tabs.query({discarded: true, active: false, currentWindow: true}, function (tabs) {
    for (let tab of tabs) {
      chrome.tabs.remove(tab.id);
    }
  });
}

const discardAllTabs = (callback) => { // discard tabs ("deload" all inactive tabs)
  chrome.tabs.query({active: false}, function (tabs) {
    for (let tab of tabs) {
      chrome.tabs.discard(tab.id);
    }
  });
  callback();
}

const activateAllTabs = (callback) => { // make all inactive tabs active
  chrome.tabs.query({active: false}, function (tabs) {
    for (let tab of tabs) {
      chrome.tabs.update(tab.id, {active: true});
    }
  });
  callback();
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
var reloadButton = document.getElementById("reloadButton");
var inactiveList = document.getElementById("inactiveList");

var discardButton = document.getElementById("discardButton"); // for testing purposes
var activeButton = document.getElementById("activeButton"); // for testing purposes

var suggestionCount = 999;

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
          chrome.tabs.discard(tab.id);
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

          var deleteButton = document.createElement("button"); // delete button
          deleteButton.innerHTML = '<i class="gg-trash" style="color: black;"></i>';
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
          if (document.querySelectorAll('#inactiveList li').length < suggestionCount) inactiveList.appendChild(li);
        }
      });
      if (document.querySelectorAll('#inactiveList li').length >= suggestionCount) break;
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
  chrome.windows.getAll(function(windows) { // # windows, total
    var count = document.getElementById("numWindows");
    count.innerHTML = windows.length;
  });
  chrome.tabs.query({}, function (tabs) { // # tabs, total
    var count = document.getElementById("totalCount");
    count.innerHTML = tabs.length;
  });
  chrome.tabs.query({discarded: true}, function (tabs) { // # inactive tabs, total
    var count = document.getElementById("totalInactive");
    count.innerHTML = tabs.length;
  });

}

// const checkAlarm = () => {
//   chrome.alarms.getAll(function(alarms) {
//     var hasAlarm = alarms.some(function(a) {
//       return a.name == "3hr";
//     });
//     if (!hasAlarm) {
//       chrome.alarms.create("3hr", {
//         delayInMinutes: 0,
//         periodInMinutes: 180
//       });
//     }
//   });
// }

populateList(true);
loadStatistics();
// checkAlarm();

closeAllButton.onclick = function() {
  deleteTabs();
};

reloadButton.onclick = function() {
  populateList(true);
  loadStatistics();
};

// vvv ———— used for internal testing ———— vvv
//
discardButton.onclick = function() { // discard all tabs
  discardAllTabs(() => {
    populateList(true);
    loadStatistics();
  });
}

activeButton.onclick = function() { // activate all tabs
  activateAllTabs(() => {
    populateList(true);
    loadStatistics();
  });
}
//
// ^^^ ———— used for internal testing ———— ^^^

// chrome.alarms.onAlarm.addListener(function( alarm ) {
//   discardAllTabs();
// });