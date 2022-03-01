import { log } from "cc";

export function fn() {
    log(`Lib: ${0}`);
}

interface Data {
    counter?: number;
}

if (import.meta.ccHot) {
    const data = import.meta.ccHot.data as Data;
    if (typeof data.counter === 'undefined') {
        log(`[${import.meta.url}]:: This is my first load.`);
    } else {
        log(`[${import.meta.url}]:: I've been reloaded for ${data.counter ?? 0} times.`);
    }
}

import.meta.ccHot?.dispose((data: Data) => {
    log(`[${import.meta.url}]::disposed with: ${JSON.stringify(data, undefined, 2)}`);
    
    if (typeof data.counter === 'number') {
        ++data.counter;
    } else {
        data.counter = 1;
    }
});
