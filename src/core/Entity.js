import { Transform } from "./Transform.js";

export class Entity {
    static _ids = 0;

    static genName() {
        return "_entity_" + this._ids++;
    }

    constructor(n) {
        if (typeof n == "undefined") {
            this._name = Entity.genName();
        }
        else {
            this._name = n;
        }
        this._groups = new Set();
        this._componentsMap = new Map();
        this._components = [];
        this._scene = null;
        this._transform = new Transform();
        this._handlers = {};
        this.addComponent("Transform", this._transform);
    }

    get name() {
        return this._name;
    }

    get groups() {
        return this._groups;
    }

    get transform() {
        return this._transform;
    }

    addComponent(name, component) {
        component._entity = this;
        this._componentsMap.set(name, component);
        this._components.push(component);
        return component;
    }

    getComponent(n) {
        return this._componentsMap.get(n);
    }

    start() {
        for (let i = 0; i < this._components.length; ++i) {
            this._components[i].start();
        }
    }

    update(dt) {
        for (let i = 0; i < this._components.length; ++i) {
            this._components[i].update(dt);
        }
    }

    destroy() {
        for (let i = 0; i < this._components.length; ++i) {
            this._components[i].destroy();
        }
    }

    registerHandler(name, handler) {
        if (!(name in this._handlers)) {
            this._handlers[name] = [];
        }
        this._handlers[name].push(handler);
    }

    broadcast(msg) {
        if (!(msg.topic in this._handlers)) {
            return;
        }
        for (let curHandler of this._handlers[msg.topic]) {
            curHandler(msg);
        }
    }
}