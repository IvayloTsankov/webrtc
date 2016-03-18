var Session = require('./session').Session;


function SessionManager() {
    var sessions = {};
    var self = this;

    var setSession = function(session, id) {
        sessions[id] = session;
    }

    this.createSession = function(peer, message) {
        var sessionId = message.session_id;
        var userActive = message.active_user;

        var session = self.getSession(sessionId);
        if (session) {
            peer.send(JSON.stringify({
                'type': 'response',
                'message': 'session_exists'
            }));

            return false;
        }

        session = new Session(sessionId);
        setSession(session, sessionId);

        if (!session.addPeer(peer, userActive)) {
            peer.send(JSON.stringify(new Error('Fail to add peer to session')));
            return false;
        }

        peer.send(JSON.stringify({
            'type': 'response',
            'message': 'session_created'
        }));

        return true;
    };

    this.joinSession = function(peer, message) {
        var sessionId = message.session_id;
        var userActive = message.active_user;

        var session = self.getSession(sessionId);
        if (!session) {
            peer.send(JSON.stringify({
                'type': 'response',
                'type': 'no_session'
            }));

            return false;
        }

        if (!session.addPeer(peer, userActive)) {
            peer.send(JSON.stringify(new Error('Fail to add user to session')));
            return false;
        }

        if (!session.getHistory(peer)) {
            peer.send(JSON.stringify(new Error('Fail to get history')));
            return false;
        }

        peer.send(JSON.stringify({
            'type': 'response',
            'message': 'session_joined'
        }));

        console.log('session connected: ', session.isConnected());
        return true;
    };

    this.deleteSession = function(peer, sessionId) {
        var session = getSession(sessionId);;
        if (session) {
            if (session.isMember(peer)) {
                session.close();
                delete sessions[sessionId];
                return true;
            } else {
                console.log('Try to delete session with non member user');
                return false;
            }
        }

        peer.send(JSON.stringify({
            'type': 'response',
            'message': 'no_session'
        }));
        return false;
    };

    this.getSession = function(sessionId) {
        return sessions[sessionId];
    };

    this.clear = function() {
        var keys = Object.keys(sessions);
        for(var i in keys) {
            sessions[keys[i]].close()
        }

        sessions = [];
    };

    this.findPeerSession = function(peer) {
        var keys = Object.keys(sessions);
        for (var i in keys) {
            var session = sessions[keys[i]];
            if (session.isMember(peer)) {
                return session;
            }
        }

        return null;
    };
};


module.exports = {
    'Session': Session,
    'SessionManager': SessionManager
};
