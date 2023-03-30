const fs = require('fs-extra');
const simpleGit = require('simple-git');
const appRoot = require('app-root-path');
const Messenger = require(`${appRoot}/src/utils/messenger`);
const shelljs = require('shelljs');

class Workspace{
    _uuid
    _idle                           // flag to show this workspace is idle or not
    _directory
    _folderName
    _gitAuth = {
        username: undefined,
        password: undefined
    }

    constructor($sendObj) {
        console.log("[Workspace] constructing workspace...");
        let _self = this;
        _self._uuid = $sendObj.uuid;
        _self._folderName = $sendObj.folderName;
        _self._directory = $sendObj.directory;
        _self._idle = true;
        if(!$sendObj.folderName || !$sendObj.directory) throw new Error('Workspace construction error, missing folderName or directory');
        _self.initGit();
        _self.initGitAuth();
    }

    initGit(){
        let _self = this,
            _directory = `${_self._directory}/${_self._folderName}`,
            progress = ({method, stage, progress}) => {
                Messenger.print(`GIT: ${method} ${stage} stage ${progress}% complete`, true);
            };
        _self._git = simpleGit(_directory, {progress});
    }

    initGitAuth(){
        let _self = this;
        _self._gitAuth = _self._gitAuth || {};
        _self._gitAuth.username = encodeURIComponent(process.env.GIT_USERNAME);
        _self._gitAuth.password = encodeURIComponent(process.env.GIT_PASSWORD);
        if(!_self._gitAuth.username || !_self._gitAuth.password){
            Promise.reject(
                new Error ('[Workspace] Either process.env.GIT_USERNAME or process.env.GIT_PASSWORD are undefined!')
            )
        }
    }

    async getRootPreviewData($rootBranch) {
        let _self = this,
            _returnObj = {
                destinationCommitHash: undefined
            },
            _isRootBranchValid = await _self.isValidRemoteBranch($rootBranch);

        if(!_isRootBranchValid) throw new Error(`Remote doesn\'t contains ${$sourceBranch}`);

        console.log(`[Workspace] Getting commit data <${$rootBranch}> by ${_self._folderName}... `);

        console.log(`==================================================`);
        console.log(`Fetch and Pull Root Branches`);
        shelljs.cd(_self._directory+'/'+_self._folderName);
        shelljs.exec(`git checkout ${$rootBranch} --`);
        shelljs.exec(`git fetch`);
        shelljs.exec(`git pull`);

        console.log(`Root Branch Commit Hash`);
        _returnObj.destinationCommitHash = shelljs.exec(`git log -n 1 ${$rootBranch} --pretty=format:'%H'`).stdout;
        console.log(`\n`);

        console.log(`==================================================`);

        console.log(`[Workspace] Finish getting commit data <${$rootBranch}> by ${_self._folderName}`);

        return _returnObj;
    }

    async merge($sourceBranch, $destinationBranch, $QAStatus){
        // Merge process:  
        // 1. set idle = false for this instance
        // 2. fetch and pull and push for both $sourceBranch and $destinationBranch (keep latest version)
        // 3. checkout $destinationBranch
        // 4. merge $sourceBranch into current branch
        // 5. set idle = true for this instance

        let _self = this,
            _returnObj = {
                success: false,
                result: undefined,
                sourceBranchAuthor: undefined,
                sourceBranchCommitMsg: undefined,
                sourceBranchCommitHash: undefined,
                destinationBranchCommitHash: undefined,
                destinationBranchPreviewCommitHash: undefined,
            },
            _isSourceBranchValid = await _self.isValidRemoteBranch($sourceBranch),
            _isDestinationBranchValid = await _self.isValidRemoteBranch($destinationBranch);

        if(!_isSourceBranchValid) throw new Error(`Remote doesn\'t contains ${$sourceBranch}`);
        if(!_isDestinationBranchValid) throw new Error(`Remote doesn\'t contains ${$destinationBranch}`);

        console.log(`[Workspace] Merging <${$sourceBranch}> into <${$destinationBranch}> by ${_self._folderName}... `);

        console.log(`==================================================`);
        console.log(`Fetch and Pull Merge Branches`);
        shelljs.cd(_self._directory+'/'+_self._folderName);
        shelljs.exec(`git checkout ${$sourceBranch} --`);
        shelljs.exec(`git fetch`);
        shelljs.exec(`git pull`);
        shelljs.exec(`git checkout ${$destinationBranch} --`);
        shelljs.exec(`git fetch`);
        shelljs.exec(`git pull`);

        console.log(`Source Branch Author`);
        _returnObj.sourceBranchAuthor = shelljs.exec(`git log -1 ${$sourceBranch} --pretty=format:'%an'`).stdout;
        console.log(`\n`);

        console.log(`Source Branch Commit Hash`);
        _returnObj.sourceBranchCommitHash = shelljs.exec(`git log -n 1 ${$sourceBranch} --pretty=format:'%H'`).stdout;
        console.log(`\n`);

        console.log(`Source Branch Commit Message`);
        _returnObj.sourceBranchCommitMsg = shelljs.exec(`git log --oneline --pretty=format:'(%an)%s' --no-merges --max-count=1 ${$sourceBranch}`).stdout;
        console.log(`\n`);
        console.log(`==================================================`);

        try{
            let _result = shelljs.exec(`git merge origin/${$sourceBranch} -m "[ci-skip] Auto merge branch ${$sourceBranch} into ${$destinationBranch}"`),
                _status = _result.code,
                _isSuccess = _status == 0;

            if(!_isSuccess) throw new Error(_result.stdout);
            _returnObj.success = true;
            _returnObj.result = _result;
            _returnObj.destinationBranchCommitHash = shelljs.exec(`git log -n 1 ${$destinationBranch} --pretty=format:'%H'`).stdout;
            shelljs.exec(`git push origin ${$destinationBranch}`);
        }catch($err){
            console.log(`[Workspace] Fail to merge <${$sourceBranch}> into <${$destinationBranch}>, Reason: ${$err}`);
            _returnObj.success = false;
            _returnObj.result = $err;
            shelljs.exec('git merge --abort');
            return _returnObj;
        }
        console.log(`[Workspace] Finished merge <${$sourceBranch}> into <${$destinationBranch}> by ${_self._folderName}`);
        console.log(`[Workspace] Success _isMergeSuccess ${_returnObj}`);        
        getBuildInfoFromWebServer();

        return _returnObj;

        function getBuildInfoFromWebServer(){
            let _trimBranchName = $destinationBranch.replace (/\//g, "_");
            console.log(`==================================================`);
            console.log(`Fetch the build commit info from 92 Webserver`);
            shelljs.exec('pwd');
            console.log(`Get into 92 Webserver`);
            shelljs.cd('/Volumes/WebServer/');
            shelljs.exec('pwd');
            if(fs.existsSync(_trimBranchName)){
                console.log(`Get into specific branch folder`);
                shelljs.cd(_trimBranchName);
                shelljs.exec('pwd');

                let _destinationBranchPreviewCommitHash = shelljs.exec(`cat .buildCommitInfo`).stdout;
                _returnObj.destinationBranchPreviewCommitHash = _destinationBranchPreviewCommitHash;
            }
        }
    }

    async isValidRemoteBranch($branch){
        let _self = this;
        return await _self._git.raw('ls-remote', '--heads', 'origin', $branch) !== '';
    }

    async checkoutBranch($branch){
        let _self = this; 
        await _self._git.checkout($branch);
        console.log(`[Workspace] Finished checkout to ${$branch}`);
    }

    async fetchAndPullCurBranch(){
        console.log("[Workspace] Start fetch and pull ...");
        let _self = this;
        await _self._git.fetch();
        await _self._git.pull();
    }

    async pushBranch($branch){
        console.log(`[Workspace] Pushing ${$branch} branch ...`);
        let _self = this;
        await _self._git.push('origin', $branch);
    }

    async abortMerge(){
        let _self = this;
        await _self._git.raw('merge', '--abort');
    }

    rent(){
        let _self = this;
        console.log(`[Workspace] Workspace ${_self._uuid} is rented`);
        _self._idle = false;
    }

    release(){
        let _self = this;
        console.log(`[Workspace] Workspace ${_self._uuid} is released`);
        _self._idle = true;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // getter and setter
    get isIdle(){
        let _self = this;
        return _self._idle == true
    }

    get uuid(){
        let _self = this;
        return _self._uuid;
    }
}

module.exports = Workspace;