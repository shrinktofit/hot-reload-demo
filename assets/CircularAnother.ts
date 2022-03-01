import { log } from "cc";
import { incV } from "./CircularOne";

let v = 0;

export function getV() {
    return v;
}

export function setV(value: number) {
    v = value;
}

export function test() {
    log(`======== circular reference test ========`);

    log(`v: ${getV()}`);

    incV();

    log(`v: ${getV()}`);

    log(`======== end circular reference test ========`);
}


log(`[${import.meta.url}]:: I'm executing.`);