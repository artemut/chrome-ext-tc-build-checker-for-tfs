(function() {

  function Popup() {

    this.initializeSections = function() {
      
      $('#go-to-options').click(openOptionsPage);
    };

    var openOptionsPage = function() {
      if (chrome.runtime.openOptionsPage) {
        // New way to open options pages, if supported (Chrome 42+).
        chrome.runtime.openOptionsPage();
      } else {
        // Reasonable fallback.
        window.open(chrome.runtime.getURL('options.html'));
      }
    };
  }

  $(document).ready(function() {
    var popup = new Popup();
    popup.initializeSections();
  });

})()

