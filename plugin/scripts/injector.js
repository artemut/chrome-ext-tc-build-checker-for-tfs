(function() {
    
    function Injector() {

        this.isInTfs = function(tfsHostname) {
            return window.location.hostname === tfsHostname && window.location.pathname.indexOf('pullrequest/') >= 0;
        }

        this.addBuildStatusView = function() {
            var descriptionRightGroup = $('.hub-title .description-row .right-group');
            if (descriptionRightGroup.length > 0) {
                var buildStatusView = $("<div>This is build view!</div>");
                buildStatusView.css({ padding: '10px', border: '1px solid silver;' });
                descriptionRightGroup.prepend(buildStatusView);
            }
        };
    }

    chrome.storage.sync.get({ tfsHostname: '', tcUrls: [] }, function(items) {
        if (items.tfsHostname !== '') {
            var injector = new Injector();
            if (injector.isInTfs(items.tfsHostname)) {
                injector.addBuildStatusView();
            }
        }
    });
    
})()