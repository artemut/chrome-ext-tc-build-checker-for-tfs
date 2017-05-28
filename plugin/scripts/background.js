(function() {

    function RuleManager() {
        
        var buildRules = function(hostname) {
            // TODO: add RequestContentScript action when it is fully supported on stable builds of Chrome
            // and remove content_scripts for <all_urls> from the manifest.json
            // https://developer.chrome.com/extensions/declarativeContent#type-RequestContentScript
            var rule = {
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { hostEquals: hostname, pathContains: 'pullrequest/', schemes: [ 'http', 'https' ] }
                    })
                ],
                actions: [ new chrome.declarativeContent.ShowPageAction() ]
            };
            return [ rule ];
        };

        this.updateRules = function() {
            chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
                chrome.storage.sync.get({ tfsHostname: '' }, function(items) {
                    var rules = buildRules(items.tfsHostname);
                    chrome.declarativeContent.onPageChanged.addRules(rules);
                });
            });
        }
    }

    var ruleManager = new RuleManager();
    chrome.runtime.onInstalled.addListener(ruleManager.updateRules);
    chrome.runtime.onMessage.addListener(function(message) {
        if (message.code === 'options_changed') {
            ruleManager.updateRules();
        }
    });
})()