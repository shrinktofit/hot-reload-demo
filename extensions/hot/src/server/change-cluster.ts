import { waitFor } from "./utils";

export type ChangeClusterCallback = (filenames: string[]) => void;

export class ChangeCluster {
    constructor(callback: ChangeClusterCallback) {
        this.#callback = callback;
    }

    commit(filename: string) {
        this.#queue.add(filename);
        if (this.#timer) {
            return;
        }
        this.#timer = (async () => {
            await waitFor(500);
            const queue = Array.from(this.#queue);
            this.#queue.clear();
            this.#timer = null;
            this.#callback(queue);
        })();
    }

    #timer: Promise<void> | null = null;
    #queue = new Set<string>();
    #callback: ChangeClusterCallback;
}