import { log } from "cc";
import { getV, setV } from "./CircularAnother";

export function incV () {
    setV(getV() + 1);
}

log(`[${import.meta.url}]:: I'm executing.`);