import { log } from "cc";
import { BUILD } from "cc/env";
import hotConfig from '../../hot.config.js';

declare global {
    var System: {
        reload(modules: string[]): Promise<unknown>;
    };
}

import.meta.ccHot?.accept();

if (BUILD) {
    const socket = new WebSocket(hotConfig.url);

    const send = (message: unknown) => {
        socket.send(JSON.stringify(message, undefined, 2));
    };

    const onMessage = (message: {
        type: 'reload';
        files: string[];
    } | {
        type: 'hi',
    }) => {
        if (message.type === 'hi') {
            log(`Server says hi to us.`);
            return;
        }

        log(`Received message: ${JSON.stringify(message, undefined, 2)}`);

        const { files } = message;

        System.reload(files).then(() => {
            send({
                type: 'reload-finished',
            });
        }).catch((err) => {
            send({
                type: 'reload-error',
                err,
            });
        });
    };

    log(`Hot client is listening at ${socket.url}`);

    socket.onopen = (_event) => {
        log(`Hot server connected.`);
    };

    socket.onclose = (event) => {
        log(`Hot server closed.`);
    };

    socket.onmessage = (event) => {
        onMessage(JSON.parse(event.data as string));
    };
}
