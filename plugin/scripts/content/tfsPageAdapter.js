(function() {

    function Tfs2017PageAdapter() {

        // URL structure:
        // tfsserver:port/<collectionnames>/_git/<repositoryid>/pullrequest/<pullrequestid>

        var tcTotalCount;
        var mainView;
        var loaderBlock;
        var tcErrorBlock;

        this.isInTfs = function(tfsHostname) {
            return window.location.hostname === tfsHostname && window.location.pathname.indexOf('pullrequest/') >= 0;
        };

        this.getCollectionNames = function() {
            var paths = getUrlPaths();
            var gitPos = paths.indexOf('_git');
            if (gitPos >= 0) {
                return paths.slice(0, gitPos);
            }
            return [];
        };

        this.getRepositoryId = function() {
            var paths = getUrlPaths();
            var gitPos = paths.indexOf('_git');
            if (gitPos >= 0 && paths.length > gitPos + 1) {
                return paths[gitPos + 1];
            }
            return null;
        };

        this.getPullRequestId = function() {
            var paths = getUrlPaths();
            var prPos = paths.indexOf('pullrequest');
            if (prPos >= 0 && paths.length > prPos + 1) {
                return paths[prPos + 1];
            }
            return null;
        };

        var getUrlPaths = function() {
            return document.location.pathname.split('/').filter(path => path !== '');
        };

        this.isContainerLoaded = function() {
            var container = getContainer();
            return container.length > 0;
        };

        this.buildMainView = function(tcCount) {
            tcTotalCount = tcCount;
            var container = getContainer();
            mainView = $('<div/>', { 'class': 'chrome-ext-tc-build-checker_build-main-view' });
            var blockInfo = $('<div/>', { 'class': 'chrome-ext-tc-build-checker_info-block' });
            blockInfo.html('TeamCity builds: ');
            mainView.append(blockInfo);
            container.prepend(mainView);
        };

        var getContainer = function() {
            return $('.hub-title .description-row .right-group');
        };

        this.buildLoaderBlock = function() {
            loaderBlock = $('<div/>', { 'class': 'chrome-ext-tc-build-checker_loader-block' });
            var loaderIconUrl = 'chrome-extension://' + chrome.runtime.id + '/images/loader.gif';
            loaderBlock.html('<img src="' + loaderIconUrl + '"/><span></span>');
            mainView.append(loaderBlock);
        };

        this.removeLoaderBlock = function() {
            loaderBlock.remove();
        };

        this.buildTfsErrorBlock = function(status, statusText) {
            var block = $('<div/>', { 'class': 'chrome-ext-tc-build-checker_error-block' });
            var errorIconUrl = 'chrome-extension://' + chrome.runtime.id + '/images/error.png';
            var errorTitle = status + (statusText !== '' ? ': ' + statusText : '');
            block.html('<img src="' + errorIconUrl + '" title="' + errorTitle + '"/> Failed to get last commit');
            mainView.append(block);
        };

        this.buildPullRequestAbandonedBlock = function(status, statusText) {
            var block = $('<div/>', { 'class': 'chrome-ext-tc-build-checker_abandoned-block' });
            block.html('Pull request is abandoned');
            mainView.append(block);
        };

        this.updateLoaderBlock = function(state, inProgressCount) {
            if (state === 'tfs') {
                var blockSpan = $('span', loaderBlock);
                blockSpan.text('Getting last commit hash...');
            } else if (state === 'tc') {
                var blockSpan = $('span', loaderBlock);
                var text = tcTotalCount > 1 ? '(' + inProgressCount + '/' + tcTotalCount + ') Getting build status...' : 'Getting build status...';
                blockSpan.text(text);
            }
        };

        this.buildTcSuccessBlock = function(data) {
            var block = $('<div/>', { 'class': 'chrome-ext-tc-build-checker_success-block' });
            block.html('<a href="' + data.buildUrl + '" target="_blank" title="' + data.fullName + '"><img src="' + data.statusIconUrl + '"/></a>');
            mainView.append(block);
        };

        this.buildTcNotFoundBlock = function() {
            var block = $('<div/>', { 'class': 'chrome-ext-tc-build-checker_not-found-block' });
            var text = tcTotalCount === 1 ? 'Build was not found on the TC server' : 'Not found any build on other TC servers';
            block.html(text);
            mainView.append(block);
        };

        this.buildTcErrorBlock = function() {
            tcErrorBlock = $('<div/>', { 'class': 'chrome-ext-tc-build-checker_error-block' });
            var errorIconUrl = 'chrome-extension://' + chrome.runtime.id + '/images/error.png';
            var errorCounter = tcTotalCount > 1 ? '<span>0</span>/' + tcTotalCount + ' TC server(s) are not valid' : 'TC server is not valid';
            tcErrorBlock.html('<img src="' + errorIconUrl + '"/>' + errorCounter);
            mainView.append(tcErrorBlock);
        };

        this.extendTcErrorBlockTitle = function(tcUrl, status, statusText) {
            var blockImg = $('img', tcErrorBlock);
            var currentTitle = blockImg.attr('title');
            var errorInfo = tcUrl + ' (' + status + (statusText !== '' ? ': ' + statusText : '') + ')';
            var newTitle = currentTitle ? currentTitle + ', ' + errorInfo : 'Communication error: ' + errorInfo;
            blockImg.attr('title', newTitle);
            if (tcTotalCount > 1) {
                var blockSpan = $('span', tcErrorBlock);
                var currentVal = parseInt(blockSpan.text());
                blockSpan.text(++currentVal);
            }
        };
    }

    // set global variable to be used in the injector.js
    window.tfsPageAdapter = new Tfs2017PageAdapter();
    
})()