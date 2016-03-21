'use strict'

function Recorder(stream) {
    var blobs = [];
    var rec = null;
    var defaultName = 'video.webm';
    var defaultType = 'video/webm';
    var defaultOptions = { 'mimeType': defaultType, bitsPerSecond: 100000 };
    var dataInterval = 1000; // 1 sec

    var saveData = function(ev) {
        blobs.push(ev.data);
    };

    function init() {
        rec = new MediaRecorder(stream);
        rec.ondataavailable = saveData;
    };


    this.start = function() {
        rec.start(dataInterval);
    };

    this.stop = function() {
        rec.stop();
    };

    this.download = function(name) {
        var superBlob = new Blob(blobs, { 'type': defaultType }); 
        
        var url = window.URL.createObjectURL(superBlob);
        var a = document.createElement('a');
        a.href = url;
        a.download = defaultName;

        a.style.display = 'none'; // hide
        document.body.appendChild(a);
        a.click();

        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    };

    init();
};

