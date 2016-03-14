var WebSocketServer = require('ws').Server


// Create websocket server 
var port = 8000;
var wss = new WebSocketServer({ 'port': port});
var clients = [];

console.log('listen on port: %d', port);

wss.on('connection', function(ws) {
    clients.push(ws);
    ws.on('message', function(message) {
        console.log(message);
        ws.send('received');
    });

    console.log('new client');
});
