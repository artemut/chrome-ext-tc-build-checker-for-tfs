(function() {

  function Popup() {

    this.initializeSections = function() {
      
      chrome.storage.sync.get({ tfsHostname: '', tcUrls: [] }, function(items) {
          $('#tfs-hostname').html(items.tfsHostname);
          $('#tc-urls').html(items.tcUrls.join("<br/>"));
      });
      
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

