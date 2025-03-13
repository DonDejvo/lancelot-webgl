import { Channel } from "./Channel.js";

export class ChannelServerConnection {
    socketId;
    server;
    localConnection;
    channel;

    constructor(socketId, server) {
        this.socketId = socketId;
        this.server = server;
        this.localConnection = new RTCPeerConnection(server.rtcConfig);

        this.localConnection.onicecandidate = (e) => {
            server.signalServer.sendMessage(socketId, {
                type: "candidte",
                candidate: e.candidate
            });
        }

        const dataChannel = this.localConnection.createDataChannel("main");
        this.channel = new Channel(dataChannel);
        this.channel.init();

        this.channel.onConnect = () => {
            if(server.onConnect) {
                server.onConnect(this);
            }
        }

        this.channel.onDisconnect = () => {
            server.removeConnection(this);
            if(server.onDisconnect) {
                server.onDisconnect(this);
            }
        }

        this.channel.onMessage = (data) => {
            if(server.onMessage) {
                server.onMessage(this, data);
            }
        }

        this.localConnection.createOffer()
            .then(offer => this.localConnection.setLocalDescription(offer))
            .then(() => {
                server.signalServer.sendMessage(socketId, {
                    type: "offer",
                    offer: this.localConnection.localDescription
                });
            });
    }

    handleSignalMessage(message) {
        console.log("Server: Message type " + message.type + " received [" + this.socketId + "]");
        switch(message.type) {
            case "answer":
                this.localConnection.setRemoteDescription(message.answer);
                break;
            case "candidate":
                this.localConnection.addIceCandidate(message.candidate);
                break;
        }
    }

    get connected() {
        return this.channel.ready;
    }
}