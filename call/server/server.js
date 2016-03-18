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
    session.removePeer(peer);
};

var onmessage = function(ws, rawMessage) {
    var message = protocol.validate(ws, rawMessage);
    if (!message) {
        console.log('Invalid message: ', rawMessage);
        ws.close();
        return;
    }

    console.log(message.type);
    switch(message.type) {
        case 'create_session':
            if (!sm.createSession(ws, message)) {
                ws.send(JSON.stringify(new Error('Fail to create session')));
                ws.close();
            }

            break;
        case 'join_session':
            if (!sm.joinSession(ws, message)) {
                ws.send(JSON.stringify(new Error('No session with id: ' + message.session_id)));
                ws.close();
            }

            break;
        case 'delete_session':
            if (!sm.deleteSession(message)) {
                ws.close();
            }

            break;
        case 'offer':
        case 'answer':
        case 'candidate':
            var session = sm.getSession(message.session_id);
            if (session) {
                if (!session.addMessage(ws, message)) {
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

wss.on('connection', function(ws) {
    console.log('new client');

    clients.push(ws);
    ws.on('message', function(msg) { onmessage(ws, msg); });
    ws.on('close', function() { onclose(ws) });
});
