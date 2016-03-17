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

    switch(message.type) {
        case 'create_session':
            if(!sm.createSession(ws, message.payload)) {
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
