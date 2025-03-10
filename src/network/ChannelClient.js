import { Channel } from "./Channel.js";

export class ChannelClient {
    serverRoom;
    signalServer;
    remoteConnection;
    channel;
    connected;
    onConnect;
    onDisconnect;
    onMessage;
    
    constructor(serverRoom, signalServer) {
        this.serverRoom = serverRoom;
        this.signalServer = signalServer;
        this.channel = new Channel();
        this.connected = false;

        signalServer.onConnect = () => {
            signalServer.joinRoom(serverRoom);
        }

        signalServer.onMessage = (from, message) => {
            switch(message.type) {
                case "offer":
                    this.startConnection(from, message.offer);
                    break;
                case "candidate":
                    this.remoteConnection.addIceCandidate(message.candidate);
                    break;
            }
        }

        this.channel.onConnect = () => {
            this.connected = true;
            if(this.onConnect) {
                this.onConnect(this);
            }
        }

        this.channel.onDisconnect = () => {
            this.connected = false;
            if(this.onDisconnect) {
                this.onDisconnect(this);
            }
        }

        this.channel.onMessage = (data) => {
            if(this.onMessage) {
                this.onMessage(this, data);
            }
        }

        signalServer.start();
    }

    startConnection(from, offer) {
        const remoteConnection = new RTCPeerConnection();

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