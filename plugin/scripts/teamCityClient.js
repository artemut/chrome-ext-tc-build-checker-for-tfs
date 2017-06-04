(function() {
    
    function TeamCityClient() {
        
        // URL structure:
        // teamcityserver:port/<authType>/app/rest/<apiVersion>/<restApiPath>?<parameters>

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
        
        this.getBuildStatus = function(senderTabId, tcUrl, commitHash) {
            var requestUrl = tcUrl + '/guestAuth/app/rest/10.0/builds/revision:' + commitHash + ',running:any';
            getJson(requestUrl, {
                onSuccess: function(response) {
                    var data = {
                        buildUrl: response.webUrl,
                        fullName: response.buildType.projectName + ' > ' + response.buildType.name,
                        statusIconUrl: tcUrl + '/guestAuth/app/rest/10.0/builds/id:' + response.id + '/statusIcon'
                    };
                    // send data to the tab that sent this request
                    chrome.tabs.sendMessage(senderTabId, { code: 'build_status_response', success: true, fromTcUrl: tcUrl, data: data });
                },
                onError: function(status, statusText) {
                    var data = {
                        status: status,
                        statusText: statusText
                    };
                    // send data to the tab that sent this request
                    chrome.tabs.sendMessage(senderTabId, { code: 'build_status_response', success: false, fromTcUrl: tcUrl, data: data });
                }
            });
        };
    }

    chrome.runtime.onMessage.addListener(function(message, sender) {
        if (message.code === 'build_status_request') {
            var client = new TeamCityClient();
            client.getBuildStatus(sender.tab.id, message.tcUrl, message.commitHash);
        }
    });
    
})()