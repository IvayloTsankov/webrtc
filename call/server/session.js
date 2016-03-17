function Session(sessionId) {
    var id = sessionId;
    var active = null; // active peer
    var passive = null; // passive peer
    var messages = [];
    var self = this;

    var verify = function(peer, message) {
        return peer === active || peer === passive;
    };

    // proxy messages between peers
    var send = function(message) {
        if (!self.isConnected()) {
            console.log('try to send without established connection');
            return false;
        }

        // if message active_user is true means that this message
        // is FROM active user else it is from passive user
        // 'to' variable is assigned to passive if message's active_user is true
        // and vise versa
        var to = message.active_user ? passive : active;
        to.send(JSON.stringify(message));

        return true;
    };

    // return session id
    this.getId = function() {
        return id;
    };

    // add peer to session
    this.addPeer = function(peer, isActive) {
        if (self.isConnected()) {
            console.log('Session is full');
            return false;
        }

        if (typeof(isActive) === 'undefined') {
            console.log('No user active mode is presented (true/false)');
            return false;
        }

        if (isActive && active === null) {
            active = peer;
            console.log('add active peer (session: %d)', id);
            return true;
        }

        if(!isActive && passive === null) {
            passive = peer;
            console.log('add passive peer (session: %d)', id);
            return true;
        }

        console.log('Add peer with invalid configuration: isActive ', isActive);
        return false;
    };

    this.removePeer = function(peer) {
        if (peer === active) {
            self.removeMessages(peer);
            active = null;
            return true;
        }

        if (peer === passive) {
            self.removeMessages(peer);
            passive = null;
            return true;
        }

        return false;
    };

    this.isConnected = function() {
        return !!(active && passive);
    };

    this.addMessage = function(peer, message) {
        if (!verify(peer, message)) {
            console.log('fail to verify message: ', message);
            return false;
        }

        // Here we can save messages in db
        messages.push({
            'peer': peer,
            'message': message
        });

        send(message);
        return true;
    };

    this.removeMessage = function(peer, message) {
        if (!verifyPeer(peer)) {
            return false;
        }

        var msgIndex = -1;
        messages.find(function(it, index) {
            if (it.peer === peer && it.message === message) {
                msgIndex = index;
                return true;
            }
        }); 

        if (msgIndex !== -1) {
            messages.splice(msgIndex);
        }

        return true;
    };

    this.removeMessages = function(peer) {
        if (!verifyPeer(peer)) {
            return false;
        }

        for (var i in messages) {
            var message = messages[i];
            if(message.peer === peer) {
                self.removeMessage(peer, message);
            }
        }

        return true;
    };

    this.getHistory = function(peer) {
        if (!verify(peer)) {
            console.log('get history failed because peer is not from this session');
            return false;
        }

        // send only messages which doesn't belong to peer
        for (var i in messages) {
            var wrapper = messages[i];
            if (peer !== wrapper.peer) {
                peer.send(JSON.stringify(wrapper.message));
            }
        }

        return true;
    }

    this.close = function() {
        active.close();
        passive.close();
        messages = [];
    };
};


module.exports = {
    'Session': Session
};
