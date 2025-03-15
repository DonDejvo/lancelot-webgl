import { Component } from "../core/Component.js";
import { ChannelServer } from "./ChannelServer.js";
import { SignalServer } from "./SignalServer.js";

export class ChannelServerController extends Component {
    _updateRate;
    _interval;
    _channelServer;
    _entityData;

    constructor(params) {
        super();

        this._updateRate = params.updateRate ?? 1000 / 60;
        this._entityData = [];

        this._channelServer = new ChannelServer(new SignalServer(params.host), params.rtcConfig, params.room);

        this._channelServer.onClientConnect = (connection) => {
            const entry = {
                socketId: connection.socketId
            };
            this._entityData.push(entry);

            this._channelServer.sendOrderedText(JSON.stringify({
                type: "join",
                socketId: connection.socketId
            }));
        }

        this._channelServer.onUnorderedMessage = (connection, text) => {
            const data = JSON.parse(text);
            const entry = this._entityData.find(entry => entry.socketId == connection.socketId);
            if(entry) {
                entry.data = data;
            }
        }

        this._channelServer.onOrderedMessage = (connection, text) => {
            const data = JSON.parse(text);
            switch(data.type) {
                case "ping":
                    connection.sendOrderedText(JSON.stringify({
                        type: "pong",
                        timestamp: data.timestamp
                    }));
                    break;
            }
        }

        this._channelServer.onClientDisconnect = (connection) => {
            const entry = this._entityData.find(entry => entry.socketId == connection.socketId);
            if(entry) {
                this._entityData.splice(this._entityData.indexOf(entry), 1);

                this._channelServer.sendOrderedText(JSON.stringify({
                    type: "leave",
                    socketId: connection.socketId
                }));
            }
        }
    }

    start() {
        this._interval = setInterval(() => {
            this._sendEntityData();
        }, this._updateRate);

        this._channelServer.start();
    }

    destroy() {
        if(this._interval) {
            clearInterval(this._interval);
        }
        this._channelServer.stop();
    }

    _sendEntityData() {
        if(this._channelServer.state != "ready") {
            return;
        }

        this._channelServer.sendUnorderedText(JSON.stringify({
            type: "data",
            data: this._entityData
        }));
    }
}