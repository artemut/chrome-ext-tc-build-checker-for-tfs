(function() {
    
    function TfsClient() {
        
        // URL structure:
        // tfsserver:port/<collectionspath>/_apis/git/repositories/<repositoryid>/pullRequests/<pullrequestid>?api-version=3.0

        var getJson = function(url, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        var response = JSON.parse(xhr.responseText);
                        callback.onSuccess(response);
                    } else {
                        callback.onError(xhr.status, xhr.statusText);
                    }
                }
            }
            xhr.send();
        };
        
        this.getPullRequest = function(senderTabId, request) {
            var collectionsPath = request.collectionNames.join('/');
            var requestUrl = request.tfsUrl + '/' + collectionsPath + '/_apis/git/repositories/' + request.repositoryId + '/pullRequests/' + request.pullRequestId + '?api-version=3.0';
            getJson(requestUrl, {
                onSuccess: function(response) {
                    var lastCommitHash = response.status === 'completed' ? response.lastMergeCommit.commitId : response.lastMergeSourceCommit.commitId;
                    if (typeof lastCommitHash === 'string' && lastCommitHash.length > 0) {
                        var data = {
                            status: response.status,
                            isAbandoned: response.status === 'abandoned',
                            lastCommitHash: lastCommitHash
                        };
                        // send data to the tab that sent this request
                        chrome.tabs.sendMessage(senderTabId, { code: 'pull_request_response', success: true, data: data });
                    } else {
                        var data = {
                            status: 'Unexpected',
                            statusText: 'Could not get last commit hash'
                        };
                        // send data to the tab that sent this request
                        chrome.tabs.sendMessage(senderTabId, { code: 'pull_request_response', success: false, data: data });
                    }
                },
                onError: function(status, statusText) {
                    var data = {
                        status: status,
                        statusText: statusText
                    };
                    // send data to the tab that sent this request
                    chrome.tabs.sendMessage(senderTabId, { code: 'pull_request_response', success: false, data: data });
                }
            });
        };
    }

    chrome.runtime.onMessage.addListener(function(message, sender) {
        if (message.code === 'pull_request_request') {
            var client = new TfsClient();
            client.getPullRequest(sender.tab.id, message.request);
        }
    });
    
})()