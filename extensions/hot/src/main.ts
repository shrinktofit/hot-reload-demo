import { HotService } from "./server";
import hotConfig from '../hot.config.js';

let globalHotService!: HotService;

export const methods = {
    async startServer(...args: Parameters<HotService['startServer']>) {
        const [ buildId ] = args;
        console.debug(`Start hot server for "${buildId}"`);
        await globalHotService.startServer(...args);
    },

    async stopServer(buildId: string) {
        console.debug(`Stop hot server for "${buildId}"`);
        await globalHotService.stopServer(buildId);
    },

    async pushChanges(buildId: string, changes: string[]) {
        console.debug(`Push changes to "${buildId}": ${changes.join(',')}`);
        await globalHotService.pushChanges(buildId, changes);
    },
};

export async function load () {
    globalHotService = new HotService({
        port: hotConfig.port,
    });
}

export async function unload () {
    globalHotService.shutdown();
}
