import { io } from "socket.io-client";

export class SignalServer {
    _host;
    _socket;
    _connected;
    onMessage;
    onConnect;
    onDisconnect;
    onCreateRoom;
    onDeleteRoom;
    onJoinRoom;
    onLeaveRoom;
    onError;

    constructor(host) {
        this._host = host;

        this._connected = false;
    }

    connect() {
        this._socket = io(this._host);

        this._socket.on("connect", () => {
            this._connected = true;

            if(this.onConnect) {
                this.onConnect();
            }
        });

        this._socket.on("message", (e) => {
            if(this.onMessage) {
                
                this.onMessage(e.from, e.data);
            }
        });

        this._socket.on("join-room", (e) => {

            if(this.onJoinRoom) {
                this.onJoinRoom(e.from, e.data.room);
            }
        });

        this._socket.on("leave-room", (e) => {

            if(this.onLeaveRoom) {
                this.onLeaveRoom(e.from, e.data.room);
            }
        });

        this._socket.on("create-room", (e) => {

            if(this.onCreateRoom) {
                this.onCreateRoom(e.data.room);
            }
        });

        this._socket.on("delete-room", (e) => {

            if(this.onDeleteRoom) {
                this.onDeleteRoom(e.data.room);
            }
        });

        this._socket.on("disconnect", () => {
            this._connected = false;

            if(this.onDisconnect) {
                this.onDisconnect();
            }
        });

        this._socket.on("error", (e) => {
            console.log("Error: " + e.data.message);

            if(this.onError) {
                this.onError(e.data);
            }
        })
    }

    disconnect() {
        if (this._socket) {
            this._socket.disconnect();
        }
    }

    sendMessage(to, message) {
        this._socket.emit("message", {
            message,
            to
        });
    }

    createRoom(roomName, appName, description) {
        this._socket.emit("create-room", {
            room: roomName,
            appName,
            description
        });
    }

    joinRoom(roomName) {
        this._socket.emit("join-room", {
            room: roomName
        });
    }

    leaveRoom(roomName) {
        this._socket.emit("leave-room", {
            room: roomName
        });
    }

    deleteRoom(roomName) {
        this._socket.emit("delete-room", {
            room: roomName
        });
    }

    getRooms(appName) {
        return new Promise((resolve) => {
            this._socket.once("list-rooms", (e) => {
                resolve(e.data.rooms);
            });
            this._socket.emit("list-rooms", { appName });
        });
    }
}