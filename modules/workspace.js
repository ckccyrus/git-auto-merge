const fs = require('fs-extra');
const simpleGit = require('simple-git');
const appRoot = require('app-root-path');
const Messenger = require(`${appRoot}/modules/messenger`);
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
        console.log("DEBUG: [Workspace] constructing workspace...");
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

    async merge($sourceBranch, $destinationBranch){
        // Merge process:  
        // 1. set idle = false for this instance
        // 2. fetch and pull and push for both $sourceBranch and $destinationBranch (keep latest version) // TODO: study what if someone push a newer version duration the merge process?
        // 3. checkout $destinationBranch
        // 4. merge $sourceBranch into current branch
        // 5. set idle = true for this instance

        let _self = this,
            _isMergeSuccess = false,
            _isSourceBranchValid = await _self.isValidRemoteBranch($sourceBranch),
            _isDestinationBranchValid = await _self.isValidRemoteBranch($destinationBranch);

        if(!_isSourceBranchValid) throw new Error(`Remote doesn\'t contains ${$sourceBranch}`);
        if(!_isDestinationBranchValid) throw new Error(`Remote doesn\'t contains ${$destinationBranch}`);

        console.log(`DEBUG: [Workspace] Merging <${$sourceBranch}> into <${$destinationBranch}> by ${_self._folderName}... `);

        shelljs.cd(_self._directory+'/'+_self._folderName);
        shelljs.exec(`git checkout ${$sourceBranch}`);
        shelljs.exec(`git fetch`);
        shelljs.exec(`git pull`);
        shelljs.exec(`git checkout ${$destinationBranch}`);
        shelljs.exec(`git fetch`);
        shelljs.exec(`git pull`);

        try{

            let _result = shelljs.exec(`git merge origin/${$sourceBranch} -m "[ci-skip] Auto merge from ${$sourceBranch} to ${$destinationBranch}"`),
                _status = _result.code,
                _isSuccess = _status == 0;

            if(!_isSuccess) throw new Error(_result.stdout);
            console.log("DEBUG: [Workspace] merge result: ", _result);
            _isMergeSuccess = true;
            shelljs.exec(`git push origin ${$destinationBranch}`);
        }catch($err){
            console.log(`DEBUG: [Workspace] Fail to merge <${$sourceBranch}> into <${$destinationBranch}>, Reason: ${$err}`);
            _isMergeSuccess = false;
            shelljs.exec('git merge --abort');
            return _isMergeSuccess;
        }
        console.log(`DEBUG: [Workspace] Finished merge <${$sourceBranch}> into <${$destinationBranch}> by ${_self._folderName}`);
        console.log(`DEBUG: [Workspace] Success _isMergeSuccess ${_isMergeSuccess}`);
        return _isMergeSuccess;
    }

    async isValidRemoteBranch($branch){
        let _self = this;
        return await _self._git.raw('ls-remote', '--heads', 'origin', $branch) !== '';
    }

    async checkoutBranch($branch){
        let _self = this; 
        await _self._git.checkout($branch);
        console.log(`DEBUG: [Workspace] Finished checkout to ${$branch}`);
    }

    async fetchAndPullCurBranch(){
        console.log("DEBUG: [Workspace] Start fetch and pull ...");
        let _self = this;
        await _self._git.fetch();
        await _self._git.pull();
    }

    async pushBranch($branch){
        console.log(`DEBUG: [Workspace] Pushing ${$branch} branch ...`);
        let _self = this;
        await _self._git.push('origin', $branch);
    }

    async abortMerge(){
        let _self = this;
        await _self._git.raw('merge', '--abort');
    }

    rent(){
        let _self = this;
        console.log(`DEBUG: [Workspace] Workspace ${_self._uuid} is rented`);
        _self._idle = false;
    }

    release(){
        let _self = this;
        console.log(`DEBUG: [Workspace] Workspace ${_self._uuid} is released`);
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