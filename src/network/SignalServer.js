import { io } from "socket.io-client";

export class SignalServer {
    params;
    socket;
    connected;
    rooms;
    onMessage;
    onConnect;
    onDisconnect;
    onJoinRoom;
    onLeaveRoom;

    constructor(params) {
        this.params = params;

        this.connected = false;
        this.rooms = new Set();
    }

    start() {
        this.socket = io(this.params.host);

        this.socket.on("connect", () => {
            this.connected = true;

            if(this.onConnect) {
                this.onConnect();
            }
        });

        this.socket.on("message", (e) => {
            if(this.onMessage) {
                this.onMessage(e.target, e.data.message);
            }
        });

        this.socket.on("join-room", (e) => {
            if(e.target == this.socket.id) {
                this.rooms.add(e.data.room);
            }

            if(this.onJoinRoom) {
                this.onJoinRoom(e.target, e.data.room);
            }
        });

        this.socket.on("leave-room", (e) => {
            if(e.target == this.socket.id) {
                this.rooms.delete(e.data.room);
            }

            if(this.onLeaveRoom) {
                this.onLeaveRoom(e.target, e.data.room);
            }
        });

        this.socket.on("disconnect", () => {
            this.connected = false;

            if(this.onDisconnect) {
                this.onDisconnect();
            }
        });
    }

    sendMessage(to, message) {
        this.socket.emit("message", {
            emitType: "single",
            message,
            to
        });
    }

    broadcastMessage(message, rooms = []) {
        this.socket.emit("message", {
            emitType: "broadcast",
            message,
            rooms
        });
    }

    joinRoom(room) {
        this.socket.emit("room", {
            action: "join",
            room
        });
    }

    leaveRoom(room) {
        this.socket.emit("room", {
            action: "leave",
            room
        });
    }
}