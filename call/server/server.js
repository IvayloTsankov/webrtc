var WebSocketServer = require('ws').Server;
var protocol = require('./protocol');
var SessionManager = require('./sessionmanager').SessionManager;

function Error(msg) {
    this.type = 'error';
    this.message = msg;
};

// Create websocket server 
var port = 8000;
var wss = new WebSocketServer({ 'port': port});
var sm = new SessionManager();
var clients = [];

console.log('listen on port: %d', port);

var onclose = function(peer) {
    var session = sm.findPeerSession(peer);
    if (session) {
        sm.deleteSession(peer, session.getId());
    }
};

var onmessage = function(peer, rawMessage) {
    var message = protocol.validate(peer, rawMessage);
    if (!message) {
        var e = new Error('Invalid JSON message');
        peer.send(JSON.stringify(e));
        peer.close();
        return;
    }

    console.log(message.type);
    switch(message.type) {
        case 'create_session':
            sm.createSession(peer, message);
            break;
        case 'join_session':
            sm.joinSession(peer, message);
            break;
        case 'delete_session':
            sm.deleteSession(peer, sessionId);
            break;
        case 'offer':
        case 'answer':
        case 'candidate':
            var session = sm.getSession(message.session_id);
            if (session) {
                if (!session.addMessage(peer, message)) {
                    console.log('Fail to add message');
                }
            } else {
                console.log('Fail to get session');
            }

            break;
        default:
            console.log('unsupported message');
    }
};

wss.on('connection', function(peer) {
    console.log('new client');

    clients.push(peer);
    peer.on('message', function(msg) { onmessage(peer, msg); });
    peer.on('close', function() { onclose(peer) });
});
