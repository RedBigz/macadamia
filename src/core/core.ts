import { Logger } from "../logs";
import { loadModManager } from "./modManager";
import { loadMultiplayer } from "./multiplayer";

const logger = new Logger("macadamia::core");

export async function loadCore() {
    
    logger.log("loading core features...");

    await loadMultiplayer(); // multiplayer
    await loadModManager(); // mod manager

    logger.log("core loaded successfully!");
}