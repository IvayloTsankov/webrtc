// success - callback if call is successfully established
// fail - callback if something goes wrong
// config - object with config of the call (see bellow)
//
// Usage:
//      // ch1, ch2 - RTCDataChannel
//      // p1, p2 - RTCPeerConnections
//      var success = function(ch1, ch2, p1, p2) {
//          // do something with peerconnections
//      };
//
//      var fail = function(err) {
//          // do something with the error
//      };
//
//      var simpleConfig = {
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
//      };
//
//      var c = new TemasysDataCall(success, fail, config);
function TemasysDataCall(success, fail, config) {
    var self = this;

    AdapterJS.webRTCReady(function() {
        var pc1 = null;
        var pc2 = null;
        var offer = null;
        var answer = null;
        var localChannel = null;
        var remoteChannel = null;
        var filterCandidate = null;
        var filterSDP = null;

        var constraints = {};

        var iceSuccess = function(e) {};

        var iceFail = function(err) {
            fail(err);
        };

        var createDataChannel = function() {
            localChannel = pc1.createDataChannel('textStream', {reliable:true});
            pc1.createOffer(gotOffer, failGetOffer);
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

            pc2.ondatachannel = function(e) {
                remoteChannel = e.channel;
                console.log('connection established');
                success(localChannel, remoteChannel, pc1, pc2);
            };

            createDataChannel();
        };

        self.close = function() {
            localChannel.stop();
            remoteChannel.stop();
            pc1.close();
            pc2.close();
            pc1 = null;
            pc2 = null;
        }

        init();
    }); // AdapterJS.webRTCReady
};
