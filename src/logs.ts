export function boot(id: string): void {
    console.log(`%cbooting %c${id}%c...`, "color: #d9b99b;", "color: #fff0db;", "color: #d9b99b;");
}

export function welcome(): void {
    console.log("%cmacadamia has booted!\n%cif you're a modder, read the docs here:\nhttps://macadamia.redbigz.com/docs", "color: #d9b99b; font-weight: 700; font-size: 1.5em;", "color: #fff0db;");
}

export function init(): void {
    console.log(`%c🥜 macadamia %cby redbigz\n%cv${(<any>window).Macadamia.Version} | main | CC v${(<any>window).VERSION}`, "color: #d9b99b; font-size: 2em;", "font-weight: 700;", "color: #fff0db;");
}

export function log(from: string, msg: string): void {
    console.log(`%c[${from}] %c${msg}`, "color: #d9b99b;", "color: #fff0db;");
}

export class Logger {
    from: string;

    constructor(from: string) {
        this.from = from;
    }

    log(msg: string) {
        log(this.from, msg);
    }
}