import { io } from "socket.io-client";

class SignalServer {
    params;
    socket;

    constructor(params) {
        this.params = params;

        this.socket = io(params.host);
    }
}

export {
    SignalServer
}