const hotConfig: {
    url: string;
};

export default $;

export type HotClientMessage = {
    type: 'reload';
    files: string[];
}

export type HotServerMessage = {
    type: 'reload-finished';
} | {
    type: 'reload-error',
    err: string;
};
