import { loadCore } from "./core/core";
import { init, welcome } from "./logs";

(window as any).Macadamia = {
    Version: "0.0.1",
    Defaults: {
        // Defaults for Macadamia will go here.
    }
};

async function main() {
    init();

    await loadCore();

    welcome();
}

main();