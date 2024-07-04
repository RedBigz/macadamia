import { Logger } from "../logs";

const logger = new Logger("macadamia::multiplayer");

function loadPeerJS(): Promise<void> {
    return new Promise((resolve) => {
        Game.LoadMod("https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js", () => {
            resolve();
        });
    });
}

export async function loadMultiplayer() {
    logger.log("loading multiplayer...");

    // load peerjs
    logger.log("waiting for peerjs...");
    await loadPeerJS();
    logger.log("peerjs loaded successfully!");
}