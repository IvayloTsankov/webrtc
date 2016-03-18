var generateSessionId = function() {
    var sessionId = null;
    var pathname = location.pathname;
    if (pathname) {
        var paths = pathname.split('/');
        sessionId = parseInt(paths[paths.length - 1]);
    }

    if (!sessionId || isNaN(sessionId)) {
        sessionId = parseInt(Math.random() * 1000000000);
    }

    return sessionId;
};

// success - callback if call is successfully established
// fail - callback if something goes wrong
// config - object with config of the call (see bellow)
// signallingChannel - signalling channel to 
// sessionId - number to identify session in server
// active - active call will initiate call
// localVideo - video element to render the local stream
// remoteVideo = video element to render the remote stream
//
// Usage:
//      // p1, p2 - RTCPeerConnections
//      var success = function(pc) {
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
//      };
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
//      var c = new Call(success, fail, config);
function Call(success, fail, config, signallingChannel, sessionId, active, localVideo, remoteVideo) {
    var self = this;
    var pc = null;
    var offer = null;
    var answer = null;
    var localStream = null;
    var remoteStream = null;
    var filterCandidate = null;
    var filterSDP = null;
    var schannel = null;

    var constraints = {};

    var iceSuccess = function(e) {};

    var iceFail = function(err) {
        fail(err);
    };

    var attachMediaStream = function(dom, stream) {
        dom.src = createObjectURL(stream);
    };

    var gotStream = function(stream) {
        localStream = stream;
        attachMediaStream(localVideo, stream);
        pc.addStream(stream);

        if (active) {
            pc.createOffer(gotOffer, failGetOffer);
        }
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

        pc.setLocalDescription(offer, setOfferLocal, failSetOfferLocal);
    };

    var failGetOffer = function(err) {
        fail(err);
    };

    var setOfferLocal = function() {
        if (active) {
            schannel.send(JSON.stringify({
                'type': 'offer',
                'active_user': true,
                'session_id': sessionId,
                'payload': {
                    'message': JSON.stringify(offer.toJSON())
                }
            }));
        }

        //pc2.setRemoteDescription(offer, setOfferRemote, failSetOfferRemote);
    };

    var failSetOfferLocal = function(err) {
        fail(err);
    };

    var setOfferRemote = function(pc) {
        if (!active) {
            pc.createAnswer(gotAnswer, failGetAnswer);
        }
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

        pc.setLocalDescription(answer, setAnswerLocal, failSetAnswerLocal);
    };

    var failGetAnswer = function(err) {
        fail(fail);
    };

    var setAnswerLocal = function() {
        console.log('answer is set locally');
        if (!active) {
            schannel.send(JSON.stringify({
                'type': 'answer',
                'active_user': active,
                'session_id': sessionId,
                'payload': {
                    'message': JSON.stringify(answer.toJSON());
                }
            }));
        }
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

        if (config) {
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
        }

        pc = new RTCPeerConnection(conf);
        pc.onicecandidate = function(e) {
            if (e.candidate) {
                if (filterCandidate(e.candidate)) {
                    schannel.send(JSON.stringify({
                        'type': 'candidate',
                        'active_user': active,
                        'session_id:', sessionId,
                        'payload': {
                            'message': JSON.stringify(e.candidate)
                        }
                    }));
                    //pc2.addIceCandidate(e.candidate, iceSuccess, iceFail);
                }
            } else {
                console.log('end candidate for pc');
            }
        };

        pc.onaddstream = function(e) {
            remoteStream = e.stream;
            console.log('connection established');
            attachMediaStream(remoteVideo, e.stream);
            success(pc);
        };

        navigator.getUserMedia(constraints, gotStream, failStream);
    };

    self.close = function() {
        pc.removeStream(remoteStream);
        localStream.stop();
        remoteStream.stop();
        pc.close();
        pc = null;
    };

    init();
}
