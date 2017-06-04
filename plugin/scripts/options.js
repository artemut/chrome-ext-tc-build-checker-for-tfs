(function() {
    
    function OptionManager() {
        
        var table = $('#options-table');
        var statusBlock = $('#status');

        this.addRow = function() {
            var firstRow = $('tr.data:first', table);
            var newRow = firstRow.clone();
            $('input.tfs-hostname', newRow).val('');
            $('input.tc-url', newRow).val('');
            table.append(newRow);
            $('button.remove', newRow).click(function() {
                var removeBtn = $(this);
                removeRow(removeBtn);
            });
            // enable 'Remove' buttons (because now there are at least 2 rows)
            $('tr.data button.remove[disabled="disabled"]', table).removeAttr('disabled');
        };

        var removeRow = function(removeBtn) {
            var rowCountBeforeRemoval = $('tr.data', table).length;
            var currentRow = removeBtn.closest('tr');
            currentRow.remove();
            if (rowCountBeforeRemoval === 2) {
                // disable 'Remove' button for the remaining row
                $('tr.data button.remove', table).attr('disabled', 'disabled');
            }
        };

        var validate = function(tfsHostnameInput, tcUrlInput) {
            var valid = true;
            if (tfsHostnameInput.val() == '') {
                tfsHostnameInput.css({ borderColor: 'red' });
                valid = false;
            } else {
                tfsHostnameInput.css({ borderColor: '' });
            }

            if (tcUrlInput.val() == 0) {
                tcUrlInput.css({ borderColor: 'red' });
                valid = false;
            } else {
                tcUrlInput.css({ borderColor: '' });
            }
            return valid;
        };

        this.saveOptions = function() {

            statusBlock.html('');

            var options = [];
            var isValidGlobal = true;
            $('tr.data', table).each(function() {
                var row = $(this);
                var tfsHostnameInput = $('input.tfs-hostname', row);
                var tcUrlInput = $('input.tc-url', row);
                var isValidCurrent = validate(tfsHostnameInput, tcUrlInput);
                if (isValidCurrent === true) {
                    var tfsHostname = tfsHostnameInput.val();
                    var tcUrl = tcUrlInput.val();
                    var isDuplicate = options.some(function(value) {
                        return value.tfsHostname === tfsHostname && value.tcUrl === tcUrl;
                    });
                    if (!isDuplicate) {
                        options.push({ tfsHostname: tfsHostname, tcUrl: tcUrl });
                    }
                } else {
                    isValidGlobal = false;
                }
            });

            if (isValidGlobal !== true) {
                return;
            }

            var items = { 'options': options };
            
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
            var self = this;
            if (chrome.storage) {
                chrome.storage.sync.get({ options: [] }, function(items) {
                    $.each(items.options, function(i, current) {
                        if (i > 0) {
                            self.addRow();
                        }
                        var lastRow = $('tr.data:last', table);
                        $('input.tfs-hostname', lastRow).val(current.tfsHostname);
                        $('input.tc-url', lastRow).val(current.tcUrl);
                    });
                    // bind remove event on the first row
                    $('tr.data:first button.remove', table).click(function() {
                        var removeBtn = $(this);
                        removeRow(removeBtn);
                    });
                });
            }
        };
    }
    
    $(document).ready(function() {
        var optionManager = new OptionManager();
        optionManager.restoreOptions();

        $('#add').click(optionManager.addRow);
        $('#save').click(optionManager.saveOptions);
    });
})()