import { FileChangeType, FileSystem, FileWatcher, WatchFileCallback } from "../src/server/file-system";

export class VirtualFileSystem implements FileSystem {
    watchDirectory(path: string, callback: WatchFileCallback): FileWatcher {
        const watcher: VirtualFileWatcher = {
            callback,
            close: () => {
                const watchers = this.#watchers[path];
                const i = watchers.indexOf(watcher);
                if (i) {
                    watchers.splice(i, 1);
                }
            },
        };

        (this.#watchers[path] ??= []).push(watcher);

        return watcher;
    }

    modify(path: string) {
        this.#emiChange(path, FileChangeType.update);
    }

    delete(path: string) {
        this.#emiChange(path, FileChangeType.delete);
    }

    add(path: string) {
        this.#emiChange(path, FileChangeType.add);
    }

    #watchers: Record<string, VirtualFileWatcher[]> = {};

    #emiChange(path: string, eventType: FileChangeType = FileChangeType.update) {
        const items = path.split('/');
        while (items.length > 0) {
            items.pop();
            const parent = items.join('/');
            const watchers = this.#watchers[parent];
            if (watchers) {
                for (const watcher of watchers) {
                    watcher.callback(path, eventType);
                }
            }
        }
    }
}

interface VirtualFileWatcher extends FileWatcher {
    callback: WatchFileCallback;
}
