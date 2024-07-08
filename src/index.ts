import { clean } from "./cleaner";
import { loadCore } from "./core/core";
import { ModManifest } from "./core/modManager";
import { init, log, welcome } from "./logs";
import { Mod } from "./mod";

(<any>window).Macadamia = {
    Version: "1.0.0beta",
    Defaults: {
        // Defaults for Macadamia will go here.
    },
    Mod: Mod,
    async register(mod: { new(uuid: string): Mod }, manifest: ModManifest) {
        var currMod = new mod(manifest.uuid);

        (<any>window).MacadamiaModList[manifest.uuid] = {
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
        if (uuid == "macadamia") return;
        var mod = (<any>window).MacadamiaModList[uuid];
        if (!mod) {
            log("macadamia", `mod ${uuid} not found.`);
            return;
        }

        mod.enabled = false;
        mod.mod.hooks.enabled = false;
        await mod.mod.sleep();

        log("macadamia", `disabled ${uuid}.`);
    },
    enableMod(uuid: string) {
        if (uuid == "macadamia") return;
        var mod = (<any>window).MacadamiaModList[uuid];
        if (!mod) {
            log("macadamia", `mod ${uuid} not found.`);
            return;
        }

        mod.enabled = true;
        mod.mod.hooks.enabled = true;
        log("macadamia", `enabled ${uuid}.`);
    },
    toggleMod(uuid: string) {
        if ((<any>window).MacadamiaModList[uuid].enabled) {
            (<any>window).Macadamia.disableMod(uuid);
        } else {
            (<any>window).Macadamia.enableMod(uuid);
        }
    },
    toggleStreamerMode() {
        if (localStorage.getItem("streamerMode") === "true") {
            localStorage.setItem("streamerMode", "false");
        } else {
            localStorage.setItem("streamerMode", "true");
        }
    }
};

(<any>window).MacadamiaModList = {macadamia: {mod: null, manifest: {
    uuid: "macadamia",
    name: "Macadamia",
    description: "Macadamia",
    author: "RedBigz",
    version: (<any>window).Macadamia.Version,
    icon: "https://redbigz.com/lfs/macadamia/res/logo.png"
} as ModManifest, enabled: true}}; // { [key: string]: { mod: Mod, manifest: { uuid: string; }, enabled: boolean } }

async function main() {
    clean();

    init();

    await loadCore();

    welcome();
}

main();