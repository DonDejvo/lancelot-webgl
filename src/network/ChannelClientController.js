import { Component } from "../core/Component.js";
import { ChannelClient } from "./ChannelClient.js";
import { SignalServer } from "./SignalServer.js";

export class ChannelClientController extends Component {
    _updateRate;
    _channelClient;
    _interval;
    _pingInterval;
    _serializer;
    _serialNumber;

    constructor(params) {
        super();

        this._updateRate = params.updateRate ?? 1000 / 60;
        this._serializer = params.serializer;
        
        this._serialNumber = 0;

        this._channelClient = new ChannelClient(new SignalServer(params.host), params.rtcConfig, params.appName);

        this._channelClient.onOpen = () => {
            this.broadcast({ topic: "connect" });
        }

        this._channelClient.onClose = () => {
            this.broadcast({ topic: "disconnect" });
        }

        this._channelClient.onOrderedMessage = (text) => {
            const data = JSON.parse(text);

            switch (data.type) {
                case "join":
                    this.broadcast({ topic: "join", socketId: data.socketId });
                    break;
                case "leave":
                    this.broadcast({ topic: "leave", socketId: data.socketId });
                    break;
                case "pong":
                    this.broadcast({ topic: "ping", value: Date.now() - data.timestamp });
                    break;
            }
        }

        this._channelClient.onUnorderedMessage = (text) => {
            const data = JSON.parse(text);

            switch (data.type) {
                case "data":
                    this.broadcast({ topic: "data", data: data.data });
                    break;
            }
        }
    }

    start() {
        this._interval = setInterval(() => {
            this._sendEntityData();
        }, this._updateRate);
        this._pingInterval = setInterval(() => {
            if (this._channelClient.state != "ready") {
                return;
            }

            this._channelClient.sendOrderedText(JSON.stringify({
                type: "ping",
                timestamp: Date.now()
            }));
        }, 1000);
        this._channelClient.start();
    }

    destroy() {
        if (this._interval) {
            clearInterval(this._interval);
        }
        if(this._pingInterval) {
            clearInterval(this._pingInterval);
        }
        this._channelClient.stop();
    }

    _sendEntityData() {
        if (this._channelClient.state != "ready") {
            return;
        }

        const data = this._serializer.serialize();
        data._serialNumber = ++this._serialNumber;
        this._channelClient.sendUnorderedText(JSON.stringify(data));
    }
}