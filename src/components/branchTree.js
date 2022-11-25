const appRoot = require('app-root-path');
const Event = require(`${appRoot}/src/modules/event`);
const BranchNode = require(`${appRoot}/src/components/branchNode`);

class BranchTree {
    _event;
    _treeRootName;
    _treeRootNode;
    _branchTable;

    constructor($branchTable, $rootBranch){
        let _self = this;
        _self._event = new Event();
        _self._branchTable = $branchTable;
        _self._treeRootName = $rootBranch;
        _self.initTreeRootNode();
        _self.addListenerToRootNode();
    }

    initTreeRootNode(){
        let _self = this,
            _treeRootName = _self._treeRootName,
            _branchTable = _self._branchTable,
            _parentNode = null;
        if(!_treeRootName) throw('[BranchTree] _treeRootName is undefined!')
        _self._treeRootNode = new BranchNode(_treeRootName, _parentNode, _branchTable);
    }

    addListenerToRootNode(){
        let _self = this;
        _self._treeRootNode._event.on('branchNodeEvent', _self.onRootNodeEvent, _self)
    }

    async onRootNodeEvent($evt){
        let _self = this;
        await _self._event.dispatch('branchTreeEvent', $evt);
    }

    async propagate(){
        let _self = this;
        await _self._treeRootNode.propagate();
    }
}

module.exports = BranchTree;