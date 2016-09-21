'use strict'


/*
 * options:
 *    audioBitsPerSecond: 128000
 *    videoBitsPerSecond: 2500000
 *    mimeType: 'video/mp4'
 */
class Recorder {
    constructor(stream, options) {
      this.defaults = {
        'name': 'video.webm',
        'mimeType': 'video/webm',
        'audioBitsPerSecond': 128000,
        'videoBitsPerSecond': 2500000,
        'dataInterval': 1000    // 1 second
      };

      this.config = {};
      if (!options) {
        this.config = this.defaults;
      } else {
        Object.keys(this.defaults).forEach((key) => {
          if (!options[key]) {
            this.config[key] = this.defaults[key];
          }
        });
      }

      console.log(this.config);

      this.blobs = [];
      this.rec = new MediaRecorder(stream, this.config);
      this.rec.ondataavailable = this._saveData.bind(this);
    }

    _saveData(ev) {
      this.blobs.push(ev.data);
    }

    start() {
      this.rec.start(this.config.name);
    }

    pause() {
      this.rec.pause();
    }

    resume() {
      this.rec.resume();
    }

    stop() {
      this.rec.stop();
    }

    clear() {
      if (this.rec.state === 'recording') {
        this.rec.stop();
      }

      this.blobs = [];
    }

    download(name) {
      var superBlob = new Blob(this.blobs, { 'type': this.config.mimeType });

      var url = window.URL.createObjectURL(superBlob);
      var a = document.createElement('a');
      a.href = url;
      a.download = name || this.config.name;

      a.style.display = 'none'; // hide
      document.body.appendChild(a);
      a.click();

      setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    }
};

