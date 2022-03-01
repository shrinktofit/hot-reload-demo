
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Folder/NewComponent')
export class NewComponent extends Component {
    dummy = '';

    @property
    serializableDummy = 0;

    nonInit;
}
