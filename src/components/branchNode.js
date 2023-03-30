const appRoot = require('app-root-path');
const CmsService = require(`${appRoot}/src/services/cms`);
const MessageBuilderUtil = require(`${appRoot}/src/utils/messageBuilder`);
const Event = require(`${appRoot}/src/tools/event`);
const WorkspaceManager = require(`${appRoot}/src/managers/workspaceManager`);

class BranchNode {
    _cmsService;
    _event;
    _isRoot;
    _inCharge;
    _branchData;
    _branchName;
    _parentNode;
    _status;
    _workspaceManager;
    _childrenNodes;
    _childrenDataArr;
    _branchTable; // TODO: should move to better position
    _childNodeReadyCount;

    constructor($branchName, $branchTable, $isRoot){
        let _self = this;
        _self._event = new Event();
        _self._workspaceManager = WorkspaceManager.getInstance();
        _self._branchName = $branchName;
        _self._branchTable = $branchTable;
        _self._childrenNodes = [];
        _self._childrenDataArr = _self.getAllChildrenDataArr();
        _self.createAllChildrenNodes();
        _self.listenAllChildrenNodes();
        _self._isRoot = $isRoot;
        _self._cmsService = new CmsService();
        _self._branchData = _self.getBranchDataByName(_self._branchName);
        _self._isValidNode = _self._branchData != null;
        _self._inCharge = _self._isValidNode && JSON.parse(_self._branchData['mInCharge']) || null;
        _self._parentNode = _self._isValidNode && _self._branchData['mParentBranch'] || null;
        _self._status = _self._isValidNode && _self._branchData['mStatus'] || null;
        _self.printBranchNodeCreatedMessage();

    }

    printBranchNodeCreatedMessage(){
        let _self = this,
            _childrenNameArr = _self._childrenDataArr.map($childData => $childData['mBranchName']);
        console.log(`[BranchNode] BranchNode [${_self._branchName}] is created, its children are: [${_childrenNameArr}], it is in charged by ${_self._inCharge}`)
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
            _isNotRoot = false;
        _self._childrenDataArr.forEach($childData => {
            let _childName = $childData['mBranchName'];
            _self._childrenNodes.push(new BranchNode(_childName, _self._branchTable, _isNotRoot));
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
        let _self = this,
            _needMerge = _self.checkIfNeedMerge(),
            _needMergeAndFailed;

        console.log(`[BranchNode] Branch ${this._branchName} need merge: ${_needMerge}`);

        if(_needMerge){
            let _isMergeSuccess = await _self.mergeSchedule();
            _needMergeAndFailed = _isMergeSuccess == false;
        } else {
            await _self.getRootPreviewData(_self._branchName);
        }

        if(_needMergeAndFailed){
            console.log(`[BranchNode] Since merge fail from ${_self._parentNode} to ${_self._branchName}, stop downward propagate.`);
            return
        }

        for (const $childNode of _self._childrenNodes) {
            await $childNode.propagate();
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

    checkIfNeedMerge(){
        console.log(`[BranchNode] checking ${this._branchName} need merge of not`);
        console.log(`\t isRoot: ${this._isRoot}`);
        console.log(`\t parentNode: ${this._parentNode}`);
        console.log(`\t isParetValid: ${!!this._parentNode}`);
        console.log(`\t isFail: ${this._status == 'fail'}`);
        let _self = this,
            _isParetValid = !!_self._parentNode,
            _isFail = _self._status == 'fail';
        if(!_self._isRoot) return true;
        if(_self._isRoot && _isParetValid && _isFail) return true
        return false;
    }

    async getRootPreviewData($rootBranch){
        let _self = this,
            _rootResultObj,
            _workspaceManager = _self._workspaceManager,
            _workspace = await _workspaceManager.getIdleWorkspace();

        _rootResultObj = await _workspace.getRootPreviewData($rootBranch);
        _workspaceManager.releaseWorkspace(_workspace);
console.log("[getRootPreviewData] _rootResultObj:", _rootResultObj);
        await _self.dispatchUpdateRootPreviewEvent($rootBranch, _rootResultObj);
    }

    async mergeSchedule(){ // need parent and child branch name to merge
        let _self = this,
            _mergeResult,
            _mergeResultObj,
            _isMergeSuccess = false,
            _curBranchName = _self._branchName,
            _parentBranchName = _self._parentNode,
            _sourceBranchName = _parentBranchName,
            _destinationBranchName = _curBranchName,
            _workspaceManager = _self._workspaceManager,
            _workspace = await _workspaceManager.getIdleWorkspace();

        _mergeResultObj = await _workspace.merge(_sourceBranchName, _destinationBranchName);
        _isMergeSuccess = _mergeResultObj.success;

        _workspaceManager.releaseWorkspace(_workspace);

        if(_isMergeSuccess) {
            await _self.dispatchMergeSuccessEvent(_parentBranchName, _destinationBranchName, _mergeResultObj);
            await _self.dispatchUpdatePreviewEvent(_parentBranchName, _destinationBranchName, _mergeResultObj);
        }else{
            await _self.dispatchMergeFailEvent(_parentBranchName, _destinationBranchName, _mergeResultObj);
        }

        return _isMergeSuccess;
    }

    async dispatchMergeFailEvent($parentBranch, $destinationBranch, $resultObj){
        let _self = this
        await _self._event.dispatch('branchNodeEvent', {
            eventType: 'mergeFail',
            from: $parentBranch,
            to: $destinationBranch,
            result: $resultObj.result,
            fromCommitMsg: $resultObj.sourceBranchCommitMsg
        })
    }

    async dispatchMergeSuccessEvent($parentBranch, $destinationBranch, $resultObj){
        let _self = this;
        await _self._event.dispatch('branchNodeEvent', {
            eventType: 'mergeSuccess',
            from: $parentBranch,
            to: $destinationBranch,
            result: $resultObj.result
        });
    }

    async dispatchUpdatePreviewEvent($parentBranch, $destinationBranch, $resultObj){
        let _self = this;
        await _self._event.dispatch('branchNodeEvent', {
            eventType: 'updatePreview',
            to: $destinationBranch,
            result: $resultObj,
        });
    }

    async dispatchUpdateRootPreviewEvent($rootBranch, $resultObj){
        let _self = this;
        await _self._event.dispatch('branchNodeEvent', {
            eventType: 'updatePreview',
            to: $rootBranch,
            result: $resultObj,
        });
    }

    // getter and setter

    get getBranchName(){
        let _self = this;
        return _self._branchName;
    }
}

module.exports = BranchNode;