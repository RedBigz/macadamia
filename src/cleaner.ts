import { Logger } from "./logs";

export function clean() {
    const logger = new Logger("macadamia::cleaner");

    logger.log("cleaning up localStorage...");
    
    let macadamiaUnusedSaves = Object.keys(localStorage).filter(key => key.startsWith("macadamia_"));
    for (var key of macadamiaUnusedSaves) {
        localStorage.removeItem(key);
    }

    logger.log(`cleaned up ${macadamiaUnusedSaves.length} unused save${macadamiaUnusedSaves.length == 1 ? "" : "s"}.`);
}