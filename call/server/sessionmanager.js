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
            console.log('session with id %d is already created', sessionId);
            return false;
        }

        session = new Session(sessionId);
        setSession(session, sessionId);
        return session.addPeer(peer, userActive);
    };

    this.joinSession = function(peer, message) {
        var sessionId = message.session_id;
        var userActive = message.active_user;

        var session = self.getSession(sessionId);
        if (!session) {
            console.log('no session with id: ', sessionId);
            return false;
        }

        session.addPeer(peer, userActive);
        session.getHistory(peer);

        var sessionStatus = session.isConnected();
        console.log('session status: ', sessionStatus);

        return sessionStatus;
    };

    this.deleteSession = function(ws, message) {
        var sessionId = message.session_id;
        var session = getSession(sessionId);;
        if (session) {
            session.close();
            delete sessions[sessionId];

            return true;
        }

        console.log('try to delete uknown session');
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
