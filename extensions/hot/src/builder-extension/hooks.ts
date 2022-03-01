import { IInternalBuildOptions, IInternalHook } from "../../@types/packages/builder/@types/protect";
import ps from 'path';
import fs from 'fs-extra';
import FSTree from "fs-tree-diff";

export const onBeforeBuild: IInternalHook['onBeforeBuild'] = async (options, result) => {
    const hotInfo = await queryHotInfo(options);
    if (!hotInfo) {
        return;
    }

    const { id: hotId, hot: isHotBuild } = hotInfo;
    if (isHotBuild) {
        // Start the server
        await stopHotServer(hotId);
    }
};

export const onAfterBuild: IInternalHook['onAfterBuild'] = async (options, result) => {
    const hotInfo = await queryHotInfo(options);
    if (!hotInfo) {
        return;
    }

    const { id: hotId, hot: isHotBuild } = hotInfo;
    if (isHotBuild) {
        // Start the server
        await startHotServer(hotId, result.paths.dir);
    } else {
        // Copy hot contents into stash
        await emplaceHotContents(hotId, result.paths.dir);
    }
};

interface HotInfo {
    /**
     * True if it's a hot build, otherwise it's a watch build.
     */
    readonly hot: boolean;

    /**
     * The hot id, no matter if it's a hot build.
     */
    readonly id: string;
}

async function queryHotInfo(options: IInternalBuildOptions): Promise<HotInfo | null> {
    const buildName = options.outputName;
    const matches = buildName.match(/(.*)-final$/);
    const hotId = matches?.[1] ?? '';

    return {
        get hot() {
            return !!hotId;
        },
        get id() {
            return hotId ? hotId : buildName;
        },
    };
}

async function startHotServer(hotId: string, buildDir: string) {
    await emplaceBaseVersion(hotId, buildDir);

    // Start the server.
    await Editor.Message.request('hot', 'start-server', hotId);
}

async function stopHotServer(hotId: string) {
    // Stop the server.
    await Editor.Message.request('hot', 'stop-server', hotId);
}

async function emplaceBaseVersion(hotId: string, buildDir: string) {
    const stashPath = getStashPath(hotId);

    // Clear stashes.
    await fs.ensureDir(stashPath);
    await fs.emptyDir(stashPath);

    await copyHotContentInto(buildDir, stashPath);
}

async function emplaceHotContents(hotId: string, buildDir: string) {
    const stashPath = getStashPath(hotId);
    const chunkRoot = getChunkRoot(buildDir);

    const oldFiles: string[] = [];
    const newFiles: string[] = [];
    await Promise.all([
        listFilesRecursive(stashPath, oldFiles),
        listFilesRecursive(chunkRoot, newFiles),
    ]);

    const oldTree = FSTree.fromPaths(oldFiles.sort());
    const newTree = FSTree.fromPaths(newFiles.sort());

    // Calculate patch
    const patch = newTree.calculatePatch(oldTree, (oldFile, newFile): boolean => {
        const oldContent = fs.readFileSync(ps.join(stashPath, oldFile.relativePath), 'utf8');
        const newContent = fs.readFileSync(ps.join(chunkRoot, newFile.relativePath), 'utf8');
        if (oldContent === newContent) {
            return true;
        } else {
            return false;
        }
    });

    // Apply patch
    FSTree.applyPatch(
        chunkRoot,
        stashPath,
        patch,
    );

    const changes = patch.map(([operand, path]) => {
        switch (operand) {
            case 'change':
            case 'create':
            case 'unlink':
                return path;
            default:
                return '';
        }
    }).filter((path) => path);

    await Editor.Message.request('hot', 'push-changes', hotId, changes);
}

async function listFilesRecursive(root: string, files: string[], dir = '') {
    await Promise.all((await fs.readdir(ps.join(root, dir))).map(async (dirent) => {
        const path = ps.join(dir, dirent);
        const stats = await fs.stat(ps.join(root, path));
        if (stats.isFile()) {
            files.push(path);
        } else if (stats.isDirectory()) {
            return listFilesRecursive(root, files, path);
        }
    }));
}

async function copyHotContentInto(buildDir: string, output: string) {
    const chunkRoot = getChunkRoot(buildDir);

    await fs.copy(chunkRoot, output, {
        recursive: true,
        errorOnExist: false,
        overwrite: true,
    });
}

function getChunkRoot(buildRoot: string) {
    return ps.join(buildRoot, 'src', 'chunks');
}

function getStashPath(buildId: string) {
    return ps.resolve(Editor.Project.tmpDir, 'hot', 'builds', buildId, 'stashes');
}