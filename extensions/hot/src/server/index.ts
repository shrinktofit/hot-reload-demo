// @ts-check

import express from 'express';
import { WebSocketServerCluster } from './web-socket-cluster.js';
import { Server } from 'http';
import { BuildServer } from './build-server.js';

export class HotService {
    constructor({
        port,
    }: {
        port: number;
    }) {
        const app = express();

        let httpServer!: Server;

        this.#listenPromise = new Promise<void>((resolve, reject) => {
            httpServer = app.listen(port, () => {
                console.log(`Hot service running at http://localhost:${port}\n\n`);
                resolve();
            });
        });

        this.#httpServer = httpServer;

        const webSocketCluster = new WebSocketServerCluster(httpServer);
        this.#webSocketCluster = webSocketCluster;
    }

    async open() {
        await this.#listenPromise;
    }

    async shutdown() {
        for (const [, buildServer] of this.#buildServers) {
            await buildServer.shutdown();
        }
    
        await new Promise<void>((resolve, reject) => {
            this.#httpServer.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async startServer(buildId: string) {
        if (this.#buildServers.has(buildId)) {
            return;
        }
    
        const webSocketServer = await this.#webSocketCluster.create(buildId);
        const buildServer = new BuildServer(webSocketServer, {});
        this.#buildServers.set(buildId, buildServer);
        await buildServer.start();
    }

    async stopServer(buildId: string) {
        const buildServer = this.#buildServers.get(buildId);
        if (!buildServer) {
            return;
        }
    
        await buildServer.stop();
    }

    async pushChanges(buildId: string, files: string[]) {
        const buildServer = this.#buildServers.get(buildId);
        if (!buildServer) {
            return;
        }
        buildServer.pushChanges(files);
    }

    #listenPromise: Promise<void>;

    #httpServer: Server;

    #webSocketCluster: WebSocketServerCluster;

    #buildServers = new Map<string, BuildServer>();
}
