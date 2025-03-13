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
        if(this.ready) {
            this.channel.send(data);
        } else {
            console.warn("Channel: Trying to send data but channel is not ready");
        }
    }

    handleChannelStateChange() {
        const state = this.channel.readyState;

        if(state == "open") {
            this.ready = true;

            if(this.onConnect) {
                this.onConnect();
            }
        } else {
            this.ready = false;

            if(this.onDisconnect) {
                this.onDisconnect();
            }
        }
    }
}