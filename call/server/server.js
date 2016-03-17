var WebSocketServer = require('ws').Server;
var protocol = require('./protocol');
var SessionManager = require('./sessionmanager').SessionManager;

// Create websocket server 
var port = 8000;
var wss = new WebSocketServer({ 'port': port});
var sm = new SessionManager();
var clients = [];

console.log('listen on port: %d', port);


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
            if (!sm.createSession(ws, message.payload)) {
                ws.send('Fail to create session with id: ', message.payload.session_id);
                ws.close();
            }

            break;
        case 'join_session':
            if (!sm.joinSession(ws, message.payload)) {
                ws.send('No session with id: ', message.payload.session_id);
                ws.close();
            }

            break;
        case 'delete_session':
            if (!sm.deleteSession(message.payload)) {
                ws.close();
            }

            break;
        case 'offer':
        case 'answer':
        case 'candidate':
            var session = sm.getSession(message.payload.session_id);
            if (session) {
                session.addMessage(message);
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
});
