ebml = require('ebml');


function WebMFile() {
    var self = this;
    this.ebml = ebml.schema['1a45dfa3'].name;
    this.segment = ebml.schema['18538067'].name;


    this.calcDuration = function() {

    };

    this.getDuration = function() {

    };

    this.setTimeCodeScale = function() {

    };

    this.setMuxingApp = function(name) {

    };

    this.setWritingApp = function(name) {

    };

    function init() {
    };

    init();
};


module.exports = WebMFile;
