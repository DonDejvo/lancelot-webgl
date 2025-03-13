import { Channel } from "./Channel.js";

export class ChannelClient {
    serverRoom;
    signalServer;
    rtcConfig;
    remoteConnection;
    channel;
    onConnect;
    onDisconnect;
    onMessage;
    
    constructor(signalServer, rtcConfig) {
        this.signalServer = signalServer;
        this.rtcConfig = rtcConfig;
        this.channel = new Channel();
        this.serverRoom = null;

        signalServer.onMessage = (from, message) => {
            switch(message.type) {
                case "offer":
                    this.handleOffer(from, message.offer);
                    break;
                case "candidate":
                    this.remoteConnection.addIceCandidate(message.candidate);
                    break;
            }
        }

        this.channel.onConnect = () => {
            if(this.onConnect) {
                this.onConnect(this);
            }
        }

        this.channel.onDisconnect = () => {
            if(this.onDisconnect) {
                this.onDisconnect(this);
            }
        }

        this.channel.onMessage = (data) => {
            if(this.onMessage) {
                this.onMessage(this, data);
            }
        }
    }

    joinRoom(room) {
        this.serverRoom = room;
        this.signalServer.joinRoom(room);
    }

    leaveRoom() {
        if(this.serverRoom) {
            this.signalServer.leaveRoom(this.serverRoom);
            this.serverRoom = null;
        }
        if(this.remoteConnection) {
            this.remoteConnection.close();
        }
    }

    connect() {
        this.signalServer.start();
    }

    handleOffer(from, offer) {
        const remoteConnection = new RTCPeerConnection(this.rtcConfig);

        remoteConnection.onicecandidate = (e) => {
            this.signalServer.sendMessage(from, {
                type: "candidate",
                candidate: e.candidate
            });
        }

        remoteConnection.ondatachannel = (e) => {
            this.channel.channel = e.channel;
            this.channel.init();
        }

        remoteConnection.setRemoteDescription(offer)
            .then(() => remoteConnection.createAnswer())
            .then(answer => remoteConnection.setLocalDescription(answer))
            .then(() => {
                this.signalServer.sendMessage(from, {
                    type: "answer",
                    answer: remoteConnection.localDescription
                });
            });

        this.remoteConnection = remoteConnection;
    }
}