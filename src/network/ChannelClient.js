import { Channel } from "./Channel.js";

export class ChannelClient {
    static STATE_DISCONNECTED = "disconnected";
    static STATE_CONNECTED = "connected";
    static STATE_READY = "ready";

    _signalServer;
    _rtcConfig;
    _state;
    _roomName;
    _appName;
    _remoteConnection;
    _orderedChannel;
    _unorderedChannel;
    onStateChange;
    onOpen;
    onClose;
    onOrderedMessage;
    onUnorderedMessage;

    constructor(signalServer, rtcConfig, appName) {
        this._signalServer = signalServer;
        this._rtcConfig = rtcConfig;
        this._appName = appName;

        this._state = ChannelClient.STATE_DISCONNECTED;

        this._signalServer.onConnect = () => {
            this._handleSignalServerConnect();
        }

        this._signalServer.onMessage = (from, message) => {
            this._handleSignalServerMessage(from, message);
        }

        this._signalServer.onDisconnect = () => {
            this._handleSignalServerDisconnect();
        }

        this._orderedChannel = new Channel();
        this._unorderedChannel = new Channel();

        this._orderedChannel.onConnect = () => {
            this._handleChannelConnect();
        }

        this._orderedChannel.onDisconnect = () => {
            this._handleChannelDisconnect();
        }

        this._orderedChannel.onMessage = (data) => {
            if(this.onOrderedMessage) {
                this.onOrderedMessage(data);
            }
        }

        this._unorderedChannel.onConnect = () => {
            this._handleChannelConnect();
        }

        this._unorderedChannel.onDisconnect = () => {
            this._handleChannelDisconnect();
        }

        this._unorderedChannel.onMessage = (data) => {
            if(this.onUnorderedMessage) {
                this.onUnorderedMessage(data);
            }
        }
    }

    start() {
        this._signalServer.connect();
    }

    stop() {
        this._signalServer.disconnect();
    }

    joinRoom(roomName) {
        if (this._state != ChannelClient.STATE_CONNECTED) {
            console.log("Cannot join room while in state " + this._state);
            return;
        }
        this._roomName = roomName;
        this._signalServer.joinRoom(this._roomName);
    }

    leaveRoom() {
        if (this._state != ChannelClient.STATE_READY) {
            console.log("Cannot leave room while in state " + this._state);
            return;
        }
        this._signalServer.leaveRoom(this._roomName);
    }

    getRooms() {
        return this._signalServer.getRooms(this._appName);
    }

    sendOrderedText(text) {
        this._orderedChannel.send(text);
    }

    sendUnorderedText(text) {
        this._unorderedChannel.send(text);
    }

    _handleSignalServerConnect() {
        this._state = ChannelClient.STATE_CONNECTED;
        if(this.onStateChange) {
            this.onStateChange(this);
        }
    }

    _handleSignalServerDisconnect() {
        this._state = ChannelClient.STATE_DISCONNECTED;
        if(this.onStateChange) {
            this.onStateChange(this);
        }
    }

    _handleSignalServerMessage(from, message) {
        switch (message.type) {
            case "offer":
                this._createConnection(from, message.offer);
                break;
            case "candidate":
                this._remoteConnection.addIceCandidate(message.candidate);
                break;
        }
    }

    _createConnection(socketId, offer) {
        this._remoteConnection = new RTCPeerConnection(this._rtcConfig);

        this._remoteConnection.onicecandidate = (e) => {
            this._signalServer.sendMessage(socketId, {
                type: "candidate",
                candidate: e.candidate
            });
        }

        this._remoteConnection.ondatachannel = (e) => {
            if(e.channel.label == "ordered") {
                
                this._orderedChannel.setChannel(e.channel);
                this._orderedChannel.init();
            } else if(e.channel.label == "unordered") {
                
                this._unorderedChannel.setChannel(e.channel);
                this._unorderedChannel.init();
            }
        }

        this._remoteConnection.setRemoteDescription(offer)
            .then(() => this._remoteConnection.createAnswer())
            .then(answer => this._remoteConnection.setLocalDescription(answer))
            .then(() => {
                this._signalServer.sendMessage(socketId, {
                    type: "answer",
                    answer: this._remoteConnection.localDescription
                });
            });
    }

    _handleChannelConnect() {
        if(this._orderedChannel.connected && this._unorderedChannel.connected) {
            this._state = ChannelClient.STATE_READY;
            if(this.onOpen) {
                this.onOpen(this);
            }
            if(this.onStateChange) {
                this.onStateChange(this);
            }
        }
    }

    _handleChannelDisconnect() {
        if(this._orderedChannel.connected || this._unorderedChannel.connected) {
            this._state = ChannelClient.STATE_CONNECTED;
            if(this.onClose) {
                this.onClose(this);
            }
            if(this.onStateChange) {
                this.onStateChange(this);
            }
        }
    }

    get state() {
        return this._state;
    }

    get socketId() {
        return this._signalServer._socket.id;
    }
}