const queryDiscardedTabs = ()=>{
    chrome.tabs.query({discarded:true, active:false, currentWindow: true}, function (tabs) {
        for (let tab of tabs) {
            chrome.tabs.remove(tab.id);
        }
    });
}

const discardAllTabs = ()=>{
    chrome.tabs.query({active:false}, function (tabs) {
        for (let tab of tabs) {
            chrome.tabs.discard(tab.id);
        }
    });
}
var visitTimes = {};
var finalTabs = [];
const getLeastRecentTabs = () => {
    chrome.tabs.query({active:false, currentWindow: true}, function (tabs) {
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

const populateList = (reload)=>{
    if (reload == true) {
        var lis = document.querySelectorAll('#inactiveList li');
        for(var i=0; li=lis[i]; i++) {
            li.parentNode.removeChild(li);
        }
    }
    chrome.tabs.query({active:false, currentWindow: true}, function (tabs) {
        for (let tab of tabs) {
            chrome.history.search({text: tab.url, maxResults: 1}, function (histories) {
                if(tab.discarded == true || histories[0].lastVisitTime < (Date.now() - 6*3600000)) {
                    chrome.tabs.discard(tab.id);
                    var li = document.createElement("li");
                    li.className = "list-group-item";
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
                    var deleteButton = document.createElement("button");
                    deleteButton.innerHTML = "x";
                    deleteButton.onclick = function() {
                        chrome.tabs.remove(tab.id);
                        li.parentNode.removeChild(li);
                        if (document.querySelectorAll('#inactiveList li').length == 0) setTimeout(function(){
                            populateList(true);
                        }, 500); 
                        loadStatistics();
                    };
                    td2.appendChild(deleteButton);
                    li.appendChild(tbl);
                    if (document.querySelectorAll('#inactiveList li').length < 10) inactiveList.appendChild(li);
                }
            });
            if (document.querySelectorAll('#inactiveList li').length >= 10) break;
        }
    })
}

const loadStatistics = () => {
    chrome.tabs.query({discarded:true, active:false, currentWindow: true}, function (tabs) {
        var count = document.getElementById("inactiveCount");
        count.innerHTML = "total number of inactive tabs: " + tabs.length;
    });
    chrome.tabs.query({currentWindow: true}, function (tabs) {
        var count = document.getElementById("totalCount");
        count.innerHTML = "total number of tabs: " + tabs.length;
    });
}

const checkAlarm = () => {
    chrome.alarms.getAll(function(alarms) {
        var hasAlarm = alarms.some(function(a) {
          return a.name == "3hr";
        });
        if (!hasAlarm) {
            chrome.alarms.create("3hr", {
                delayInMinutes: 0,
                periodInMinutes: 180
              });
        }
    });
}

populateList(true);
loadStatistics();
checkAlarm();

closeAllButton.onclick = function() {
    queryDiscardedTabs();
};

reloadButton.onclick = function() {
    populateList(true);
    loadStatistics();
};

chrome.alarms.onAlarm.addListener(function( alarm ) {
    discardAllTabs();
  });

