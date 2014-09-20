window.onload = function () {
  // twitter.js
  var twtjs = document.createElement('script');
  twtjs.src = chrome.extension.getURL('scripts/twitter.js');
  document.getElementsByTagName('body')[0].appendChild(twtjs);
  console.log("Twitter.js is ready!");
  
  // main.js
  var sm = document.createElement('script');
  sm.src = chrome.extension.getURL('scripts/main.js');
  document.getElementsByTagName('body')[0].appendChild(sm);
}