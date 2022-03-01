

export enum FileChangeType {
    update,
    add,
    delete,
}

export type WatchFileCallback = (filename: string, changeType: FileChangeType) => void;

export interface FileWatcher {
    close(): void;
}

export interface FileSystem {
    watchDirectory(path: string, callback: WatchFileCallback): FileWatcher;
}
