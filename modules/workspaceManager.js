const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const simpleGit = require('simple-git');
const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });
const Workspace = require(`${appRoot}/modules/workspace`);
const Messenger = require(`${appRoot}/modules/messenger`);

// Singleton
class WorkspaceManager{
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
        'TARGET_GIT_PATH': 'https://gitlab.ttt.link/214/automerge.git'
    }
    
    constructor() {
        let _self = this;
        _self.initGit();
        _self.initGitAuth();
        // _self.setupWorkspaces();
        _self.removeWorkspaces();
    }

    static getInstance(){
        let _self = this;
        if(!_self._instance){
            _self._instance = new WorkspaceManager();
        }
        return _self._instance;
    }

    initGit(){
        let _self = this,
            progress = ({method, stage, progress}) => {
                Messenger.print(`GIT: ${method} ${stage} stage ${progress}% complete`, true);
            }
        _self._git = simpleGit({progress});
    }

    initGitAuth(){
        let _self = this;
        _self._gitAuth = _self._gitAuth || {};
        _self._gitAuth.username = encodeURIComponent(process.env.GIT_USERNAME);
        _self._gitAuth.password = encodeURIComponent(process.env.GIT_PASSWORD);
        if(!_self._gitAuth.username || !_self._gitAuth.password){
            Promise.reject(
                new Error ('[WorkspaceManager] Either process.env.GIT_USERNAME or process.env.GIT_PASSWORD are undefined!')
            )
        }
    }

    async removeWorkspaces(){
        let _self = this,
            _allWorkspaceFolderNames = await getAllWorkspaceFolderName();
        
        for (let i = 0; i < _allWorkspaceFolderNames.length; i++) {
            let _workspaceFolderName = _allWorkspaceFolderNames[i],
                _workspaceDirectory = `${_self._CONFIG.WORKSPACE_ROOT_DIR}/${_workspaceFolderName}`;
            console.log(`DEBUG: [WorkspaceManager] removing ${_workspaceFolderName}...`);
            await fs.promises.rm(_workspaceDirectory, { recursive: true, force: true })
            console.log(`DEBUG: [WorkspaceManager] ${_workspaceFolderName} is removed`);
        }

        async function getAllWorkspaceFolderName(){
            let _allSubPath = await fs.promises.readdir(_self._CONFIG.WORKSPACE_ROOT_DIR, { withFileTypes: true}),
                _allSubDirectories = _allSubPath.filter($dirent => $dirent.isDirectory()),
                _allGitSubDirectoryObjects = _allSubDirectories.filter($dirent => {
                    let _direntName = $dirent.name,
                        _isGitDir = fs.existsSync(`${_self._CONFIG.WORKSPACE_ROOT_DIR}/${_direntName}/.git`);
                    return _isGitDir;
                }),
                _allGitFolderNames = _allGitSubDirectoryObjects.map($dirent => $dirent.name).filter($direntName => $direntName != 'primary');
            
            return _allGitFolderNames;
        }
    }

    async initPrimaryWorkspace(){
        let _self = this,
            _workspaceRootDir = _self._CONFIG.WORKSPACE_ROOT_DIR,
            _isRootWorkspaceDirExist = fs.existsSync(_workspaceRootDir);

        if(!_isRootWorkspaceDirExist){
            await fs.promises.mkdir(_workspaceRootDir, { recursive: true });
        }

        let _primaryWorkspaceDir = _self._CONFIG.PRIMARY_WORKSPACE_DIR,
            _targetGitPath = _self._CONFIG.TARGET_GIT_PATH,
            _isFolderExist = fs.existsSync(_primaryWorkspaceDir),
            _isGitDirectory = fs.existsSync(`${_primaryWorkspaceDir}/.git`);
        
        if(_isFolderExist && _isGitDirectory){
            // await _self.fetchAndPullRepo(_primaryWorkspaceDir);
            await _self.resetWorkspace(_primaryWorkspaceDir);
        }else{
            fs.rmSync(_primaryWorkspaceDir, { recursive: true, force: true });
            await fs.promises.mkdir(_primaryWorkspaceDir, { recursive: true });
            await _self.cloneRepo(_targetGitPath, _primaryWorkspaceDir);
        }
    }

    async resetWorkspace($directory){
        // fetch
        // switch to master and pull
        // remove all local branches
        let _self = this;
        _self._git = simpleGit($directory);
        await _self._git.fetch();
        let _allLocalBranchesStr = await _self._git.raw('branch'),
            _allLocalBranchesExcludeMasterArr = _self.getAllLocalBranchExclMasterArr(_allLocalBranchesStr);
        await updateMaster();
        await removeAllLocalBranches(_allLocalBranchesExcludeMasterArr);

        async function updateMaster(){
            await _self._git.raw('checkout', 'master');
            await _self._git.raw('pull', 'origin', 'master')
        }

        async function removeAllLocalBranches($allLocalBranchArr){
            for (let i = 0; i < _allLocalBranchesExcludeMasterArr.length; i++) {
                const _branch = _allLocalBranchesExcludeMasterArr[i];
                console.log(`DEBUG: [WorkspaceManager] Deleting local branch ${_branch}...`);
                await _self._git.raw('branch', '-D', _branch);
                console.log(`DEBUG: [WorkspaceManager] Branch ${_branch} is deleted`);
            }
        }
    }

    getAllLocalBranchExclMasterArr($allLocalBranchesStr){
        let _allLocalBranchesSplit = $allLocalBranchesStr.split('\n'),
            _allLocalBranchesTrimStar = _allLocalBranchesSplit.map($branch=>$branch.replace('*', '')),
            _allLocalBranchesTrimSpace = _allLocalBranchesTrimStar.map($branch=>$branch.trim()),
            _allLocalBranches = _allLocalBranchesTrimSpace.filter($branch=>$branch!=''),
            _allLocalBranchesExcludeMaster = _allLocalBranches.filter($branch=>$branch!='master');
        return _allLocalBranchesExcludeMaster;
    }

    async fetchAndPullRepo($directory){
        let _self = this;
        _self._git = simpleGit($directory);
        await _self._git.fetch();
        await _self._git.pull();
        Messenger.print(`Finished fetch and pull in ${$directory}`)
    }

    async cloneRepo($gitPath, $directory){
        console.log("DEBUG: [WorkspaceManager] cloneRepo: ", this._gitAuth);
        let _self = this,
            _gitAuth = _self._gitAuth,
            _repoPath = removeHttpsPrefix($gitPath),
            _gitUsername = _gitAuth.username,
            _gitPassword = _gitAuth.password,
            _encodedGitPath = `https://${_gitUsername}:${_gitPassword}@${_repoPath}`;

        try{
            console.log("DEBUG: [WorkspaceManager] start cloneRepo...");
            await _self._git.clone(_encodedGitPath, $directory);
        }catch($err){ 
            throw new Error($err);
        }

        function removeHttpsPrefix ($path) {
            return $path.replace('https://', '');
        }
    }

    async getIdleWorkspace(){
        let _self = this,
            _found = false,
            _checked = 0;

        for(let i = 0; i < _self._allWorkspaces.length; i++){
            let _workspace = _self._allWorkspaces[i],
                _isLastLoop = _checked == _self._allWorkspaces.length;
            if(_workspace.isIdle){
                _workspace.rent();
                _found = true;
                return _workspace;
            }
            if(_isLastLoop && !_found){
                let _newWorkspace = await _self.createWorkspace();
                _newWorkspace.rent();
                return _newWorkspace;
            }
        }

        let _newWorkspace = await _self.createWorkspace();
        _newWorkspace.rent();
        return _newWorkspace;
    }

    async releaseWorkspace($workspace){
        let _self = this,
            _targetUuid = $workspace.uuid;
        for (let i = 0; i < _self._allWorkspaces.length; i++) {
            const _workspace = _self._allWorkspaces[i];
            if(_workspace.uuid == _targetUuid){
                _workspace.release();
            }
        }
    }

    async createWorkspace(){
        //clone from primary
        let _self = this,
            _uuid = uuidv4(),
            _workspaceRootDir = _self._CONFIG.WORKSPACE_ROOT_DIR,
            _primaryWorkspaceDir = _self._CONFIG.PRIMARY_WORKSPACE_DIR,
            _newWorkspaceFolderName = `workspace_${_uuid}`,
            _newWorkspaceDir = `${_workspaceRootDir}/${_newWorkspaceFolderName}`,
            _sourceDir = _primaryWorkspaceDir,
            _destinationDir = _newWorkspaceDir; 

        try{
            await fs.copy(_sourceDir, _destinationDir, { overwrite: true });
        }catch($err){
            throw new Error($err);
        }

        //create Workspace instance
        let _sendObj = {
                uuid: _uuid,
                folderName: _newWorkspaceFolderName,
                directory: _workspaceRootDir
            },
            _newWorkspace = new Workspace(_sendObj);
        _self._allWorkspaces.push(_newWorkspace);
        return _newWorkspace;
    }
}

module.exports = WorkspaceManager;