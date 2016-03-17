var validateSignalling = function(packet) {
    if (!('payload' in packet)) {
        console.log('empty packet');
        return false;
    }

    if (!('message' in packet.payload)) {
        console.log('no mesage in packet');
        return false;
    }

    return true;
};

var validateInput = function(ws, raw) {
    try {
        var packet = JSON.parse(raw);
    } catch (err) {
        console.log('Invalid json');
        console.log(err);
        return false;
    }

    if (!('type' in packet)) {
        console.log('no type in packet');
        return false;
    }

    if (!('active_user' in packet)) {
        console.log('no active_user in packet');
        return false;
    }

    if (!('session_id' in packet)) {
        console.log('packet with no session_id');
        return false;
    }

    switch(packet.type) {
        case 'create_session':
        case 'join_session':
        case 'delete_session':
            return packet;
        case 'offer':
        case 'answer':
        case 'candidate':
            if (validateSignalling(packet)) {
                return packet;
            } else {
                return null;
            }
        default:
            console.log('invalid packet type: ', packet.type);
            return null;
    }
};

module.exports = {
    'validate': validateInput
};
