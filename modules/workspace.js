const fs = require('fs-extra');
const simpleGit = require('simple-git');
const appRoot = require('app-root-path');
const Messenger = require(`${appRoot}/modules/messenger`);

class Workspace{
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
        _self._folderName = $sendObj.folderName,
        _self._directory = $sendObj.directory,
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
        // TODO: real merge process:  
        // 1. set idle = false for this instance
        // 2. fetch and pull and push for both $sourceBranch and $destinationBranch (keep latest version) // TODO: study what if someone push a newer version duration the merge process?
        // 3. checkout $destinationBranch
        // 4. merge $sourceBranch into current branch
        // 5. set idle = true for this instance

        let _self = this,
            _isSourceBranchValid = await _self.isValidRemoteBranch($sourceBranch),
            _isDestinationBranchValid = await _self.isValidRemoteBranch($destinationBranch);

        if(!_isSourceBranchValid) throw new Error(`Remote doesn\'t contains ${$sourceBranch}`);
        if(!_isDestinationBranchValid) throw new Error(`Remote doesn\'t contains ${$destinationBranch}`);

        console.log(`DEBUG: [Workspace] Merging <${$sourceBranch}> into <${$destinationBranch}> by ${_self._folderName}... `);

        await _self.checkoutBranch($sourceBranch);
        await _self.fetchAndPullCurBranch();
        await _self.checkoutBranch($destinationBranch);
        await _self.fetchAndPullCurBranch();

        try{
            let mergeSummary = await _self._git.raw('merge', $sourceBranch)
            console.log("DEBUG: [Workspace] mergeSummary: ", mergeSummary);
            await _self.pushBranch($destinationBranch);
        }catch($err){
            // Merge failed
            throw new Error($err)
        }

        _self.release();
        console.log(`DEBUG: [Workspace] Finished merge <${$sourceBranch}> into <${$destinationBranch}> by ${_self._folderName}`);


        // let _self = this;
        // let _randomSec = getRandomInt(3, 10);
        // console.log(`DEBUG: [Workspace] Merging <${$sourceBranch}> into <${$destinationBranch}> for ${_randomSec} sec by ${_self._folderName}... `);
        // await _self.sleep(_randomSec * 1000) // sleep for 3-10 second to pretend merging
        // console.log(`DEBUG: [Workspace] Finished merge <${$sourceBranch}> into <${$destinationBranch}> by ${_self._folderName}`);
        // _self.release();

        // function getRandomInt(min, max) {
        //     min = Math.ceil(min);
        //     max = Math.floor(max);
        //     return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
        // }
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

    rent(){
        let _self = this;
        _self._idle = false;
    }

    release(){
        let _self = this;
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
}

module.exports = Workspace;