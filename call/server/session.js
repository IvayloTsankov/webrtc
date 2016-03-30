function Session(sessionId) {
    var id = sessionId;
    var active = null; // active peer
    var passive = null; // passive peer
    var messages = [];
    var self = this;

    var verify = function(peer) {
        return peer === active || peer === passive;
    };

    // proxy messages between peers
    var send = function(packet) {
        if (!self.isConnected()) {
            console.log('try to send without established connection');
            return false;
        }

        // if message active_user is true means that this message
        // is FROM active user else it is from passive user
        // 'to' variable is assigned to passive if message's active_user is true
        // and vise versa
        var to = packet.active_user ? passive : active;
        console.log('session send to peer: ', packet.type);
        to.send(JSON.stringify(packet));

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
        if (!peer) {
            return false;
        }

        console.log('remove peer from session %d active: ',
                    id, !!(peer === active)); 

        self.removeMessages(peer);
        if (peer === active) {
            active = null;
        } else if (peer === passive) {
            passive = null;
        } else {
            return false;
        }

        return true;
    };

    this.isMember = function(peer) {
        return !!(peer === active) || !!(peer === passive);
    };

    this.isConnected = function() {
        return !!(active && passive);
    };

    this.isPeerActive = function(peer) {
        return !!(peer === active);
    };

    this.addMessage = function(peer, packet) {
        if (!verify(peer)) {
            console.log('fail to verify peer for packet: ', packet.type);
            return false;
        }

        // Here we can save messages in db
        messages.push(packet);

        send(packet);
        return true;
    };

    this.removeMessage = function(peer, rPacket) {
        if (!verify(peer)) {
            console.log('fail to remove message (invalid peer)');
            return false;
        }

        var isActive = !!(peer === active);
        for (var i in messages) {
            var packet = messages[i];
            if (packet.active_user === isActive &&
                packet.payload.message === rPacket.payload.message) {
                    messages.splice(i, 1);
                    console.log('remove message: ', rPacket);
                    return true;
            }
        }

        return false;
    };

    this.removeMessages = function(peer) {
        if (!verify(peer)) {
            console.log('fail to remove message (invalid peer)');
            return false;
        }

        var isActive = !!(peer === active);
        var filtered = messages.filter(function(it) {
            return it.active_user !== isActive;
        });

        messages = filtered;
        return true;
    };

    var getPeer = function(isActive) {
        return isActive ? active : passive;
    }

    this.getHistory = function(peer) {
        console.log('get history for peer: ', !!(peer === active));
        if (!verify(peer)) {
            console.log('get history failed because peer is not from this session');
            return false;
        }

        for (var i in messages) {
            var packet = messages[i];
            var packetOwner = getPeer(packet.active_user);
            if (peer != packetOwner) {
                peer.send(JSON.stringify(packet)); 
            } 
        }

        return true;
    }

    this.close = function() {
        if (active) {
            active.close();
        }

        if (passive) {
            passive.close();
        }

        messages = [];
    };
};


module.exports = {
    'Session': Session
};
