const appRoot = require('app-root-path');
const Cms = require(`${appRoot}/modules/cms`);
const MessageBuilder = require(`${appRoot}/modules/messageBuilder`);
const Event = require(`${appRoot}/modules/event`);
const WorkspaceManager = require(`${appRoot}/modules/workspaceManager`);

class BranchNode {
    _event;
    _isRoot;
    _branchName;
    _parentNode;
    _mergeStatus;       // PENDING || SUCCESS || FAIL
    _workspaceManager;
    _childrenNodes;
    _childrenNodesArr;
    _branchRelationship; // TODO: should move to better position
    _childNodeReadyCount;

    // Instance
    _cms;

    constructor($branchName, $parentNode, $branchRelationship){
        let _self = this;
        _self._event = new Event();
        _self._workspaceManager = WorkspaceManager.getInstance();
        _self._branchName = $branchName;
        _self._parentNode = $parentNode;
        _self._branchRelationship = $branchRelationship;
        _self._childrenNodes = [];
        _self._childrenNodesArr = _self.getAllChildrenNodesArr();
        _self._mergeStatus = 'PENDING';
        _self.createAllChildrenNodes();
        _self.listenAllChildrenNodes();
        _self._isRoot = ($parentNode == null) ? true : false;
        _self._cms = new Cms();
        _self._messageBuilder = new MessageBuilder();
        console.log(`DEBUG: BrachNode [${_self._branchName}] is created, its children are: ${_self._childrenNodesArr}`)
    }

    // methods 
    createAllChildrenNodes(){
        let _self = this,
            _parentNode = this;
        _self._childrenNodesArr.forEach($childName => {
            _self._childrenNodes.push(new BranchNode($childName, _parentNode, _self._branchRelationship));
        });
    }

    listenAllChildrenNodes(){
        let _self = this;
        _self._childrenNodes.forEach($childNode => {
            $childNode._event.on('branchNodeEvent', _self.onBranchNodeEvent, _self);
        })
    }

    getAllChildrenNodesArr(){
        let _self = this,
            _branchRelationship = _self._branchRelationship,
            _childrenNodesArr = []
        for (const [$branch, $parent] of Object.entries(_branchRelationship)) {
            if($parent == _self._branchName){
                _childrenNodesArr.push($branch);
            }
        }
        return _childrenNodesArr;
    }

    onBranchNodeEvent($evt){
        let _self = this,
            _eventType = $evt.eventType;
        switch(_eventType){
        }
    }

    async propagate(){
        let _self = this;
        if(!_self._isRoot){
            let _mergeStatus = await _self.mergeSchedule();
            if(_mergeStatus === 'SUCCESS'){
                for (const $childNode of _self._childrenNodes) {
                    await $childNode.propagate();
                }
            }else{
                console.log(`DEBUG: [BranchNode] Since fail merge from ${_self._parentNode.getBranchName} to ${_self._branchName}, stop downward propagate.`);
            }
        }else{
            for (const $childNode of _self._childrenNodes) {
                await $childNode.propagate();
            }
        }

        // Propagate in parallel
        // await Promise.all(_self._childrenNodes.map(async $childNode => {
        //     await $childNode.propagate();
        // }));

        // Propagate in sequence
        // for (const $childNode of _self._childrenNodes) {
        //     await $childNode.propagate();
        // }
    }

    async mergeSchedule(){ // need parent and child branch name to merge
        let _self = this,
            _isMergeSuccess = false,
            _curBranchName = _self._branchName,
            _parentBranchName = _self._isRoot ? '' : _self._parentNode.getBranchName,
            _sourceBranchName = _parentBranchName,
            _destinationBranchName = _curBranchName,
            _workspaceManager = _self._workspaceManager,
            _workspace = await _workspaceManager.getIdleWorkspace();

        _isMergeSuccess = await _workspace.merge(_sourceBranchName, _destinationBranchName);

        _workspaceManager.releaseWorkspace(_workspace);

        if(_isMergeSuccess) {
            _self.updateMergeStatus('SUCCESS');
        }else{
            _self.updateMergeStatus('FAIL');
            // Send TG to who is incharge for this branch
            let _message = _self._messageBuilder.getMergeConflictMsg(_sourceBranchName, _destinationBranchName),
                _tgIdTo214 = '1433671879';
            await _self._cms.sendMessage(_tgIdTo214, _message);
        }

        return _isMergeSuccess;
    }

    updateMergeStatus($newMergeStatus){
        let _self = this;
        _self._mergeStatus = $newMergeStatus;
    }

    // getter and setter

    get getBranchName(){
        let _self = this;
        return _self._branchName;
    }
}

module.exports = BranchNode;