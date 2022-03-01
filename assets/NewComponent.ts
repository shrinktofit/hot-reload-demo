/// <reference types="../@types/hmr" />

import { _decorator, Component, Node, log } from 'cc';
import { fn } from './Lib';
const { ccclass, property } = _decorator;

@ccclass('NewComponent')
export class NewComponent extends Component {
    dummy = '';

    @property
    serializableDummy = 0;

    nonInit;
}

fn();

import.meta.ccHot?.accept('./Lib.ts', () => {
    log(`[${import.meta.url}]::react to dependency './Lib' update.`);
});

import.meta.ccHot?.accept('./Lib.ts', () => {
    log(`[${import.meta.url}]::react to dependency './Lib' update(2).`);
});

import.meta.ccHot?.dispose((data) => {
    log(`[${import.meta.url}]::disposed with: ${JSON.stringify(data, undefined, 2)}`);
});