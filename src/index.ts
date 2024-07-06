import { loadCore } from "./core/core";
import { init, log, welcome } from "./logs";
import { Mod } from "./mod";

(window as any).Macadamia = {
    Version: "0.0.1",
    Defaults: {
        // Defaults for Macadamia will go here.
    },
    Mod: Mod,
    async register(mod: { new(uuid: string): Mod }, manifest: { uuid: string; }) {
        var currMod = new mod(manifest.uuid);

        (window as any).MacadamiaModList[manifest.uuid] = {
            mod: currMod,
            manifest: manifest,
            enabled: true
        };

        await currMod.rpcBuilder();
        await currMod.awake();
        await currMod.hookBuilder();

        log("macadamia", `registered ${manifest.uuid}.`);
    },
    async disableMod(uuid: string) {
        var mod = (window as any).MacadamiaModList[uuid];
        if (!mod) {
            log("macadamia", `mod ${uuid} not found.`);
            return;
        }

        mod.enabled = false;
        mod.mod.hooks.enabled = false;
        await mod.mod.sleep();

        log("macadamia", `disabled ${uuid}.`);
    }
};

(window as any).MacadamiaModList = {}; // { [key: string]: { mod: Mod, manifest: { uuid: string; }, enabled: boolean } }

async function main() {
    init();

    await loadCore();

    welcome();
}

main();