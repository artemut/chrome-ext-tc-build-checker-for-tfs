(function() {

    function Tfs2017PageAdapter() {

        this.isInTfs = function(tfsHostname) {
            return window.location.hostname === tfsHostname && window.location.pathname.indexOf('pullrequest/') >= 0;
        };

        this.getAppropriateContainer = function() {
            return $('.hub-title .description-row .right-group');
        };
    }

    // set global variable
    window.tfsPageAdapter = new Tfs2017PageAdapter();
    
})()