const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const simpleGit = require('simple-git');
const appRoot = require('app-root-path');
const Workspace = require(`${appRoot}/src/new-components/workspace`);
const Messenger = require(`${appRoot}/src/utils/messenger`);

// Singleton
class WorkspaceManager {
    _git
    _instance
    _primaryWorkspace
    _gitAuth = {
        username: undefined,
        password: undefined
    }
    _allWorkspaces = []

    _CONFIG = {
        'WORKSPACE_ROOT_DIR': `${appRoot}/workspaces`,
        'PRIMARY_WORKSPACE_DIR': `${appRoot}/workspaces/primary`,
        'TARGET_GIT_PATH': process.env.TARGET_GIT_PATH || '',
        'ROOT_BRANCH': 'production'
    }

    constructor() {
        let _self = this;
        _self.initGit();
        _self.initGitAuth();
    }

    //---------------Singleton---------------
    static getInstance() {
        let _self = this;
        if (!_self._instance) {
            _self._instance = new WorkspaceManager();
        }
        return _self._instance;
    }

    //---------------------------------------------------------------
    //------------------------------Constructor---------------------------------
    initGit() {
        const _self = this;
        const progress = ({ method, stage, progress }) => {
            Messenger.print(`GIT: ${method} ${stage} stage ${progress}% complete`, true);
        }
        _self._git = simpleGit({ progress });
    }

    initGitAuth() {
        const _self = this;
        _self._gitAuth = _self._gitAuth || {};
        _self._gitAuth.username = encodeURIComponent(process.env.GIT_USERNAME);
        _self._gitAuth.password = encodeURIComponent(process.env.GIT_PASSWORD);
        if (!_self._gitAuth.username || !_self._gitAuth.password) {
            Promise.reject(
                new Error('[WorkspaceManager] Either process.env.GIT_USERNAME or process.env.GIT_PASSWORD are undefined!')
            )
        }
    }

    //---------------------------------------------------------------
    //------------------------------Init (call from controller)---------------------------------
    async removeWorkspaces() {
        /**
         * need to clone the latest version of netgame
         * remove the workspace that is rent and cloned before
         */

        const _self = this;
        const _isWorkspaceRootExists = fs.existsSync(_self._CONFIG.WORKSPACE_ROOT_DIR);
        if (!_isWorkspaceRootExists) return;

        const _allWorkspaceGitFolderName = await getAllWorkspaceGitFolderName();
        Messenger.log('List of previous workspace need to be removed', _allWorkspaceGitFolderName);

        for (const _eachFolder of _allWorkspaceGitFolderName) {
            const _directory = `${_self._CONFIG.WORKSPACE_ROOT_DIR}/${_eachFolder}`
            const _isExist = fs.existsSync(_directory);

            if (_isExist) {
                Messenger.log(`[WorkspaceManager] removing ${_eachFolder}...`);
                await fs.promises.rm(_directory, { recursive: true, force: true })
                Messenger.log(`[WorkspaceManager] ${_eachFolder} is removed`);
            }
        }

        async function getAllWorkspaceGitFolderName() {
            const _allSubPath = await fs.promises.readdir(_self._CONFIG.WORKSPACE_ROOT_DIR, { withFileTypes: true });
            const _allSubDirectories = _allSubPath.filter($dirent => $dirent.isDirectory());
            const _allGitSubDirectoryObjects = _allSubDirectories.filter($dirent => {
                const _direntName = $dirent.name;
                const _isGitDir = fs.existsSync(`${_self._CONFIG.WORKSPACE_ROOT_DIR}/${_direntName}/.git`);
                return _isGitDir;
            });
            const _allGitFolderNames = _allGitSubDirectoryObjects.map($dirent => $dirent.name).filter($direntName => $direntName != 'primary');

            return _allGitFolderNames;
        }
    }

    async initPrimaryWorkspace() {
        /**
         * - clone project to primary for the first time
         * - re pull master to reset workspace
         */
        const _self = this;
        const _workspaceRootDir = _self._CONFIG.WORKSPACE_ROOT_DIR;
        const _isWorkspaceRootDirExist = fs.existsSync(_workspaceRootDir);

        if (!_isWorkspaceRootDirExist) {
            await fs.promises.mkdir(_workspaceRootDir, { recursive: true });
        }

        const _primaryWorkspaceDir = _self._CONFIG.PRIMARY_WORKSPACE_DIR;
        const _targetGitPath = _self._CONFIG.TARGET_GIT_PATH;
        const _isFolderExist = fs.existsSync(_primaryWorkspaceDir);
        const _isGitDirectory = fs.existsSync(`${_primaryWorkspaceDir}/.git`);

        if (_isFolderExist && _isGitDirectory) {
            await _self.resetWorkspace(_primaryWorkspaceDir);
        } else {
            if (!_targetGitPath) throw new Error('process.env.TARGET_GIT_PATH is undefiend!')
            fs.rmSync(_primaryWorkspaceDir, { recursive: true, force: true });
            await fs.promises.mkdir(_primaryWorkspaceDir, { recursive: true });
            await _self.cloneRepo(_targetGitPath, _primaryWorkspaceDir);
        }
    }

    async resetWorkspace($directory) {
        /**
         * get all local branches besides root
         * switch to root and pull
         * remove all local branches
         *
         * git branch format:
            DEV/112/bettingChip
            * DEV/112/changeBacGameType (==> checkout)
            production
         */

        let _self = this;
        _self._git = simpleGit($directory);
        await _self._git.fetch();
        const _allLocalBranchesStr = await _self._git.raw('branch');  //== command (git branch) 
        const _allLocalBranchesExcludeRoot = getAllLocalBranchExcludeRoot(_allLocalBranchesStr);

        await updateRoot();
        await removeAllLocalBranches(_allLocalBranchesExcludeRoot);

        function getAllLocalBranchExcludeRoot($branches) {
            const _allBranchesArr = $branches.split('\n');
            const _trimStarArr = _allBranchesArr.map($branch => $branch.replace('*', ''));
            const _trimSpaceArr = _trimStarArr.map($branch => $branch.trim());
            const _allExistBranches = _trimSpaceArr.filter($branch => $branch !== '');
            const _allBranchesExcludeRoot = _allExistBranches.filter($branch => $branch !== _self._CONFIG.ROOT_BRANCH);

            return _allBranchesExcludeRoot;
        }

        async function updateRoot() {
            await _self._git.raw('checkout', _self._CONFIG.ROOT_BRANCH, '--');
            await _self._git.raw('pull', 'origin', _self._CONFIG.ROOT_BRANCH)
        }

        async function removeAllLocalBranches($allLocalBranches) {
            for (const _localBranch of $allLocalBranches) {
                Messenger.log(`[WorkspaceManager] Deleting local branch ${_localBranch}...`);
                await _self._git.raw('branch', '-D', _localBranch);
                Messenger.log(`[WorkspaceManager] Branch ${_localBranch} is deleted`);
            }
        }
    }

    async cloneRepo($gitPath, $directory) {
        /**
         * clone netgame project to primary folder
         */
        Messenger.log("[WorkspaceManager] cloneRepo: ");
        const _self = this;
        const _gitAuth = _self._gitAuth;
        const _repoPath = removeHttpsPrefix($gitPath);
        const _gitUsername = _gitAuth.username;
        const _gitPassword = _gitAuth.password;
        const _encodedGitPath = `https://${_gitUsername}:${_gitPassword}@${_repoPath}`;

        try {
            Messenger.log("[WorkspaceManager] START cloneRepo...");
            await _self._git.clone(_encodedGitPath, $directory);
            Messenger.log("[WorkspaceManager] FINISH cloneRepo...");
        } catch ($err) {
            throw new Error($err);
        }

        function removeHttpsPrefix($path) {
            return $path.replace('https://', '');
        }
    }

    //---------------------------------------------------------------
    //------------------------------Get idle workspace (call from branch node)---------------------------------
    async getIdleWorkspace() {
        const _self = this;

        for (const _workspace of _self._allWorkspaces) {
            if (_workspace.isIdle) {
                _workspace.rent();
                return _workspace;
            }
        }

        const _newWorkspace = await _self.createWorkspace();
        _newWorkspace.rent();
        return _newWorkspace;
    }

    async releaseWorkspace({ uuid }) {
        const _self = this;
        for (const _workspace of _self._allWorkspaces) {
            if (_workspace.uuid == uuid) _workspace.release();
        }
    }

    async createWorkspace() {
        /**
         * clone from primary
         */
        const _self = this;
        const _uuid = uuidv4();
        const _workspaceRootDir = _self._CONFIG.WORKSPACE_ROOT_DIR;
        const _primaryWorkspaceDir = _self._CONFIG.PRIMARY_WORKSPACE_DIR;
        const _newWorkspaceFolderName = `workspace_${_uuid}`;
        const _newWorkspaceDir = `${_workspaceRootDir}/${_newWorkspaceFolderName}`;
        const _sourceDir = _primaryWorkspaceDir;
        const _destinationDir = _newWorkspaceDir;
        
        Messenger.log(`[Workspace] Creating workspace ${_uuid} ...`);

        try {
            await fs.copy(_sourceDir, _destinationDir, { overwrite: true });
        } catch ($err) {
            throw new Error($err);
        }

        //create Workspace instance
        const _sendObj = {
            uuid: _uuid,
            folderName: _newWorkspaceFolderName,
            directory: _workspaceRootDir
        };
        const _newWorkspace = new Workspace(_sendObj);
        _self._allWorkspaces.push(_newWorkspace);
        return _newWorkspace;
    }
}

module.exports = WorkspaceManager;