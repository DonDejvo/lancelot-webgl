import { ChannelServerConnection } from "./ChannelServerConnection.js";

export class ChannelServer {
    static STATE_DISCONNECTED = "disconnected";
    static STATE_CONNECTED = "connected";
    static STATE_READY = "ready";

    _signalServer;
    _rtcConfig;
    _maxPacketLifeTime;
    _room;
    _connections;
    _state;
    onStateChange;
    onClientConnect;
    onClientDisconnect;
    onOrderedMessage;
    onUnorderedMessage;

    constructor(signalServer, rtcConfig, room) {
        this._signalServer = signalServer;
        this._rtcConfig = rtcConfig;
        this._room = room;

        this._maxPacketLifeTime = 250;
        this._connections = [];
        this._state = ChannelServer.STATE_DISCONNECTED;

        this._signalServer.onConnect = () => {
            this._onSignalServerConnect();
        }

        this._signalServer.onDisconnect = () => {
            this._onSignalServerDisconnect();
        }

        this._signalServer.onCreateRoom = (room) => {
            this._onSignalServerCreateRoom(room);
        }

        this._signalServer.onDeleteRoom = (room) => {
            this._onSignalServerDeleteRoom(room);
        }

        this._signalServer.onJoinRoom = (socketId, room) => {
            this._onSignalServerJoinRoom(socketId, room);
        }

        this._signalServer.onLeaveRoom = (socketId, room) => {
            this._onSignalServerLeaveRoom(socketId, room);
        }

        this._signalServer.onMessage = (from, message) => {
            
            const connection = this._connections.find(connection => connection._socketId == from);
            if (connection) {
                connection._handleSignalServerMessage(from, message);
            }
        }
    }

    start() {
        this._signalServer.connect();
    }

    stop() {
        this._signalServer.deleteRoom(this._room.name);
    }

    sendUnorderedText(text) {
        for(let connection of this._connections) {
            if(!connection.connected) {
                continue;
            }
            connection.sendUnorderedText(text);
        }
    }

    sendOrderedText(text) {
        for(let connection of this._connections) {
            if(!connection.connected) {
                continue;
            }
            connection.sendOrderedText(text);
        }
    }

    _onSignalServerConnect() {
        this._state = ChannelServer.STATE_CONNECTED;
        if (this.onStateChange) {
            this.onStateChange(this);
        }

        this._signalServer.createRoom(this._room.name, this._room.appName, this._room.description);
    }

    _onSignalServerCreateRoom(room) {
        if (room != this._room.name) {
            return;
        }
        this._state = ChannelServer.STATE_READY;
        if (this.onStateChange) {
            this.onStateChange(this);
        }
    }

    _onSignalServerDeleteRoom(room) {
        if (room != this._room.name) {
            return;
        }
        this._state = ChannelServer.STATE_CONNECTED;
        if (this.onStateChange) {
            this.onStateChange(this);
        }

        this._signalServer.disconnect();
    }

    _onSignalServerDisconnect() {
        this._state = ChannelServer.STATE_DISCONNECTED;
        if (this.onStateChange) {
            this.onStateChange(this);
        }
    }

    _onSignalServerJoinRoom(socketId, room) {
        if (room != this._room.name || this._signalServer._socket.id == socketId) {
            return;
        }
        
        const connection = new ChannelServerConnection(this, socketId);
        this._connections.push(connection);
    }

    _onSignalServerLeaveRoom(socketId, room) {
        if (room != this._room.name || this._signalServer._socket.id == socketId) {
            return;
        }

        const connection = this._connections.find(connection => connection._socketId == socketId);
        if (connection) {
            connection.close();
            this._connections.splice(this._connections.indexOf(connection), 1);
        }
    }

    get state() {
        return this._state;
    }
}