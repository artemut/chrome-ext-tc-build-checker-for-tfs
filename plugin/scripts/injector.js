(function() {

    function Injector(tcUrls, tfsPageAdapter) {

        var tcTotalCount = tcUrls.length;
        var tcInProgressCount = 0;
        var tcSuccessCount = 0;
        var tcNotFoundCount = 0;
        var tcErrorCount = 0;

        this.run = function() {
            
            if (tcTotalCount === 0) {
                return;
            }

            tfsPageAdapter.buildMainView(tcTotalCount);
            tfsPageAdapter.buildLoaderBlock();

            sendPullRequestRequest();
            processPullRequestResponse();
        };

        var sendPullRequestRequest = function() {
            tfsPageAdapter.updateLoaderBlock('tfs');
            var request = {
                tfsUrl: document.location.origin,
                collectionNames: tfsPageAdapter.getCollectionNames(),
                repositoryId: tfsPageAdapter.getRepositoryId(),
                pullRequestId: tfsPageAdapter.getPullRequestId(),
            };
            chrome.runtime.sendMessage({ code: 'pull_request_request', request: request });
        };

        var processPullRequestResponse = function() {
            chrome.runtime.onMessage.addListener(function(message) {
                if (message.code === 'pull_request_response') {
                    if (message.success === true) 
                        if (typeof message.data.lastCommitHash === 'string' && message.data.lastCommitHash.length > 0)
                            onPullRequestSuccess(message.data);
                        else
                            onPullRequestError('Unexpected', 'Could not get last commit hash');
                    else 
                        onPullRequestError(message.data.status, message.data.statusText);
                }
            });
        };

        var onPullRequestSuccess = function(data) {
            if (data.isAbandoned !== true) {
                sendBuildStatusRequests(data.lastCommitHash);
                processBuildStatusResponses();
            } else {
                tfsPageAdapter.removeLoaderBlock();
                tfsPageAdapter.buildPullRequestAbandonedBlock();
            }
        };

        var onPullRequestError = function(status, statusText) {
            tfsPageAdapter.removeLoaderBlock();
            tfsPageAdapter.buildTfsErrorBlock(status, statusText);
        };

        var sendBuildStatusRequests = function(commitHash) {
            // send request for each TC url
            $.each(tcUrls, function(i, tcUrl) {
                tcInProgressCount++;
                tfsPageAdapter.updateLoaderBlock('tc', tcInProgressCount);
                chrome.runtime.sendMessage({ code: 'build_status_request', tcUrl: tcUrl, commitHash: commitHash });
            });
        };

        var processBuildStatusResponses = function() {
            // handle responses for each TC url
            chrome.runtime.onMessage.addListener(function(message) {
                if (message.code === 'build_status_response') {
                    tcInProgressCount--;
                    tfsPageAdapter.updateLoaderBlock('tc', tcInProgressCount);
                    if (message.success === true) 
                        onBuildStatusSuccess(message);
                    else if (message.data.status === 404) 
                        onBuildStatusNotFound(message);
                    else 
                        onBuildStatusError(message);
                    if (tcInProgressCount === 0) 
                        onBuildStatusLastResponse();
                }
            });
        };

        var onBuildStatusSuccess = function(message) {
            tfsPageAdapter.buildTcSuccessBlock(message.data);
            tcSuccessCount++;
        };

        var onBuildStatusNotFound = function(message) {
            tcNotFoundCount++;
        };

        var onBuildStatusError = function(message) {
            if (tcErrorCount === 0) {
                tfsPageAdapter.buildTcErrorBlock();
            }
            tfsPageAdapter.extendTcErrorBlockTitle(message.fromTcUrl, message.data.status, message.data.statusText);
            tcErrorCount++;
        };

        var onBuildStatusLastResponse = function() {
            tfsPageAdapter.removeLoaderBlock();
            if (tcNotFoundCount > 0 && tcSuccessCount === 0) {
                tfsPageAdapter.buildTcNotFoundBlock();
            }
        };
    }

    $(document).ready(function() {
        if (window.tfsPageAdapter) {
            // tfsPageAdapter is defined
            chrome.storage.sync.get({ options: [] }, function(items) {

                var tfsHostnames = [];
                var goodTfsHostnames = [];
                var tcUrls = [];
                $.each(items.options, function(i, current) {
                    var alreadyChecked = tfsHostnames.indexOf(current.tfsHostname) >= 0;
                    if (alreadyChecked && goodTfsHostnames.indexOf(current.tfsHostname) === -1) {
                        return;
                    }
                    else if (!alreadyChecked) {
                        tfsHostnames.push(current.tfsHostname);
                        if (!window.tfsPageAdapter.isInTfs(current.tfsHostname)) {
                            return;
                        } else {
                            goodTfsHostnames.push(current.tfsHostname);
                        }
                    }
                    tcUrls.push(current.tcUrl);
                });

                if (tcUrls.length > 0) {
                    var injector = new Injector(tcUrls, window.tfsPageAdapter);
                    injector.run();
                }
            });
        }
    });
    
})()