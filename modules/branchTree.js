const appRoot = require('app-root-path');
const Event = require(`${appRoot}/modules/event`);
const BranchNode = require(`${appRoot}/modules/branchNode`);

class BranchTree {
    _event;
    _treeRootName;
    _treeRootNode;
    _branchRelationship;

    constructor($branchRelationship, $rootBranch){
        let _self = this;
        _self._event = new Event();
        _self._branchRelationship = $branchRelationship;
        _self._treeRootName = $rootBranch;
        _self.initTreeRootNode();
        _self.addListenerToRootNode();
    }

    initTreeRootNode(){
        let _self = this,
            _treeRootName = _self._treeRootName,
            _branchRelationship = _self._branchRelationship,
            _parentNode = null
        if(!_treeRootName) throw('[BranchTree] _treeRootName is undefined!')
        _self._treeRootNode = new BranchNode(_treeRootName, _parentNode, _branchRelationship);
    }

    addListenerToRootNode(){
        let _self = this;
        _self._treeRootNode._event.on('rootNodeEvent', _self.onRootNodeEvent, _self)
    }

    async propagate(){
        let _self = this;
        await _self._treeRootNode.propagate();
    }
}

module.exports = BranchTree;