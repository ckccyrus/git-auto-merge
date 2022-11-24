const appRoot = require('app-root-path');
const CmsService = require(`${appRoot}/src/services/cms`);
const MessageBuilderUtil = require(`${appRoot}/src/utils/messageBuilder`);
const Event = require(`${appRoot}/src/modules/event`);
const WorkspaceManager = require(`${appRoot}/src/managers/workspaceManager`);

class BranchNode {
    _cmsService;
    _event;
    _isRoot;
    _inCharge;
    _branchData;
    _branchName;
    _parentNode;
    _mergeStatus;       // PENDING || SUCCESS || FAIL
    _workspaceManager;
    _childrenNodes;
    _childrenNodesArr;
    _branchRelationship; // TODO: should move to better position
    _childNodeReadyCount;

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
        _self._cmsService = new CmsService();
        _self._branchData = _self._branchRelationship[_self._branchName];
        _self._inCharge = _self._branchData['inCharge'];
        console.log(`[BranchNode] BrachNode [${_self._branchName}] is created, its children are: [${_self._childrenNodesArr}], it is in charged by ${_self._inCharge}`)
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
        for (const [$branch, $branchData] of Object.entries(_branchRelationship)) {
            let _parent = $branchData.parent;
            if(_parent == _self._branchName){
                _childrenNodesArr.push($branch);
            }
        }
        return _childrenNodesArr;
    }

    onBranchNodeEvent($evt){
        let _self = this;
        _self._event.dispatch('branchNodeEvent', $evt);
    }

    async propagate(){
        let _self = this;
        if(!_self._isRoot){
            let _isMergeSuccess = await _self.mergeSchedule();
            if(_isMergeSuccess){
                for (const $childNode of _self._childrenNodes) {
                    await $childNode.propagate();
                }
            }else{
                console.log(`[BranchNode] Since merge fail from ${_self._parentNode.getBranchName} to ${_self._branchName}, stop downward propagate.`);
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
            console.log("DEBUG: [BranchNode] merge success!");

            _self.updateMergeStatus('SUCCESS');
            _self._event.dispatch('branchNodeEvent', {
                eventType: 'mergeSuccess',
                from: _parentBranchName,
                to: _destinationBranchName
            });
            console.log("DEBUG: [BranchNode] dispatched success event!");
        }else{
            _self.updateMergeStatus('FAIL');
            // Send TG to who is incharge for this branch
            // let _message = MessageBuilderUtil.getMergeConflictMsg(_sourceBranchName, _destinationBranchName),
            //     _tgIdTo214 = '1433671879';
            // await _self._cmsService.sendMessage(_tgIdTo214, _message);
            // TODO: dispatch merge failed to upstream instead of sending message here
            _self._event.dispatch('branchNodeEvent', {
                eventType: 'mergeFail'
            })
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