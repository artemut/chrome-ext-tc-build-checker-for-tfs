(function() {

    document.addEventListener('DOMContentLoaded', function() {
        if (chrome.runtime.getManifest) {
            var manifest = chrome.runtime.getManifest();
            if (manifest && manifest.name) {
                document.getElementById('plugin_name').innerHTML = manifest.name;
            }
        }
        // links cannot be opened from popup page
        // thus, need to handle click event and call chrome.tabs.create({...});
        var links = document.getElementsByTagName('a');
        for (var i = 0, max = links.length; i < max; i++) {
            var a = links[i];
            a.addEventListener('click', function() {
                var href = this.getAttribute('href');
                chrome.tabs.create({ url: href });
            });
        }
    });

})()