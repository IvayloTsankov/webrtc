var Session = require('./session').Session;


function SessionManager() {
    var sessions = {};
    var self = this;

    var setSession = function(session, id) {
        sessions[id] = session;
    }

    this.createSession = function(ws, payload) {
        var sessionId = payload.session_id;
        var userActive = payload.active_user;

        var session = self.getSession(sessionId);
        if (session) {
            console.log('session with id %d is already created', sessionId);
            return false;
        }

        session = new Session(sessionId);
        setSession(session, sessionId);
        return session.addPeer(ws, userActive);
    };

    this.joinSession = function(ws, payload) {
        var sessionId = payload.session_id;
        var userActive = payload.active_user;

        var session = self.getSession(sessionId);
        if (!session) {
            console.log('no session with id: ', sessionId);
            return false;
        }

        session.addPeer(ws, userActive);
        var sessionStatus = session.isConnected();
        console.log('session status: ', sessionStatus);
        return sessionStatus;
    };

    this.deleteSession = function(ws, payload) {
        var sessionId = payload.session_id;
        var session = sessions[sessionId];

        session.close();
        delete sessions[sessionId];

        return true;
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
};


module.exports = {
    'Session': Session,
    'SessionManager': SessionManager
};
