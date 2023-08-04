const appRoot = require('app-root-path');
const Event = require(`${appRoot}/src/tools/event`);
const BranchNode = require(`${appRoot}/src/new-components/branchNode`);

class BranchTree {
    _event;
    _treeRootName;
    _treeRootNode;
    _branchTable;

    constructor($branchTable, $rootBranch) {
        const _self = this;
        _self._event = new Event();
        _self._branchTable = $branchTable;
        _self._treeRootName = $rootBranch;
        _self.initTreeRootNode();
        _self.addListenerToRootNode();
    }

    initTreeRootNode() {
        const _self = this;
        const _branchTable = _self._branchTable;
        const _treeRootName = _self._treeRootName;
        const _isRoot = true;
        if (!_treeRootName) throw ('[BranchTree] _treeRootName is undefined!')
        _self._treeRootNode = new BranchNode(_treeRootName, _branchTable, _isRoot);
    }

    addListenerToRootNode() {
        const _self = this;
        _self._treeRootNode._event.on('branchNodeEvent', _self.onRootNodeEvent, _self)
    }

    async onRootNodeEvent($evt) {
        const _self = this;
        await _self._event.dispatch('branchTreeEvent', $evt);
    }

    async propagate() {
        const _self = this;
        await _self._treeRootNode.propagate();
    }
}

module.exports = BranchTree;