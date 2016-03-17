var validateSession = function(payload) {
    if (!('session_id' in payload)) {
        console.log('no session_id in message');
        return false;
    }

    if (!('active_user' in payload)) {
        return false;
    }

    return true;
};

var validateSignalling = function(payload) {
    if (!('active_user' in payload)) {
        return false;
    }

    if (!('message' in payload)) {
        return false;
    }

    return true;
};

var validateInput = function(ws, rawMessage) {
    try {
        var message = JSON.parse(rawMessage);
    } catch (err) {
        console.log('Invalid json');
        console.log(err);
        return false;
    }

    if (!('type' in message)) {
        console.log('no type in message');
        return false;
    }

    if (!('payload' in message)) {
        console.log('empty message');
        return false;
    }

    switch(message.type) {
        case 'create_session':
        case 'delete_session':
            if (validateSession(message.payload)) {
                return message;
            } else {
                return null;
            }
        case 'offer':
        case 'answer':
        case 'candidate':
            if (validateSignalling(message.payload)) {
                return message;
            } else {
                return null;
            }
        default:
            console.log('invalid message type: ', message.type);
            return false;
    }
};

module.exports = {
    'validate': validateInput
};
