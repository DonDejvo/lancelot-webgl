export class Channel {
    channel;
    ready;
    onConnect;
    onDisconnect;
    onMessage;

    constructor(channel) {
        this.channel = channel;
        this.ready = false;
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
            this.ready = true;

            if(this.onConnect) {
                this.onConnect();
            }
        } else {
            console.log("Client disconnected");
            this.ready = false;

            if(this.onDisconnect) {
                this.onDisconnect();
            }
        }
    }
}