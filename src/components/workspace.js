const fs = require('fs-extra');
const simpleGit = require('simple-git');
const appRoot = require('app-root-path');
const Messenger = require(`${appRoot}/src/utils/messenger`);
const shelljs = require('shelljs');

class Workspace {
    _uuid;
    _idle;                           // flag to show this workspace is idle or not
    _directory;
    _folderName;
    _gitAuth = {
        username: undefined,
        password: undefined
    };

    constructor($sendObj) {
        Messenger.log("[New Workspace] constructing workspace...");
        const _self = this;
        if (!$sendObj.folderName || !$sendObj.directory) throw new Error('Workspace construction error, missing folderName or directory');
        _self.init($sendObj);
    }

    //---------------------------------------------------------------
    //------------------------------Init---------------------------------
    init({ uuid, folderName, directory }) {
        const _self = this;
        _self._uuid = uuid;
        _self._folderName = folderName;
        _self._directory = directory;
        _self._idle = true;
        _self.initGit();
        _self.initGitAuth();
    }

    initGit() {
        const _self = this;
        const _directory = `${_self._directory}/${_self._folderName}`;
        const progress = ({ method, stage, progress }) => {
            Messenger.print(`GIT: ${method} ${stage} stage ${progress}% complete`, true);
        };
        _self._git = simpleGit(_directory, { progress });
    }

    initGitAuth() {
        const _self = this;
        _self._gitAuth = _self._gitAuth || {};
        _self._gitAuth.username = encodeURIComponent(process.env.GIT_USERNAME);
        _self._gitAuth.password = encodeURIComponent(process.env.GIT_PASSWORD);
        if (!_self._gitAuth.username || !_self._gitAuth.password) {
            Promise.reject(
                new Error('[Workspace] Either process.env.GIT_USERNAME or process.env.GIT_PASSWORD are undefined!')
            )
        }
    }

    //---------------------------------------------------------------
    //------------------------------Get branch preview data---------------------------------
    async getBranchPreviewData($branch) {
        const _self = this;
        const _returnObj = {
            targetBranchCommitHash: undefined,
            targetBranchPreviewCommitHash: undefined
        };
        const _isBranchValid = await _self.isValidRemoteBranch($branch);
        if (!_isBranchValid) throw new Error(`Remote doesn\'t contains ${$branch}`);

        Messenger.log(`====================================================================================================`);
        Messenger.log(`[Workspace] Getting commit data <${$branch}> by ${_self._folderName}... `);
        Messenger.log(`Fetch and Pull Branch`);

        shelljs.cd(_self._directory + '/' + _self._folderName);
        _self.fetchAndPullBranch($branch);

        Messenger.log(`Branch Commit Hash`);
        _returnObj.targetBranchCommitHash = _self.getCommitHash($branch);
        _returnObj.targetBranchPreviewCommitHash = _self.getBuildInfoFromWebServer($branch);

        Messenger.log(`[Workspace] Finish getting commit data <${$branch}> by ${_self._folderName}`);
        Messenger.log(`====================================================================================================`);

        return _returnObj;
    }

    async merge($parentBranch, $targetBranch) {
        /**
         * - fetch and pull and push for both $parentBranch and $targetBranch (keep latest version)
         * - checkout $targetBranch
         * - merge $parentBranch into current branch
         */

        const _self = this;
        const _returnObj = {
            success: false,
            result: undefined,
            parentBranchCommitMsg: undefined,
            targetBranchCommitHash: undefined,
            targetBranchPreviewCommitHash: undefined,
        };
        const _isparentBranchValid = await _self.isValidRemoteBranch($parentBranch);
        const _isTargetBranchValid = await _self.isValidRemoteBranch($targetBranch);

        if (!_isparentBranchValid) throw new Error(`Remote doesn\'t contains ${$parentBranch}`);
        if (!_isTargetBranchValid) throw new Error(`Remote doesn\'t contains ${$targetBranch}`);

        Messenger.log(`====================================================================================================`);
        Messenger.log(`[Workspace] Merging <${$parentBranch}> into <${$targetBranch}> by ${_self._folderName}... `);
        shelljs.cd(_self._directory + '/' + _self._folderName);

        Messenger.log(`Fetch and Pull Source Branch`);
        _self.fetchAndPullBranch($parentBranch);

        Messenger.log(`Fetch and Pull Target Branch`);
        _self.fetchAndPullBranch($targetBranch);

        Messenger.log(`Source Branch Commit Message`);
        _returnObj.parentBranchCommitMsg = shelljs.exec(`git log --oneline --pretty=format:'(%an)%s' --no-merges --max-count=1 ${$parentBranch}`).stdout;
        console.log(`\n`);

        try {
            const _result = shelljs.exec(`git merge origin/${$parentBranch} -m "[ci-skip] Auto merge branch ${$parentBranch} into ${$targetBranch}"`);
            const _status = _result.code;
            const _isSuccess = (_status == 0);

            if (!_isSuccess) throw new Error(_result.stdout); //==> merge conflict

            _returnObj.success = true;
            _returnObj.result = _result;
            shelljs.exec(`git push origin ${$targetBranch}`);
        } catch ($err) {  //merge conflict
            Messenger.log(`[Workspace] Fail to merge <${$parentBranch}> into <${$targetBranch}>, Reason: ${$err}`);
            _returnObj.success = false;
            _returnObj.result = $err;
            shelljs.exec('git merge --abort');
        }

        Messenger.log(`Target Branch Commit Hash`);
        _returnObj.targetBranchCommitHash = _self.getCommitHash($targetBranch);
        _returnObj.targetBranchPreviewCommitHash = _self.getBuildInfoFromWebServer($targetBranch);
        
        Messenger.log(`[Workspace] Merge Result: `, _returnObj);
        Messenger.log(`[Workspace] Finished merge <${$parentBranch}> into <${$targetBranch}> by ${_self._folderName}`);
        Messenger.log(`====================================================================================================`);
        
        return _returnObj;
    }

    getBuildInfoFromWebServer($branch) {
        const _trimBranchName = $branch.replace(/\//g, "_");
        let _targetBranchPreviewCommitHash;

        console.log(`\n`);
        Messenger.log(`==================================================`);
        Messenger.log(`Fetch the build commit info from 92 Webserver`);
        shelljs.exec('pwd');
        Messenger.log(`Get into 92 Webserver`);
        shelljs.cd('/Volumes/WebServer/preview/gc/prod/');
        shelljs.exec('pwd');
        if (fs.existsSync(_trimBranchName)) {
            Messenger.log(`Get into specific branch folder`);
            shelljs.cd(_trimBranchName);
            shelljs.exec('pwd');

            _targetBranchPreviewCommitHash = shelljs.exec(`cat .buildCommitInfo`).stdout;
        }
        Messenger.log(`==================================================`);

        return _targetBranchPreviewCommitHash;
    }

    async isValidRemoteBranch($branch) {
        const _self = this;
        return await _self._git.raw('ls-remote', '--heads', 'origin', $branch) !== '';
    }

    fetchAndPullBranch($branch) {
        shelljs.exec(`git checkout ${$branch} --`);
        shelljs.exec(`git fetch`);
        shelljs.exec(`git pull`);
    }

    getCommitHash($branch) {
        return shelljs.exec(`git log -n 1 ${$branch} --pretty=format:'%H'`).stdout
    }
    //---------------------------------------------------------------
    //------------------------------Workspace manager---------------------------------
    rent() {
        const _self = this;
        Messenger.log(`[Workspace] Workspace ${_self._uuid} is rented`);
        _self._idle = false;
    }

    release() {
        const _self = this;
        Messenger.log(`[Workspace] Workspace ${_self._uuid} is released`);
        _self._idle = true;
    }

    // getter and setter
    get isIdle() {
        const _self = this;
        return _self._idle == true
    }

    get uuid() {
        const _self = this;
        return _self._uuid;
    }
}

module.exports = Workspace;