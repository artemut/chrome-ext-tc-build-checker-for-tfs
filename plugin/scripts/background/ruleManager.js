(function() {

    function RuleManager() {
        
        var buildRules = function(hostnames) {
            // TODO: add RequestContentScript action when it is fully supported on stable builds of Chrome
            // and remove content_scripts for <all_urls> from the manifest.json
            // https://developer.chrome.com/extensions/declarativeContent#type-RequestContentScript
            var rules = [];
            hostnames.forEach(function(hostname) {
                var rule = {
                    conditions: [
                        new chrome.declarativeContent.PageStateMatcher({
                            pageUrl: { hostEquals: hostname, pathContains: 'pullrequest/', schemes: [ 'http', 'https' ] }
                        })
                    ],
                    actions: [ new chrome.declarativeContent.ShowPageAction() ]
                };
                rules.push(rule);
            });
            return rules;
        };

        this.updateRules = function() {
            chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
                chrome.storage.sync.get({ options: [] }, function(items) {
                    var tfsHostnames = [];
                    items.options.forEach(function(current) {
                        if (tfsHostnames.indexOf(current.tfsHostname) === -1) {
                            tfsHostnames.push(current.tfsHostname);
                        } 
                    });
                    var rules = buildRules(tfsHostnames);
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