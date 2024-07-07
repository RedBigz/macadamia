import { Logger } from "../logs";

export interface ModManifest {
    name: string;
    description: string;
    version: string;
    author: string;
    icon?: string;
    uuid: string;
}

interface Mod {
    manifest: ModManifest;
    enabled: boolean;
}

let pages: { [key: string]: () => string } = {
    mods() {
        function buildContainer(mods: Mod[]) {
            return mods.map((mod) => {
                let disabler = `<a class="option${mod.enabled ? "" : " warning"}" style="font-size: 8pt; padding: 4px; float: right;" onclick="this.className = this.className == 'option warning' ? 'option' : 'option warning'; this.innerHTML = this.innerHTML == '✕ disabled' ? '✓ enabled' : '✕ disabled'; window.Macadamia.toggleMod('${mod.manifest.uuid}')">${mod.enabled ? "✓ enabled" : "✕ disabled"}</a>`;
                return `<div style="display: block; height: 48px;">
                    <img src="${mod.manifest.icon || "favicon.ico"}" style="image-rendering: pixelated; float: left; padding-right: 15px; overflow: hidden;" height="48px">
                    <div style="text-align: left;">
                        <span style='font-size: 12pt; font-weight: 700; position: relative;'>${mod.manifest.name}</span>
                        <small>${mod.manifest.version}</small><br>
                        by ${mod.manifest.author}<br>

                        ${mod.manifest.uuid != "macadamia" ? disabler : ""}
                    </div>
                </div>`;
            })
        }
        return `${[...buildContainer(Object.values((<any>window).MacadamiaModList))].join("<br>")}`;
    },

    settings() {
        return "&lt;no settings&gt;";
    },

    about() {
        return `<img src="https://redbigz.com/lfs/macadamia/res/logo.png" style="image-rendering: pixelated; width: 32px; height: 32px; vertical-align: middle;"><b>Macadamia</b><br>by RedBigz<br><small>${(<any>window).MacadamiaModList.macadamia.manifest.version}</small>`;
    }
}

function generateLinks(links: string[], current: string) {
    return Object.values(links).map((key) => {
        return `${key == current ? "<b>" : ""}<a href="javascript:window.ShowModManager('${key}')">${key}</a>${key == current ? "</b>" : ""}`;
    }).join(" | ");
}

export async function loadModManager() {
    const logger = new Logger("macadamia::modManager");

    logger.log("loading mod manager...");

    (<any>window).ShowModManager = (page: "mods" | "settings" | "about") => {
        Game.Prompt(`<h3>Macadamia</h3><br>${generateLinks(["mods", "settings", "about"], page)}<br><div class=block style="position: relative; top: 5px; margin-bottom: 10px;">${pages[page]()}</div>`, []);
    };

    logger.log("mod manager loaded.");
}