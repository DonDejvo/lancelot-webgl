import { Component } from "../core/Component.js";
import { ChannelClient } from "./ChannelClient.js";
import { SignalServer } from "./SignalServer.js";

export class ChannelClientController extends Component {
    _refreshRate;
    _channelClient;
    _interval;

    constructor(params) {
        super();

        this._refreshRate = params.refreshRate ?? 1000 / 30;

        this._channelClient = new ChannelClient(new SignalServer({ host: params.host }), params.rtcConfig);
    }

    start() {
        this._channelClient.onConnect = () => {
            
            this.broadcast({ topic: "connect" });
        }

        this._channelClient.onDisconnect = () => {

            this.broadcast({ topic: "disconnect" });
        }

        this._channelClient.onMessage = (client, data) => {
            data = JSON.parse(data);

            switch (data.type) {
                case "data":
                    this.broadcast({ topic: "data", data: data.data });
                    break;
                case "join":
                    this.broadcast({ topic: "join", socketId: data.socketId });
                    break;
                case "leave":
                    this.broadcast({ topic: "leave", socketId: data.socketId });
                    break;
            }
        }

        this._interval = setInterval(() => this._updateEntity(), this._refreshRate);

        this._channelClient.connect();
    }

    destroy() {
        if (this._interval) {
            clearInterval(this._interval);
        }
    }

    _updateEntity() {
        if(!this._channelClient.channel.ready) {
            return;
        }
        
        this._channelClient.channel.send(JSON.stringify(this._entity.getComponent("Serializer").serialize()));
    }
}