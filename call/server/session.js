function Session(sessionId) {
    var id = sessionId;
    var active = null; // active peer
    var passive = null; // passive peer
    var messages = [];
    var self = this;

    var verify = function(ws, message) {
        return ws === active || ws === passive;
    };

    var getHistory = function(peer) {
        if (!verify(peer)) {
            return false;
        }

        // send only messages which doesn't belong to peer
        for (var i in messages) {
            var wrapper = messages[i];
            if (peer != wrapper.peer) {
                peer.send(wrapper.message);
            }
        }

        return true;
    }

    // proxy messages between peers
    var proxy = function(ws, message) {
        if (!self.isConnected()) {
            console.log('try to proxy without established connection');
            return false;
        }

        if (ws === active) {
            passive.send(message);
        }

        if (ws === passive) {
            active.send(message);
        }

        return true;
    };

    // return session id
    this.getId = function() {
        return id;
    };

    // add peer to session
    this.addPeer = function(ws, isActive) {
        if (self.isConnected()) {
            console.log('Session is full');
            return false;
        }

        if (typeof(isActive) === 'undefined') {
            console.log('No user active mode is presented (true/false)');
            return false;
        }

        if (isActive && active === null) {
            active = ws;
            return true;
        }

        if(!isActive && passive === null) {
            passive = ws;
            return true;
        }

        console.log('Add peer with invalid configuration: isActive ', isActive);
        return false;
    };

    this.removePeer = function(ws) {
        if (ws === active) {
            self.removeMessages(ws);
            active = null;
            return true;
        }

        if (ws === passive) {
            self.removeMessages(ws);
            passive = null;
            return true;
        }

        return false;
    };

    this.isConnected = function() {
        return !!(active && passive);
    };

    this.addMessage = function(ws, message) {
        if (!verify(ws, message)) {
            console.log('fail to verify message: ', ws, message);
            return false;
        }

        // Here we can save messages in db
        messages.push({
            'peer': ws,
            'message': message
        });

        proxy(ws, message);
        return true;
    };

    this.removeMessage = function(ws, message) {
        if (!verifyPeer(ws)) {
            return false;
        }

        var msgIndex = -1;
        messages.find(function(it, index) {
            if (it.peer === ws && it.message === message) {
                msgIndex = index;
                return true;
            }
        }); 

        if (msgIndex !== -1) {
            messages.splice(msgIndex);
        }

        return true;
    };

    this.removeMessages = function(ws) {
        if (!verifyPeer(ws)) {
            return false;
        }

        for (var i in messages) {
            var message = messages[i];
            if(message.peer === ws) {
                self.removeMessage(ws, message);
            }
        }

        return true;
    };

    this.close = function() {
        active.close();
        passive.close();
        messages = [];
    };
};


module.exports = {
    'Session': Session
};
