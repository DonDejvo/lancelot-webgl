export class Channel {
    _channel;
    onConnect;
    onDisconnect;
    onMessage;

    constructor() {
        
    }

    init() {
        this._channel.onmessage = (e) => {
            
            if(this.onMessage) {
                this.onMessage(e.data);
            }
        }

        this._channel.onopen = () => {
            this._handleChannelStateChange();
        }

        this._channel.onclose = () => {
            this._handleChannelStateChange();
        }
    }

    setChannel(channel) {
        this._channel = channel;
    }

    send(data) {
        this._channel.send(data);
    }

    _handleChannelStateChange() {
        const state = this._channel.readyState;

        if(state == "open") {

            if(this.onConnect) {
                this.onConnect();
            }
        } else {

            if(this.onDisconnect) {
                this.onDisconnect();
            }
        }
    }

    get connected() {
        return this._channel && this._channel.readyState == "open";
    }
}