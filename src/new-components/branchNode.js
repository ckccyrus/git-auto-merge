const appRoot = require('app-root-path');
const Event = require(`${appRoot}/src/tools/event`);
const Messenger = require(`${appRoot}/src/utils/messenger`);

const WorkspaceManager = require(`${appRoot}/src/managers/workspaceManager`);

class BranchNode {
    _event;
    _workspaceManager;
    _branchName;
    _branchTable; // TODO: should move to better position
    _isRoot;
    _branchData;
    _isValidNode;
    _inCharge;
    _parentNode;
    _status;

    _childrenNodes;
    _childrenDataArr;

    constructor($branchName, $branchTable, $isRoot) {
        const _self = this;
        _self.setDep();
        _self.init($branchName, $branchTable, $isRoot);
        _self.setChild();
        _self.createAllChildrenNodes();
        _self.listenAllChildrenNodes();
        _self.printBranchNodeCreatedMessage();
    }

    //---------------------------------------------------------------
    //------------------------------Init---------------------------------

    setDep() {
        const _self = this;
        _self._event = new Event();
        _self._workspaceManager = WorkspaceManager.getInstance();
    }

    init($branchName, $branchTable, $isRoot) {
        const _self = this;
        _self._branchName = $branchName;
        _self._branchTable = $branchTable;
        _self._isRoot = $isRoot;
        _self._branchData = _self.getBranchDataByName(_self._branchName);
        _self._isValidNode = _self._branchData != null;
        _self._inCharge = _self._isValidNode && JSON.parse(_self._branchData['InCharge']) || null;
        _self._parentNode = _self._isValidNode && _self._branchData['Parent'] || null;
        _self._status = _self._isValidNode && _self._branchData['State'] || null;
    }

    getBranchDataByName($branchName) {
        const _self = this;
        for (const _branch of _self._branchTable) {
            if (_branch['Name'] === $branchName) return _branch;
        }
        return null;
    }

    setChild() {
        const _self = this;
        _self._childrenNodes = [];
        _self._childrenDataArr = getAllChildrenDataArr();

        function getAllChildrenDataArr() {
            const _childrenDataArr = [];
            for (const _branch of _self._branchTable) {
                if (_branch['Parent'] === _self._branchName) _childrenDataArr.push(_branch);
            }
            return _childrenDataArr;
        }
    }

    createAllChildrenNodes() {
        const _self = this;
        const _isNotRoot = false;
        for (const _child of _self._childrenDataArr) {
            _self._childrenNodes.push(new BranchNode(_child['Name'], _self._branchTable, _isNotRoot));
        }
    }

    listenAllChildrenNodes() {
        const _self = this;
        _self._childrenNodes.forEach($childNode => {
            $childNode._event.on('branchNodeEvent', _self.onBranchNodeEvent, _self);
        })
    }

    onBranchNodeEvent($evt) {
        const _self = this;
        _self._event.dispatch('branchNodeEvent', $evt);
    }

    printBranchNodeCreatedMessage() {
        const _self = this;
        const _childrenNameArr = _self._childrenDataArr.map($childData => $childData['Name']);
        Messenger.log(`[BranchNode] BranchNode [${_self._branchName}] is created, its children are: [${_childrenNameArr}], it is in charged by ${_self._inCharge}`)
    }


    //---------------------------------------------------------------
    //------------------------------Propogate---------------------------------
    async propagate() {
        const _self = this;
        const _needMerge = checkIfNeedMerge();
        let _needMergeAndFailed;

        Messenger.log(`[BranchNode] Branch ${_self._branchName} need merge: ${_needMerge}`);

        if (_needMerge) {
            const _isMergeSuccess = await _self.mergeSchedule();
            _needMergeAndFailed = (_isMergeSuccess == false);
        } else {
            await _self.getBranchPreviewData(_self._branchName);
        }

        if (_needMergeAndFailed) {
            Messenger.log(`[BranchNode] Since merge fail from ${_self._parentNode} to ${_self._branchName}, stop downward propagate.`);
            return
        }

        for (const _childNode of _self._childrenNodes) {
            await _childNode.propagate();
        }

        // Propagate in parallel
        // await Promise.all(_self._childrenNodes.map(async $childNode => {
        //     await $childNode.propagate();
        // }));

        // Propagate in sequence
        // for (const $childNode of _self._childrenNodes) {
        //     await $childNode.propagate();
        // }

        function checkIfNeedMerge() {
            Messenger.log(`[BranchNode] checking ${_self._branchName} need merge or not`);
            Messenger.log(`\t isRoot: ${_self._isRoot}`);
            Messenger.log(`\t parentNode: ${_self._parentNode}`);
            Messenger.log(`\t isParetValid: ${!!_self._parentNode}`);
            Messenger.log(`\t isFail: ${_self._status == 'fail'}`);

            const _isParetValid = !!_self._parentNode;
            const _isFail = _self._status == 'fail';
            if (!_self._isRoot) return true;
            if (_self._isRoot && _isParetValid && _isFail) return true
            return false;  //only the root doesnt have parent or a success root
        }
    }

    async mergeSchedule() { // need parent and child branch name to merge
        const _self = this;
        const _parentBranchName = _self._parentNode;
        const _targetBranchName = _self._branchName;
        const _workspaceManager = _self._workspaceManager;
        const _workspace = await _workspaceManager.getIdleWorkspace();
        const _mergeResultObj = await _workspace.merge(_parentBranchName, _targetBranchName);
        const _isMergeSuccess = _mergeResultObj.success;

        _workspaceManager.releaseWorkspace(_workspace);

        if (_isMergeSuccess) {
            await _self.dispatchMergeSuccessEvent(_parentBranchName, _targetBranchName, _mergeResultObj);
            await _self.dispatchUpdatePreviewEvent(_targetBranchName, _mergeResultObj);
        } else {
            await _self.dispatchMergeFailEvent(_parentBranchName, _targetBranchName, _mergeResultObj);
        }

        return _isMergeSuccess;
    }

    async dispatchMergeSuccessEvent($parentBranch, $targetBranch, $resultObj) {
        let _self = this;
        await _self._event.dispatch('branchNodeEvent', {
            eventType: 'mergeSuccess',
            parent: $parentBranch,
            target: $targetBranch,
            result: $resultObj
        });
    }

    async dispatchMergeFailEvent($parentBranch, $targetBranch, $resultObj) {
        let _self = this
        await _self._event.dispatch('branchNodeEvent', {
            eventType: 'mergeFail',
            parent: $parentBranch,
            target: $targetBranch,
            result: $resultObj
        })
    }

    async getBranchPreviewData($branch) {
        const _self = this;
        const _workspaceManager = _self._workspaceManager;
        const _workspace = await _workspaceManager.getIdleWorkspace();
        const _branchResultObj = await _workspace.getBranchPreviewData($branch);
        _workspaceManager.releaseWorkspace(_workspace);

        await _self.dispatchUpdatePreviewEvent($branch, _branchResultObj);
    }

    async dispatchUpdatePreviewEvent($branch, $resultObj) {
        let _self = this;
        await _self._event.dispatch('branchNodeEvent', {
            eventType: 'updatePreview',
            target: $branch,
            result: $resultObj,
        });
    }
}

module.exports = BranchNode;