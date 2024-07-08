import { Logger } from "../logs";
import { Raisin } from "../raisin";
import { injectCSS } from "../util";

var metadata = {
    name: "Unnamed",
}

const logger = new Logger("macadamia::multiplayer");

let connections: any[] = [];
let rpcFunctions: { [modID: string]: { [rpcName: string]: (data?: any) => void } } = {};

let netcodeSettings = {
    syncPeriod: 60000,
    hosting: true,
    host: ""
};

(<any>window).inGame = false;

var alreadyLoadedSave = false;

function loadPeerJS(): Promise<void> {
    return new Promise((resolve) => {
        Game.LoadMod("https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js", () => {
            resolve();
        });
    });
}

(<any>window).DO_NOT_RPC = false;

var playerListElement = document.createElement("div");
playerListElement.style.cssText = "position: fixed; top: 40px; left: 10px; color: yellow; text-shadow: black 0 0 5px; font-family: Tahoma; z-index: 9999;";
playerListElement.id = "playerList";
document.body.appendChild(playerListElement);

(<any>window).ShowInvitePrompt = () => {
    Game.Prompt(`<h3>Invite Friends</h3><br><div class=block><b>Peer ID</b><br><code style='font-family: monospace; user-select: text;'>${(<any>window).peer.id}</code></div><span style='color:#e33;font-weight:700;'><br>Your IP address is visible to those who join you/know your peer id! DO NOT HAND IT TO ANYONE THAT YOU DO NOT TRUST.</span><br>`, [])
}

var saveToOld: string = Game.SaveTo;

(<any>window).CloseConnection = () => {
    for (var connection in connections) {
        connections[connection].close();
    }

    Game.SaveTo = saveToOld;
    Game.LoadSave();

    localStorage.removeItem(Game.SaveTo);
};

(<any>window).JoinGame = () => {
    Game.Prompt("<h3>Join Game</h3><br>Macadamia uses a P2P system for playing multiplayer. <b>Your IP address will be shared with users in your lobby due to how the networking is managed.</b><br><br><input id=peeridinput class=block placeholder='Peer ID' style='text-align:center;background-color:rgba(0,0,0,0);color:white;width:120px;margin-bottom:10px;'>", [["Join", "window.StartJoinGame(document.getElementById('peeridinput').value)"]])
};

(<any>window).StartJoinGame = (peerID: string) => {
    Game.ClosePrompt();

    if (peerID == (<any>window).peer.id) {
        Game.Prompt("You can't join yourself!", []);
        return;
    }

    if (peerID == "") {
        Game.Prompt("Invalid peer ID!", []);
        return;
    }

    for (var connection in connections) {
        connections[connection].close();
    }

    connections = [];

    Game.SaveTo = peerID;
    (<any>window).CreateConnection(peerID);
};

(<any>window).setUsername = (name: string) => {
    localStorage.setItem('macadamiaUsername', name);

    sendDataToPeers({ type: "newName", data: name });

    metadata.name = name;

    rebuildPlayerList();
};

(<any>window).ChangeUsername = () => {
    Game.Prompt("<h3>Change Username</h3><br>Choose a username:<br><br><input id=nameinput class=block placeholder='Username' style='text-align:center;background-color:rgba(0,0,0,0);color:white;width:120px;margin-bottom:10px;'>", [["Change", "window.setUsername(document.getElementById('nameinput').value); Game.ClosePrompt();"]])
};

function rebuildPlayerList() {
    let output = `${metadata.name} (you)`;

    for (var connection in connections) {
        output += `\n${connections[connection].macaName}`;
    }

    playerListElement.innerText = output;

    var menuArea = "";

    menuArea += "<a class='option' onclick='window.ShowModManager(\"mods\")'>☰ Mods & Settings</a>";

    if (connections.length == 0)
        netcodeSettings.hosting = true;

    if (!netcodeSettings.hosting) {
        if (connections.length > 0)
            menuArea += "<a class='option' onclick='window.CloseConnection()'>✕ Leave</a>";
    }

    if (netcodeSettings.hosting) {
        menuArea += "<a class='option' onclick='window.ShowInvitePrompt()'>➕ Invite</a>";
        menuArea += "<a class='option' onclick='window.JoinGame()'>⮐ Join Game</a>";
    }

    menuArea += "<a class='option' onclick='window.ChangeUsername()'>✎</a>";

    playerListElement.innerHTML = menuArea + "<br><br>" + playerListElement.innerHTML;
}

export async function loadMultiplayer() {
    logger.log("loading multiplayer...");

    if (localStorage.getItem("multiplayerID") == null || localStorage.getItem("streamerMode") == "true")
        localStorage.setItem("multiplayerID", crypto.randomUUID());

    if (localStorage.getItem("macadamiaUsername") !== null) {
        metadata.name = <string>localStorage.getItem("macadamiaUsername");
    }

    // load peerjs
    logger.log("waiting for peerjs...");
    await loadPeerJS();
    logger.log("peerjs loaded successfully!");

    var peer = new (<any>window).Peer(`macadamia_${localStorage.getItem("multiplayerID")}`);

    logger.log("created peer");

    (<any>window).peer = peer;

    logger.log("loading player list...");

    injectCSS("#playerList { pointer-events: none; } #playerList > * { pointer-events: auto; }");

    rebuildPlayerList();

    console.log(`%cmacadamia::multiplayer\n%c🌐 network\n%cpeer id: %c${peer.id}\n\n%c/!\\ warning\n%cyour IP address is visible to those who join you/know your peer id!\nDO NOT HAND IT TO ANYONE THAT YOU DO NOT TRUST.`, "font-size: 0.5rem;", "color: #7289da; font-size: 1rem;", "color: #d9b99b;", "color: #fff0db;", "color: #e22; font-size: 1rem; font-weight: 700; text-shadow: #F00 1px 0 3px;", "color: #e22")

    let onConnection = (connection: any, connectionFromNewPeer: boolean) => {
        connection.macaName = "Unnamed";

        connection.on("open", () => {
            if (connections.length >= 4) {
                connection.close();
                logger.log(`received connection from ${connection.peer}, but kicked because server is full`);
                return;
            }

            if (connection.peer != (<any>window).peer.id) {
                logger.log(`received connection from ${connection.peer}`);
            }

            if (!connectionFromNewPeer && netcodeSettings.hosting) {
                // sendDataToPeers({ type: "newPeer", peer: connection.peer })

                for (var otherConnection in connections) {
                    connection.send({ type: "newPeer", data: connections[otherConnection].peer });
                }
            }

            connections.push(connection); // add connection to connections array

            connection.send({ type: "newName", data: metadata.name });

            rebuildPlayerList();

            if (netcodeSettings.hosting) {
                connection.send({ type: "saveData", data: Game.WriteSave(1) });
            }

            connection.on("data", (data: any) => {
                // console.log(data)
                if (!data.type || !data.data) return;

                switch (data.type) {
                    case "macadamiaSync":
                        // handle cookies
                        if (connection.peer != netcodeSettings.host) return;
                        if (!data.data) return;

                        Game.LoadSave(data.data);

                        // Game.cookies = data.cookies;
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
                        if (data.data && !alreadyLoadedSave && !netcodeSettings.hosting && connection.peer == netcodeSettings.host) {
                            Game.LoadSave(data.data);
                            alreadyLoadedSave = true;
                        }
                        break;
                    case "newPeer":
                        if (data.data && typeof data.data === "string" && connections.length < 4) {
                            var conn = peer.connect(data.data);
                            onConnection(conn, true);
                        }
                        break;
                    case "newName":
                        if (data.data && typeof data.data === "string") {
                            connection.macaName = data.data;
                            rebuildPlayerList();
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
    (<any>window).CreateConnection = (id: string) => { onConnection(peer.connect(id), true); netcodeSettings.host = id; netcodeSettings.hosting = false; alreadyLoadedSave = false; };

    // establish hooks

    // On click cookie
    var clickRPC = new RPC("macadamia", "clickCookie");
    clickRPC.setCallback(() => {
        Game.ClickCookie();
    })

    var bigCookie: HTMLElement = <HTMLElement>document.querySelector("button#bigCookie");

    // @ts-ignore
    bigCookie.removeEventListener("click", Game.ClickCookie);

    bigCookie.onclick = (event: MouseEvent) => {
        clickRPC.rpc();
    }

    (<any>window).upgradeRPC = new RPC("macadamia", "upgradePurchased");
    (<any>window).upgradeRPC.setCallback((data: any) => {
        var upgrade = Game.UpgradesById[data.id];
        if (!upgrade) return;

        if (!upgrade.vanilla) return;

        if (upgrade.bought) return;

        (<any>window).DO_NOT_RPC = true;
        upgrade.buy(false);
        (<any>window).DO_NOT_RPC = false;
    });

    Game.Upgrade.prototype.buy = new Raisin(Game.Upgrade.prototype.buy)
        .insert(0, function (this: Game.Upgrade) {
            if (!this.vanilla) return;
            (<any>window).upgradeRPC.send({ id: this.id });
        })
        .compile() as any;

    // On upgrade purchased
    for (var objectID in Game.ObjectsById) {
        var object = Game.ObjectsById[objectID];

        // On building purchased
        (<any>window).buildingRPC = new RPC("macadamia", "buildingPurchased");
        (<any>window).buildingRPC.setCallback((data: any) => {
            if (!data.amount) return;

            var building = Game.ObjectsById[data.id];
            if (!building) return;

            if (!building.vanilla) return;

            (<any>window).DO_NOT_RPC = true; // TODO: Find a better way to do this
            building.buy(data.amount);
            (<any>window).DO_NOT_RPC = false;
        });

        object.buy = new Raisin(object.buy)
            .insert(0, function (this: Game.Object) {
                if (!this.vanilla) return [];
                if (Game.buyMode == -1) return []; // sell mode

                (<any>window).buildingRPC.send({ id: this.id, amount: Game.buyBulk });
            })
            .compile() as any;

        // On building sold
        (<any>window).buildingSellRPC = new RPC("macadamia", "buildingSold");
        (<any>window).buildingSellRPC.setCallback((data: any) => {
            if (!data.amount) return;

            var building = Game.ObjectsById[data.id];
            if (!building) return;

            if (!building.vanilla) return;

            (<any>window).DO_NOT_RPC = true;
            building.sell(data.amount, undefined);
            (<any>window).DO_NOT_RPC = false;
        });

        object.sell = new Raisin(object.sell)
            .insert(0, function (this: Game.Object) {
                if (!this.vanilla) return [];

                (<any>window).buildingSellRPC.send({ id: this.id, amount: Game.buyBulk });
            })
            .compile() as any;

        // On building upgrade
        (<any>window).buildingUpgradeRPC = new RPC("macadamia", "buildingUpgrade");
        (<any>window).buildingUpgradeRPC.setCallback((data: any) => {
            if (!data.id) return;

            var building = Game.ObjectsById[data.id];
            if (!building) return;

            if (!building.vanilla) return;

            var oldLumps = Game.prefs.askLumps;
            Game.prefs.askLumps = <any>false;
            (<any>window).DO_NOT_RPC = true;
            building.levelUp();
            (<any>window).DO_NOT_RPC = false;
            Game.prefs.askLumps = oldLumps;
        });

        object.levelUp = new Raisin(object.levelUp)
            .insert(0, function (this: Game.Object) {
                if (!this.vanilla) return [];
                (<any>window).buildingUpgradeRPC.send({ id: this.id });
            })
            .insertPerSignature(/(?<!Ga)(?<!miniga)me\./g, `Game.ObjectsById[${object.id}].`, false)
            .compile() as any;
    }
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
        if ((<any>window).DO_NOT_RPC) return;

        sendDataToPeers({
            type: "rpc",
            data: {
                modID: this.modID,
                name: this.name,
                payload: payload
            }
        });
    }

    rpc(payload?: any) {
        if ((<any>window).DO_NOT_RPC) return;

        this.send(payload);

        if (payload)
            rpcFunctions[this.modID][this.name](payload);
        else
            rpcFunctions[this.modID][this.name]();
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

setInterval(() => {
    if (netcodeSettings.hosting)
        sendDataToPeers({
            type: "macadamiaSync",
            data: Game.WriteSave(1)
        });
}, netcodeSettings.syncPeriod);