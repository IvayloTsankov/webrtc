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
    var offerSet = false;
    var answerSet = false;
    var constraints = {};

    var localStream = null;
    var remoteStream = null;

    var filterCandidate = null;
    var filterSDP = null;

    var schannel = null; // signalling channel
    var sbuffer = []; // cache early messages

    var iceSuccess = function(e) {};

    var iceFail = function(err) {
        fail(err);
    };

    var attachMediaStream = function(dom, stream) {
        dom.src = URL.createObjectURL(stream);
    };

    var flushSignalling = function() {
        for (var i in sbuffer) {
            onmessage(sbuffer[i]);
        }

        sbuffer = [];
    };

    var gotStream = function(stream) {
        console.log('got stream');

        localStream = stream;
        attachMediaStream(localVideo, stream);
        pc.addStream(stream);

        flushSignalling();

        if (active) {
            console.log('create offer');
            pc.createOffer(gotOffer, failGetOffer);
        }
    };

    var failStream = function(err) {
        fail(err);
    };

    var gotOffer = function(sdp) {
        console.log('got offer');
        if (filterSDP) {
            console.log('filter offer');
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
            offerSet = true;
            console.log('send offer');
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

    var setRemoteOffer = function() {
        if (!active) {
            offerSet = true;
            console.log('create answer');
            pc.createAnswer(gotAnswer, failGetAnswer);
        }
    };

    var failSetRemoteOffer = function() {
        fail(err); 
    };

    var gotAnswer = function(ans) {
        console.log('got answer');
        if (filterSDP) {
            console.log('filter answer');
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
            answerSet = true;
            console.log('send answer');
            schannel.send(JSON.stringify({
                'type': 'answer',
                'active_user': active,
                'session_id': sessionId,
                'payload': {
                    'message': JSON.stringify(answer.toJSON())
                }
            }));
        }
    };

    var failSetAnswerLocal = function() {
        fail(err);
    };

    var setRemoteAnswer = function() {
        answerSet = true;
        console.log('set answer remote');
    };

    var failSetRemoteAnswer = function(err) {
        fail(err);
    };

    var setIceCandidate = function(message) {
        var candidate = new RTCIceCandidate(message);
        pc.addIceCandidate(candidate).then(function() {
            console.log('set ice candidate successfuly');
        }).catch(function() {
            console.err('fail to set Ice candidate');
        });
    };

    var setSDP = function(message) {
        sdp = new RTCSessionDescription(message);
        if (sdp.type === 'offer') {
            pc.setRemoteDescription(sdp, setRemoteOffer, failSetRemoteOffer);
        } else if (sdp.type === 'answer') {
            pc.setRemoteDescription(sdp, setRemoteAnswer, failSetRemoteAnswer);
        } else {
            throw 'InvalidSDPTypeError';
        }
    };

    var onmessage = function(e) {
        if (localStream == null) {
            console.log('early message');
            sbuffer.push(e);
            return;
        }

        try {
            var packet = JSON.parse(e.data);
        } catch (e) {
            console.log('Fail to parse json');
            return;
        }

        console.log('receive message: ', packet.type);
        switch(packet.type) {
            case 'offer':
            case 'answer':
                var message = JSON.parse(packet.payload.message);
                setSDP(message);

                break;
            case 'candidate':
                var message = JSON.parse(packet.payload.message);
                setIceCandidate(message);

                break;
            default:
                console.log('unknown message: ', e.data); 
                break;
        }
    };

    function init() {
        if (signallingChannel) {
            schannel = signallingChannel;
            schannel.onmessage = onmessage;
        } else {
            throw 'InvalidChannelError';
        }

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
                    console.log('send ice candidate');
                    schannel.send(JSON.stringify({
                        'type': 'candidate',
                        'active_user': active,
                        'session_id': sessionId,
                        'payload': {
                            'message': JSON.stringify(e.candidate)
                        }
                    }));
                    //pc2.addIceCandidate(e.candidate, iceSuccess, iceFail);
                }
            } else {
                /*var sdp = pc.localDescription;
                var message = {
                    'type': active ? 'offer' : 'answer',
                    'active_user': active,
                    'session_id': sessionId,
                    'payload': {
                        'message': JSON.stringify(sdp.toJSON())
                    }
                }

                schannel.send(JSON.stringify(message));*/
            }
        };

        pc.onaddstream = function(e) {
            remoteStream = e.stream;
            console.log('webrtc connection established');
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
