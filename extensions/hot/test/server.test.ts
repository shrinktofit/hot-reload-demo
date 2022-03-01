
import { expect, test, afterEach, beforeEach } from '@jest/globals';
import { HotService } from '../src/server/index';
import WebSocket from 'ws';
import hotConfig from '../hot.config';

test('Server', async () => {
    const servicePort = hotConfig.port;

    const hotService = new HotService({ port: servicePort });
    await hotService.open();

    await hotService.startServer('a');

    const nClients = 2;

    const clients = new Array(nClients);
    for (let iClient = 0; iClient < nClients; ++iClient) {
        const client = await createClient(`ws://localhost:${servicePort}/websockets/a`);
        clients[iClient] = client;
    }

    for (const client of clients) {
        const message = await client.receiveOne();
        expect(message).toStrictEqual({
            type: 'hi',
        });
    }

    await hotService.pushChanges('a', ['/a/foo.js', '/a/bar.js']);
    for (const client of clients) {
        const message = await client.receiveOne();
        expect(message).toStrictEqual({
            type: 'reload',
            files: ['/a/foo.js', '/a/bar.js'],
        });
    }

    await hotService.pushChanges('a', []);
    for (const client of clients) {
        const message = await client.receiveOne();
        expect(message).toStrictEqual({
            type: 'reload',
            files: [],
        });
    }

    await hotService.shutdown();
}, 0);

async function createClient(url: string) {
    class Client {
        stackedMessages: unknown[] = [];

        constructor(webSocket: WebSocket, resolve: () => void, reject: (err?: unknown) => void) {
            this.#websocket = webSocket;
            webSocket.onopen = (_event) => {
                resolve();
            }
            webSocket.onclose = (event) => {
                reject(`The server has unexpectedly closed with code ${event.code}. Reason: ${event.reason}`);
            }
            webSocket.onmessage = (event) => this.#onMessage(event);
        }

        async receiveOne() {
            if (this.#receiver) {
                throw new Error(`Only one receive() is allowed in same time.`);
            }

            if (this.stackedMessages.length > 0) {
                return this.stackedMessages.pop()!;
            }

            const message = await new Promise((resolve) => {
                this.#receiver = (message) => {
                    this.#receiver = null;
                    resolve(message);
                };
            });

            return message;
        }
        
        #websocket: WebSocket;

        #receiver: ((message: unknown) => void) | null = null;

        #onMessage(event: WebSocket.MessageEvent) {
            const message = JSON.parse(event.data.toString());
            if (this.#receiver) {
                this.#receiver(message);
            } else {
                this.stackedMessages.push(message);
            }
        }
    }

    const webSocket = new WebSocket(url);

    let client!: Client;

    await new Promise<void>((resolve, reject) => {
        client = new Client(webSocket, resolve, reject);
    });

    return client;
}