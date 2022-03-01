import http from 'http';
import WebSocket from 'ws';
import { Watcher } from './watcher';

export class BuildServer {
    constructor(
        webSocketServer: WebSocket.Server, {
            watcher,
        }: {
            watcher?: Watcher;
        }) {
        this.#webSocketServer = webSocketServer;
        this.#watcher = watcher ?? null;
        webSocketServer.on('connection', (websocketConnection, connectionRequest) => {
            this.#onConnection(websocketConnection, connectionRequest);
        });
    }

    async start() {
        if (this.#watcher) {
            this.#watcher.start();
        }
    }

    async stop() {
        if (this.#watcher) {
            this.#watcher.stop();
        }

        for (const client of [...this.#clients]) {
            client.close();
            this.#removeClient(client);
        }
    }

    async shutdown() {
        await this.stop();

        await new Promise<void>((resolve, reject) => {
            this.#webSocketServer.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    pushChanges(files: string[]) {
        this.#pushChanges(files);
    }

    #webSocketServer: WebSocket.Server;

    #watcher: Watcher | null = null;

    #clients: WebSocket[] = [];

    #pushChanges(filenames: string[]) {
        console.log(`About to emit changes: \n${filenames.join('\n')}`);

        for (const client of this.#clients) {
            client.send(JSON.stringify({
                'type': 'reload',
                files: filenames,
            }, undefined, 2));
        }
    }

    #removeClient(client: WebSocket) {
        const i = this.#clients.indexOf(client);
        if (i >= 0) {
            this.#clients.splice(i, 1);
        }
    }

    #onConnection(websocketConnection: WebSocket, _connectionRequest: http.IncomingMessage) {
        console.debug(`Client ${websocketConnection.url} connected.`);

        websocketConnection.send(JSON.stringify({
            type: 'hi',
        }, undefined, 2));

        websocketConnection.on('close', () => {
            console.debug(`Client ${websocketConnection.url} closed.`);

            this.#removeClient(websocketConnection);
        });

        this.#clients.push(websocketConnection);
    }
}
