export class Channel {
    channel;
    onConnect;
    onDisconnect;
    onMessage;

    constructor(channel) {
        this.channel = channel;
    }

    init() {
        this.channel.onmessage = (e) => {
            if(this.onMessage) {
                this.onMessage(e.data);
            }
        }

        this.channel.onopen = () => {
            this.handleChannelStateChange();
        }

        this.channel.onclose = () => {
            this.handleChannelStateChange();
        }
    }

    send(data) {
        this.channel.send(data);
    }

    handleChannelStateChange() {
        const state = this.channel.readyState;

        if(state == "open") {
            console.log("Client connected");

            if(this.onConnect) {
                this.onConnect();
            }
        } else {
            console.log("Client disconnected");

            if(this.onDisconnect) {
                this.onDisconnect();
            }
        }
    }
}