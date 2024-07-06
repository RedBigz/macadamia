import { RPC, SharedVariable } from "./core/multiplayer";
import { buildHooks, HookList } from "./hooks";
import { Logger } from "./logs";

export class Mod {
    uuid: string;
    logger: Logger;
    hooks: HookList;

    constructor(uuid: string) {
        this.uuid = uuid;
        this.logger = new Logger(this.uuid);
        this.hooks = buildHooks();
    }

    async awake() { }
    async sleep() { }
    async hookBuilder() { }
    async rpcBuilder() { }

    // Helper utils

    createSharedVariable<T>(name: string, settings: { defaultValue: T; sanitizer?: (value: any) => boolean; }) {
        return new SharedVariable<T>(this.uuid, name, settings);
    }

    createRPC(name: string) {
        return new RPC(this.uuid, name);
    }
}