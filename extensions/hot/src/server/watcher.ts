import fs from 'fs';
import ps from 'path';
import { ChangeCluster } from './change-cluster';

export type WatchFileCallback = (filenames: string[]) => void;

export class Watcher {
    constructor(root: string, callback: WatchFileCallback) {
        this.#root = root;
        this.#changeCluster = new ChangeCluster(callback);
    }

    start() {
        if (this.#fsWatcher) {
            return;
        }

        const watchRoot = this.#root;
        this.#fsWatcher = fs.watch(watchRoot, {
            recursive: true,
        }, (eventType, filename) => {
            switch (eventType) {
                case 'change':
                    this.#changeCluster.commit(ps.resolve(watchRoot, filename));
                    break;
                case 'rename':
                    break;
            }
        });
    }

    stop() {
        if (!this.#fsWatcher) {
            return;
        }
        this.#fsWatcher.close();
        this.#fsWatcher = null;
    }

    #root: string;
    #fsWatcher: fs.FSWatcher | null = null;
    #changeCluster: ChangeCluster;
}