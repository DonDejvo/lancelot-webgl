import { ChannelServerConnection } from "./ChannelServerConnection.js";

export class ChannelServer {
    serverRoom;
    signalServer;
    connections;
    onStart;
    onConnect;
    onDisconnect;
    onMessage;

    constructor(serverRoom, signalServer) {
        this.serverRoom = serverRoom;
        this.signalServer = signalServer;

        this.connections = [];

        signalServer.onConnect = () => {
            signalServer.joinRoom(serverRoom);

            if(this.onStart) {
                this.onStart();
            }
        }

        signalServer.onJoinRoom = (target, room) => {
            if(signalServer.socket.id == target || room != this.serverRoom) {
                return;
            }
            this.createConnection(target);
        }

        signalServer.onLeaveRoom = (target, room) => {
            if(signalServer.socket.id == target || room != this.serverRoom) {
                return;
            }
            const connection = this.connections.find(connection => connection.socketId == target);
            if(connection) {
                connection.localConnection.close();
            }
        }

        signalServer.onMessage = (from, message) => {
            const connection = this.connections.find(connection => connection.socketId == from);
            if(connection) {
                connection.handleSignalMessage(message);
            }
        }
    }

    connect() {
        this.signalServer.start();
    }

    createConnection(socketId) {
        const connection = new ChannelServerConnection(socketId, this);
        this.connections.push(connection);
    }

    removeConnection(conn) {
        this.connections.splice(this.connections.indexOf(conn), 1);
    }
}