var Session = require('./session').Session;


function SessionManager() {
    var sessions = {};
    var self = this;

    this.createSession = function(ws, payload) {
        var sessionId = payload.session_id;
        var userActive = payload.active_user;

        var session = null;

        // if session exists try to add peer to it
        var keys = Object.keys(sessions);
        for(var i in keys) {
            var sessionIt = sessions[keys[i]];
            if (sessionIt.getId() === sessionId) {
                session = sessionIt; 
                console.log('use session: ', sessionId);
                break;
            }
        }

        if (!session) {
            session = new Session(sessionId);
            sessions[sessionId] = session;
            console.log('create session: ', sessionId);
        }

        session.addPeer(ws, userActive);
        console.log('session connected: ', session.isConnected());
        return true;
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
