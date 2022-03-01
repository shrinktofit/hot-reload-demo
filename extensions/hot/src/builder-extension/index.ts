import { BuildPlugin, IBuildPluginConfig } from "../../@types/packages/builder/@types";

const nativeCommonConfig: IBuildPluginConfig = {
    hooks: './hooks.js',
};

export const configs: BuildPlugin.Configs = {
    'windows': nativeCommonConfig,
    'mac': nativeCommonConfig,
    'android': nativeCommonConfig,
    'ios': nativeCommonConfig,
};

export function load() {

}

export function unload() {

}