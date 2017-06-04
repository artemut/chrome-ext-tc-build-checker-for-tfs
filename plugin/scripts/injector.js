(function() {

    function Injector(tcUrls, tfsPageAdapter) {

        var totalCount = tcUrls.length;
        var inProgressCount = 0;
        var successCount = 0;
        var notFoundCount = 0;
        var errorCount = 0;
        var loaderBlock;
        var errorBlock;

        this.run = function() {

            if (tcUrls.length === 0) {
                return;
            }

            var container = tfsPageAdapter.getAppropriateContainer();
            if (container.length === 0) {
                return;
            }
            
            // TODO: replace
            var commitHash = '2ccf8e2c48f11c45bf789b8e2031e97d64f89732';
            
            var mainView = buildMainView();
            container.prepend(mainView);

            // send request for each TC url
            $.each(tcUrls, function(i, tcUrl) {
                if (inProgressCount === 0) {
                    loaderBlock = buildLoaderBlock();
                    mainView.append(loaderBlock);
                }
                updateLoaderBlock(1);
                inProgressCount++;
                // send request for the current TC url
                chrome.runtime.sendMessage({ code: 'build_status_request', tcUrl: tcUrl, commitHash: commitHash });
            });
            
            // handle responses
            chrome.runtime.onMessage.addListener(function(message) {
                if (message.code === 'build_status_response') {
                    inProgressCount--;
                    updateLoaderBlock(-1);
                    if (message.success === true) {
                        var blockHtml = buildSuccessBlock(message.data);
                        mainView.append(blockHtml);
                        successCount++;
                    } else {
                        if (message.data.status === 404) {
                            notFoundCount++;
                        } else {
                            if (errorCount === 0) {
                                errorBlock = buildErrorBlock();
                                mainView.append(errorBlock);
                            }
                            extendErrorBlockTitle(message.data, message.fromTcUrl);
                            errorCount++;
                        }
                    }
                    if (inProgressCount === 0) {
                        loaderBlock.remove();
                        if (notFoundCount > 0 && successCount === 0) {
                            notFoundBlock = buildNotFoundBlock();
                            mainView.append(notFoundBlock);
                        }
                    }
                }
            });
        };

        var buildMainView = function() {
            var block = $('<div/>', { 'class': 'chrome-ext-tc-build-checker_build-main-view' });
            var blockInfo = $('<div/>', { 'class': 'chrome-ext-tc-build-checker_info-block' });
            blockInfo.html('TeamCity builds: ');
            block.append(blockInfo);
            return block;
        };

        var buildLoaderBlock = function() {
            var block = $('<div/>', { 'class': 'chrome-ext-tc-build-checker_loader-block' });
            var loaderIconUrl = 'chrome-extension://' + chrome.runtime.id + '/images/loader.gif';
            var progressBlock = totalCount > 1 ? '<span>0</span>/' + totalCount : '';
            block.html('<img src="' + loaderIconUrl + '"/>' + progressBlock);
            return block;
        };

        var updateLoaderBlock = function(change) {
            if (totalCount > 1) {
                var blockSpan = $('span', loaderBlock);
                var currentVal = parseInt(blockSpan.text());
                var newVal = currentVal + change;
                blockSpan.text(newVal);
            }
        };

        var buildSuccessBlock = function(data) {
            var block = $('<div/>', { 'class': 'chrome-ext-tc-build-checker_success-block' });
            block.html('<a href="' + data.buildUrl + '" target="_blank" title="' + data.fullName + '"><img src="' + data.statusIconUrl + '"/></a>');
            return block;
        };

        var buildNotFoundBlock = function() {
            var block = $('<div/>', { 'class': 'chrome-ext-tc-build-checker_not-found-block' });
            var text = totalCount === 1 ? 'Build was not found on the TC server' : 'Not found any build on other TC servers';
            block.html(text);
            return block;
        };

        var buildErrorBlock = function() {
            var block = $('<div/>', { 'class': 'chrome-ext-tc-build-checker_error-block' });
            var errorIconUrl = 'chrome-extension://' + chrome.runtime.id + '/images/error.png';
            var errorCounter = totalCount > 1 ? '<span>0</span>/' + totalCount + ' TC server(s) are not valid' : 'TC server is not valid';
            block.html('<img src="' + errorIconUrl + '"/>' + errorCounter);
            return block;
        };

        var extendErrorBlockTitle = function(data, tcUrl) {
            var blockImg = $('img', errorBlock);
            var currentTitle = blockImg.attr('title');
            var errorInfo = tcUrl + ' (' + data.status + (data.statusText !== '' ? ' ' + data.statusText : '') + ')';
            var newTitle = currentTitle ? currentTitle + ', ' + errorInfo : 'Communication error: ' + errorInfo;
            blockImg.attr('title', newTitle);
            if (totalCount > 1) {
                var blockSpan = $('span', errorBlock);
                var currentVal = parseInt(blockSpan.text());
                blockSpan.text(++currentVal);
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