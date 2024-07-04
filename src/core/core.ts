import { Logger } from "../logs";
import { loadMultiplayer } from "./multiplayer";

const logger = new Logger("macadamia::core");

export async function loadCore() {
    
    logger.log("loading core features...");

    await loadMultiplayer(); // multiplayer

    logger.log("core loaded successfully!");
}