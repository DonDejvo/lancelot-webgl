import { Channel } from "./Channel.js";

export class ChannelServerConnection {
    _server;
    _socketId;
    _localConnection;
    _orderedChannel;
    _unorderedChannel;

    constructor(server, socketId) {
        this._server = server;
        this._socketId = socketId;

        this._localConnection = new RTCPeerConnection(this._server._rtcConfig);

        this._localConnection.onicecandidate = (e) => {
            this._server._signalServer.sendMessage(this._socketId, {
                type: "candidate",
                candidate: e.candidate
            });
        }

        this._orderedChannel = new Channel();
        this._orderedChannel.setChannel(this._localConnection.createDataChannel("ordered", {
            ordered: true
        }));

        this._orderedChannel.onConnect = () => {
            this._handleChannelConnect();
        }

        this._orderedChannel.onDisconnect = () => {
            this._handleChannelDisconnect();
        }

        this._orderedChannel.onMessage = (data) => {
            if(this._server.onOrderedMessage) {
                this._server.onOrderedMessage(this, data);
            }
        }

        this._orderedChannel.init();

        this._unorderedChannel = new Channel();
        this._unorderedChannel.setChannel(this._localConnection.createDataChannel("unordered", {
            ordered: false,
            maxPacketLifeTime: this._server._maxPacketLifeTime
        }));

        this._unorderedChannel.onConnect = () => {
            this._handleChannelConnect();
        }

        this._unorderedChannel.onDisconnect = () => {
            this._handleChannelDisconnect();
        }

        this._unorderedChannel.onMessage = (data) => {
            if(this._server.onUnorderedMessage) {
                this._server.onUnorderedMessage(this, data);
            }
        }

        this._unorderedChannel.init();

        this._localConnection.createOffer()
        .then(offer => this._localConnection.setLocalDescription(offer))
        .then(() => {
            this._server._signalServer.sendMessage(socketId, {
                type: "offer",
                offer: this._localConnection.localDescription
            });
        });
    }

    sendOrderedText(text) {
        this._orderedChannel.send(text);
    }

    sendUnorderedText(text) {
        this._unorderedChannel.send(text);
    }

    close() {
        this._localConnection.close();
    }

    _handleSignalServerMessage(from, message) {
        switch(message.type) {
            case "answer":
                this._localConnection.setRemoteDescription(message.answer);
                break;
            case "candidate":
                this._localConnection.addIceCandidate(message.candidate);
                break;
        }
    }

    _handleChannelConnect() {
        if(this.connected) {
            if(this._server.onClientConnect) {
                this._server.onClientConnect(this);
            }
        }
    }

    _handleChannelDisconnect() {
        if(this._orderedChannel.connected || this._unorderedChannel.connected) {
            if(this._server.onClientDisconnect) {
                this._server.onClientDisconnect(this);
            }
        }
    }

    get connected() {
        return this._orderedChannel.connected && this._unorderedChannel.connected;
    }

    get socketId() {
        return this._socketId;
    }
}