
import WebSocket from "ws";
import http from 'http';
import { URL } from "url";
import internal from "stream";

// https://cheatcode.co/tutorials/how-to-set-up-a-websocket-server-with-node-js-and-express

export class WebSocketServerCluster {
    constructor(httpServer: http.Server) {
        this.#httpServer = httpServer;

        httpServer.on("upgrade", (request, socket, head) => {
            this.#onUpgrade(request, socket, head);
        });
    }

    async create(id: string) {
        const websocketServer = new WebSocket.Server({
            noServer: true,
            path: `/websockets/${id}`,
        });

        this.#webSocketServers.set(id, websocketServer);
    
        return websocketServer;
    }

    #httpServer: http.Server;

    #webSocketServers: Map<string, WebSocket.Server> = new Map();

    #onUpgrade(request: http.IncomingMessage, socket: internal.Duplex, head: Buffer) {
        if (!request.url) {
            return;
        }
        const matches = request.url.match(/^\/websockets\/(\w+)/);
        if (!matches) {
            return;
        }
        const [_, webSocketServerId] = matches;
        const webSocketServer = this.#webSocketServers.get(webSocketServerId);
        if (!webSocketServer) {
            return;
        }
        webSocketServer.handleUpgrade(request, socket, head, (websocket) => {
            webSocketServer.emit("connection", websocket, request);
        });
    }
}
