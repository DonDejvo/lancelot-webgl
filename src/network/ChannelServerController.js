import { Component } from "../core/Component.js";
import { ChannelServer } from "./ChannelServer.js";
import { SignalServer } from "./SignalServer.js";

export class ChannelServerController extends Component {
    _running;
    _refreshRate;
    _channelServer;
    _interval;
    _entityData;
    
    constructor(params) {
        super();

        this._refreshRate = params.refreshRate ?? 1000 / 30;

        this._entityData = [];
        this._running = false;

        this._channelServer = new ChannelServer(params.room, new SignalServer({
            host: params.host
        }));
    }

    start() {
        this._channelServer.onStart = () => {
            this._running = true;
            console.log("Channel server is running");
        }

        this._channelServer.onConnect = (connection) => {
            const entityData = { socketId: connection.socketId };
            this._entityData.push(entityData);

            this._sendTextDataToAll({
                type: "join",
                socketId: connection.socketId
            });
        }

        this._channelServer.onDisconnect = (connection) => {
            const entityData = this._entityData.find(item => item.socketId == connection.socketId);

            this._entityData.splice(this._entityData.indexOf(entityData), 1);

            this._sendTextDataToAll({
                type: "leave",
                socketId: connection.socketId
            });
        }

        this._channelServer.onMessage = (connection, data) => {
            const entityData = this._entityData.find(item => item.socketId == connection.socketId);

            if(entityData) {
                entityData.data = JSON.parse(data);
            }
            
        }

        this._channelServer.connect();

        this._interval = setInterval(() => {
            this._updateEntities();
        }, this._refreshRate);
    }

    destroy() {
        this._running = false;
        if(this._interval) {
            clearInterval(this._interval);
        }
    }

    _updateEntities() {
        if(!this._running) {
            return;
        }

        this._sendTextDataToAll({
            type: "data",
            data: this._entityData
        });
    }

    _sendTextData(connection, data) {
        connection.channel.send(JSON.stringify(data));
    }

    _sendTextDataToAll(data) {
        for(let connection of this._channelServer.connections) {
            
            if(!connection.connected) {
                continue;
            }

            this._sendTextData(connection, data);
        }
    }
}