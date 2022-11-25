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
    _childrenDataArr;
    _branchTable; // TODO: should move to better position
    _childNodeReadyCount;

    constructor($branchName, $parentNode, $branchTable){
        let _self = this;
        _self._event = new Event();
        _self._workspaceManager = WorkspaceManager.getInstance();
        _self._branchName = $branchName;
        _self._parentNode = $parentNode;
        _self._branchTable = $branchTable;
        _self._childrenNodes = [];
        _self._childrenDataArr = _self.getAllChildrenDataArr();
        _self._mergeStatus = 'PENDING';
        _self.createAllChildrenNodes();
        _self.listenAllChildrenNodes();
        _self._isRoot = ($parentNode == null) ? true : false;
        _self._cmsService = new CmsService();
        _self._branchData = _self.getBranchDataByName(_self._branchName);
        _self._inCharge = JSON.parse(_self._branchData['mInCharge']);
        _self.printBranchNodeCreatedMessage();

    }

    printBranchNodeCreatedMessage(){
        let _self = this,
            _childrenNameArr = _self._childrenDataArr.map($childData => $childData['mBranchName']);
        console.log(`[BranchNode] BrachNode [${_self._branchName}] is created, its children are: [${_childrenNameArr}], it is in charged by ${_self._inCharge}`)
    }

    getBranchDataByName($brancName){
        let _self = this;
        for (let $i = 0; $i < _self._branchTable.length; $i++) {
            const _branch = _self._branchTable[$i];
            if(_branch['mBranchName'] === $brancName) return _branch;
        }
        return null;
    }

    // methods 
    createAllChildrenNodes(){
        let _self = this,
            _parentNode = this;
        _self._childrenDataArr.forEach($childData => {
            let _childName = $childData['mBranchName'];
            _self._childrenNodes.push(new BranchNode(_childName, _parentNode, _self._branchTable));
        })
    }

    listenAllChildrenNodes(){
        let _self = this;
        _self._childrenNodes.forEach($childNode => {
            $childNode._event.on('branchNodeEvent', _self.onBranchNodeEvent, _self);
        })
    }

    getAllChildrenDataArr(){
        let _self = this,
            _childrenDataArr = [];
        for (let $i = 0; $i < _self._branchTable.length; $i++) {
            const _branch = _self._branchTable[$i];
            if(_branch['mParentBranch'] === _self._branchName) _childrenDataArr.push(_branch);
        }
        return _childrenDataArr;
    }

    async onBranchNodeEvent($evt){
        let _self = this;
        await _self._event.dispatch('branchNodeEvent', $evt);
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
            _mergeResult,
            _mergeResultObj,
            _isMergeSuccess = false,
            _curBranchName = _self._branchName,
            _parentBranchName = _self._isRoot ? '' : _self._parentNode.getBranchName,
            _sourceBranchName = _parentBranchName,
            _destinationBranchName = _curBranchName,
            _workspaceManager = _self._workspaceManager,
            _workspace = await _workspaceManager.getIdleWorkspace();

        _mergeResultObj = await _workspace.merge(_sourceBranchName, _destinationBranchName);
        _isMergeSuccess = _mergeResultObj.success;
        _mergeResult = _mergeResultObj.result;

        _workspaceManager.releaseWorkspace(_workspace);

        if(_isMergeSuccess) {
            _self.updateMergeStatus('SUCCESS');
            await _self.dispatchMergeSuccessEvent(_parentBranchName, _destinationBranchName, _mergeResult);
        }else{
            _self.updateMergeStatus('FAIL');
            await _self.dispatchMergeFailEvent(_parentBranchName, _destinationBranchName, _mergeResult);
        }

        return _isMergeSuccess;
    }

    async dispatchMergeFailEvent($parentBranch, $destinationBranch, $result){
        let _self = this;
        await _self._event.dispatch('branchNodeEvent', {
            eventType: 'mergeFail',
            from: $parentBranch,
            to: $destinationBranch,
            result: $result
        })
    }

    async dispatchMergeSuccessEvent($parentBranch, $destinationBranch, $result){
        let _self = this;
        await _self._event.dispatch('branchNodeEvent', {
            eventType: 'mergeSuccess',
            from: $parentBranch,
            to: $destinationBranch,
            result: $result
        });
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