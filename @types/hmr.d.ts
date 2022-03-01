
type DisposeHandler = (data: unknown) => void;

declare global {
    interface ImportMeta {
        ccHot?: {
            data: unknown;

            accept(errorHandler?: (err: unknown, { moduleId: string, dependencyId: string }) => void): void;
            
            accept(
                modules: string | string[],
                callback: () => void,
                errorHandler?: (err: unknown, { moduleId: string, dependencyId: string }) => void,
            ): void;

            dispose(handler: DisposeHandler);
        };
    }
}

export {};