// success - callback if call is successfully established
// fail - callback if something goes wrong
// config - object with config of the call (see bellow)
//
// localVideo - (optional) DOM element to show local video in
// remoteVideo - (optional) DOM element to show remove video in
//
// Usage:
//      // p1, p2 - RTCPeerConnections
//      var success = function(p1, p2) {
//          // do something with peerconnections
//      };
//
//      var fail = function(err) {
//          // do something with the error
//      };
//
//      var simpleConfig = {
//          'video': true/false,
//          'audio': true/false 
//
//          // optional
//          'iceServers': [{
//	            url: 'turn:numb.viagenie.ca',
//	            credential: 'muazkh',
//	            username: 'webrtc@live.com'
//          }]
//
//          // optional if you want to filter some of the candidates
//          candidateFilter: function(candidate) { return candidate.type === 'tcp'; },
//
//          // optional if you want to filter something from sdp
//          sdpFiter: function(sdp, 'offer/asnwer') { // do something with sdp AND RETURN sdp }
//      }
//
//      var config = {
//          iceServers: [{
//	            url: 'turn:numb.viagenie.ca',
//	            credential: 'muazkh',
//	            username: 'webrtc@live.com'
//          }],
//
//          audio: true/false,
//          video: {
//              mandatory: {
//                  maxWidth: 320,
//                  maxHeight: 240
//              }
//          }
//      };
//
//      var c = new TemasysCall(success, fail, config);
function TemasysCall(success, fail, config, localVideo, remoteVideo) {
    var self = this;

    AdapterJS.webRTCReady(function() {
        var pc1 = null;
        var pc2 = null;
        var offer = null;
        var answer = null;
        var localStream = null;
        var remoteStream = null;
        var filterCandidate = null;
        var filterSDP = null;

        var constraints = {};

        var iceSuccess = function(e) {};

        var iceFail = function(err) {
            fail(err);
        };

        var gotStream = function(stream) {
            localStream = stream;
            attachMediaStream(localVideo, stream);
            pc1.addStream(stream);
            pc1.createOffer(gotOffer, failGetOffer);
        };

        var failStream = function(err) {
            fail(err);
        };

        var gotOffer = function(sdp) {
            if (filterSDP) {
                offer = filterSDP(sdp, 'offer');
            } else {
                offer = sdp;
            }

            pc1.setLocalDescription(offer, setOfferLocal, failSetOfferLocal);
        };

        var failGetOffer = function(err) {
            fail(err);
        };

        var setOfferLocal = function() {
            pc2.setRemoteDescription(offer, setOfferRemote, failSetOfferRemote);
        };

        var failSetOfferLocal = function(err) {
            fail(err);
        };

        var setOfferRemote = function(pc) {
            pc2.createAnswer(gotAnswer.bind(this), failGetAnswer);
        };

        var failSetOfferRemote = function(pc) {
            fail(err); 
        };

        var gotAnswer = function(ans) {
            if (filterSDP) {
                answer = filterSDP(ans, 'answer');
            } else {
                answer = ans;
            }

            pc2.setLocalDescription(answer, setAnswerLocal, failSetAnswerLocal);
        };

        var failGetAnswer = function(err) {
            fail(fail);
        };

        var setAnswerLocal = function() {
            pc1.setRemoteDescription(answer, setRemoteAnswer, failSetRemoteAnswer);
        };

        var failSetAnswerLocal = function() {
            fail(err);
        };

        var setRemoteAnswer = function() {
            console.log('negotiation done');
        };

        var failSetRemoteAnswer = function(err) {
            fail(err);
        };

        function init() {
            var conf = {
                iceServers: []
            };

            var iceServers = config['iceServers'];
            if (iceServers) {
                conf.iceServers = iceServers;
            }

            var candidateFilter = config['candidateFilter'];
            if (candidateFilter) {
                filterCandidate = candidateFilter;
            } else {
                filterCandidate = function(candidate) { return true; };
            }

            var sdpFilter = config['sdpFilter'];
            if (sdpFilter) {
                filterSDP = sdpFilter;
            }

            if (typeof(config['video']) !== 'undefined') {
                constraints['video'] = config['video'];
            }

            if (typeof(config['audio']) !== 'undefined') {
                constraints['audio'] = config['audio'];
            }

            pc1 = new RTCPeerConnection(conf);
            pc2 = new RTCPeerConnection(conf);
            pc1.onicecandidate = function(e) {
                if (e.candidate) {
                    if (filterCandidate(e.candidate)) {
                        pc2.addIceCandidate(e.candidate, iceSuccess, iceFail);
                    }
                } else {
                    console.log('end candidate for pc1');
                }
            };

            pc2.onicecandidate = function(e) {
                if (e.candidate) {
                    if (filterCandidate(e.candidate)) {
                        pc1.addIceCandidate(e.candidate, iceSuccess, iceFail);
                    }
                } else {
                    console.log('end candidate for pc2');
                }
            };

            pc2.onaddstream = function(e) {
                remoteStream = e.stream;
                console.log('connection established');
                attachMediaStream(remoteVideo, e.stream);
                success(pc1, pc2);
            };

            navigator.getUserMedia(constraints, gotStream, failStream);
        };

        self.close = function() {
            pc1.removeStream(localStream);
            pc2.removeStream(remoteStream);
            localStream.stop();
            remoteStream.stop();
            pc1.close();
            pc2.close();
            pc1 = null;
            pc2 = null;
        }

        init();
    }); // AdapterJS.webRTCReady
}
