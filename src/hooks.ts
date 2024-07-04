import { Raisin } from "./raisin";

class Hook<CallbackType> {
    id: string;
    subscribers: ((message: CallbackType) => any)[];

    constructor(id: string) {
        this.id = id;
        this.subscribers = [];
    }

    subscribe(callback: (message: CallbackType) => any) {
        this.subscribers.push(callback);
    }

    publish(message: CallbackType) {
        for (var i in this.subscribers) {
            this.subscribers[i](message);
        }
    }
    
    feed(message: CallbackType): CallbackType {
        let output = message;
        
        for (var i in this.subscribers) {
            output = this.subscribers[i](output);
        }

        return output;
    }
}

class HookList {
    hooks: { [id: string]: Hook<any> };

    constructor() {
        this.hooks = {};
    }

    addHook<HT>(hook: Hook<HT>): Hook<HT> {
        this.hooks[hook.id] = hook;
        return hook;
    }

    hook(id: string) {
        return this.hooks[id];
    }
}

enum VanillaHooks {
    Draw = "vanilla/draw",
    Logic = "vanilla/logic",
    CPS = "vanilla/cps"
}

export const Hooks = {
    Vanilla: VanillaHooks,
}

export function buildHooks() {
    let hooks = new HookList();

    // Create hooks
    let drawHook = hooks.addHook(new Hook<{}>(Hooks.Vanilla.Draw));
    let logicHook = hooks.addHook(new Hook<{}>(Hooks.Vanilla.Logic));
    let cpsHook = hooks.addHook(new Hook<{cps: number}>(Hooks.Vanilla.CPS));

    // Implement vanilla hooks
    Game.registerHook("draw", () => drawHook.publish({}));
    Game.registerHook("logic", () => logicHook.publish({}));
    Game.registerHook("cps", (cps: number) => cpsHook.feed({ cps }).cps);

    return hooks;
}