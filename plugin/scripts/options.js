(function() {
    
    function OptionManager() {
        
        var tfsHostnameInput = $('#tfs-hostname');
        var tcUrlsInput = $('#tc-urls');
        var statusBlock = $('#status');

        var validate = function(tfsHostname, tcUrls) {
            var valid = true;
            if (tfsHostname == '') {
                tfsHostnameInput.css({ borderColor: 'red' });
                valid = false;
            } else {
                tfsHostnameInput.css({ borderColor: '' });
            }

            if (tcUrls.length == 0) {
                tcUrlsInput.css({ borderColor: 'red' });
                valid = false;
            } else {
                tcUrlsInput.css({ borderColor: '' });
            }
            return valid;
        };

        this.saveOptions = function() {

            statusBlock.html('');

            var tfsHostname = tfsHostnameInput.val();
            var tcUrls = tcUrlsInput.val().split(/\r?\n/).filter(v => v != '');

            var isValid = validate(tfsHostname, tcUrls);
            if (isValid !== true) {
                return;
            }
            
            var items = { 'tfsHostname': tfsHostname, 'tcUrls': tcUrls };
            
            chrome.storage.sync.set(items, function() {
                chrome.runtime.sendMessage({ code: 'options_changed' });
                var statusBlock = $('#status');
                statusBlock.html('Options saved!');
                setTimeout(function() {
                    statusBlock.html('');
                }, 2000);
            });           

        };        

        this.restoreOptions = function() {
            chrome.storage.sync.get({ tfsHostname: '', tcUrls: [] }, function(items) {
                var tfsHostnameInput = $('#tfs-hostname');
                var tcUrlsInput = $('#tc-urls');
                tfsHostnameInput.val(items.tfsHostname);
                tcUrlsInput.val(items.tcUrls.join("\r\n"));
            });
        };
    }
    
    $(document).ready(function() {
        var optionManager = new OptionManager();
        optionManager.restoreOptions();

        $('#save').click(optionManager.saveOptions);
    });
})()