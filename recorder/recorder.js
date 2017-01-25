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
          this.config[key] = options[key] || this.defaults[key];
        });
      }

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
      if (this.rec.state == 'paused') {
        this.rec.resume();
      } else {
        console.error('Failed to resume webrtc recorder. Bad state %s',
                      this.rec.state);
      }
    }

    stop() {
      if (this.rec.state !== 'inactive') {
        this.rec.stop();
      }
    }

    get state() {
      return this.rec.state;
    }

    clear() {
      this.stop();
      this.blobs = [];
    }

    merge() {
      var superBlob = new Blob(this.blobs, { 'type': this.config.mimeType });
      return superBlob;
    }

    download(name) {
      let downloadName = this._prepareName(name);
      let data = this.merge();

      let url = window.URL.createObjectURL(data);
      let a = document.createElement('a');
      a.href = url;
      a.download = downloadName;

      a.style.display = 'none'; // hide
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    }

    upload(url, name) {
      return new Promise((resolve, reject) => {
        let data = this.merge();
        if (data.size == 0) {
          console.error('Failed to upload empty file');
          return;
        }

        let uploadName = this._prepareName(name);

        let form = new FormData();
        form.append('file', data, uploadName)

        fetch(url, {
          'method': 'POST',
          'mode': 'cors',
          'body': form
        }).then((response) => {
          response.text().then((data) => {
            if (data.type == 'error') {
              return reject(data);
            } else {
              return resolve(data);
            }
          }).catch(reject);
        }).catch(reject);
      });
    }

    _prepareName(name) {
      let filename = name || this.config.name;
      let ext = this.config.mimeType.split('/')[1];
      return filename + '.' + ext;
    }
};

export default Recorder;
