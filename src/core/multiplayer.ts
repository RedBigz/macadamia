import { Logger } from "../logs";

const logger = new Logger("macadamia::multiplayer");

let connections: any[] = [];
let rpcFunctions: { [modID: string]: { [rpcName: string]: (data?: any) => void } } = {};

let localDataBeforeLastSync = {
    cookies: Game.cookies
};

let netcodeSettings = {
    syncPeriod: 1000,
    hosting: true
}

var alreadyLoadedSave = false;

function loadPeerJS(): Promise<void> {
    return new Promise((resolve) => {
        Game.LoadMod("https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js", () => {
            resolve();
        });
    });
}

var playerListElement = document.createElement("div");
playerListElement.style.cssText = "position: fixed; top: 40px; left: 10px; color: yellow; text-shadow: black 0 0 5px; font-family: Tahoma; z-index: 9999;";
document.body.appendChild(playerListElement);

(<any>window).ShowInvitePrompt = () => {
    Game.Prompt(`<h3>Invite Friends</h3><br><div class=block><b>Peer ID</b><br><code style='font-family: monospace;'>${(<any>window).peer.id}</code></div><span style='color:#e33;font-weight:700;'><br>Your IP address is visible to those who join you/know your peer id! DO NOT HAND IT TO ANYONE THAT YOU DO NOT TRUST.</span><br>`, [])
}

function rebuildPlayerList() {
    let output = `${(<any>window).peer.id.slice(0, 14)}... (you)`;

    for (var connection in connections) {
        output += `\n${connections[connection].peer.slice(0, 14)}...`;
    }

    playerListElement.innerText = output;

    playerListElement.innerHTML += "<br><br><a class='option' onclick='window.ShowInvitePrompt()'>➕ Invite</a>"
}

export async function loadMultiplayer() {
    logger.log("loading multiplayer...");

    if (localStorage.getItem("multiplayer_id") == null)
        localStorage.setItem("multiplayer_id", crypto.randomUUID());

    // load peerjs
    logger.log("waiting for peerjs...");
    await loadPeerJS();
    logger.log("peerjs loaded successfully!");

    var peer = new (<any>window).Peer(`macadamia_${localStorage.getItem("multiplayer_id")}`);

    logger.log("created peer");

    (<any>window).peer = peer;

    rebuildPlayerList();

    console.log(`%cmacadamia::multiplayer\n%c🌐 network\n%cpeer id: %c${peer.id}\n\n%c/!\\ warning\n%cyour IP address is visible to those who join you/know your peer id!\nDO NOT HAND IT TO ANYONE THAT YOU DO NOT TRUST.`, "font-size: 0.5rem;", "color: #7289da; font-size: 1rem;", "color: #d9b99b;", "color: #fff0db;", "color: #e22; font-size: 1rem; font-weight: 700; text-shadow: #F00 1px 0 3px;", "color: #e22")

    let onConnection = (connection: any, connectionFromNewPeer: boolean) => {
        connection.on("open", () => {
            if (connections.length >= 4) {
                connection.close();
                logger.log(`received connection from ${connection.peer}, but kicked because server is full`);
                return;
            }

            logger.log(`received connection from ${connection.peer}`);

            if (!connectionFromNewPeer) {
                sendDataToPeers({ type: "newPeer", peer: connection.peer })

                for (var otherConnection in connections) {
                    connection.send({ type: "newPeer", peer: connections[otherConnection].peer });
                }
            }

            connections.push(connection); // add connection to connections array

            rebuildPlayerList();

            if (netcodeSettings.hosting) {
                sendDataToPeers({ type: "saveData", data: Game.WriteSave(1) });
            }

            connection.on("data", (data: any) => {
                if (!data.type || !data.data) return;

                switch (data.type) {
                    case "macadamiaSync":
                        // handle cookies
                        if (!data.cookies) return;

                        Game.Earn(data.cookies - localDataBeforeLastSync.cookies);

                        localDataBeforeLastSync.cookies = data.cookies;
                        break;
                    case "rpc":
                        // handle rpc
                        if (!data.data.modID) return;
                        if (!data.data.name) return;
                        if (!rpcFunctions[data.data.modID]) return;
                        if (!rpcFunctions[data.data.modID][data.data.name]) return;

                        if ((<any>window).MacadamiaModList[data.data.modID].enabled == false) return;

                        if (data.data.payload)
                            rpcFunctions[data.data.modID][data.data.name](data.data.payload);
                        else
                            rpcFunctions[data.data.modID][data.data.name]();

                        break;
                    case "saveData":
                        if (data.data && !alreadyLoadedSave && !netcodeSettings.hosting) {
                            Game.LoadSave(data.data);
                            alreadyLoadedSave = true;
                        }
                        break;
                    case "newPeer":
                        if (data.data && typeof data.data === "string" && connections.length < 4) {
                            var conn = peer.connect(data.data);
                            onConnection(conn, true);
                        }
                    default:
                        return;
                }
            });

            connection.on("close", () => {
                connections.splice(connections.indexOf(connection), 1);
                rebuildPlayerList();
            });
        });
    };

    peer.on("connection", (conn: any) => onConnection(conn, false));
}

function sendDataToPeers(data: any) {
    for (var connection in connections) {
        connections[connection].send(data);
    }
};

export class RPC {
    modID: string;
    name: string;

    constructor(modID: string, name: string) {
        this.modID = modID;
        this.name = name;
    }

    send(payload?: any) {
        sendDataToPeers({
            type: "rpc",
            data: {
                modID: this.modID,
                name: this.name,
                payload: payload
            }
        });
    }

    setCallback(callback: (payload?: any) => void): this {
        rpcFunctions[this.modID] = rpcFunctions[this.modID] || {};
        rpcFunctions[this.modID][this.name] = callback;

        return this;
    }
}

export class SharedVariable<T> extends RPC {
    #value: T;
    settings: { defaultValue: T; sanitizer?: (value: T) => boolean; };
    subscribers: ((value: T) => void)[] = [];

    constructor(modID: string, name: string, settings: { defaultValue: any; sanitizer?: ((value: T) => boolean); }) {
        super(modID, name);

        this.#value = settings.defaultValue;
        this.settings = settings;

        this.setCallback((payload?: T) => {
            if (payload) {
                this.value = payload;
            }

            for (var subscriber in this.subscribers) {
                this.subscribers[subscriber](this.value);
            }
        });
    }

    default() {
        this.value = this.settings.defaultValue;
    }

    get value(): T {
        return this.#value;
    }

    set value(val: T) {
        if (this.settings.sanitizer) {
            if (!this.settings.sanitizer(val)) return;
        }

        this.#value = val;

        this.send(val);
    }

    subscribe(callback: (value: T) => void): this {
        this.subscribers.push(callback);

        return this;
    }
}