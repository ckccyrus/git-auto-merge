const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });
const Messenger = require(`${appRoot}/src/utils/messenger`);
const BranchTree = require(`${appRoot}/src/components/branchTree`);
const BranchModel = require(`${appRoot}/src/models/branch`);
const WorkspaceManager = require(`${appRoot}/src/managers/workspaceManager`);

class AutoMergeController{
    _branchTree
    _branchModel

    constructor(){}

    async init(){
        let _self = this;
        _self.initBranchModel();
        _self.initBranchTree();
        await _self.initWorkspaceManager();
    }

    initBranchModel(){
        let _self = this;
        _self._branchModel = new BranchModel();
    }

    initBranchTree(){
        Messenger.openClose('TREE CREATION');
        let _self = this,
            _branchRelationship = _self._branchModel.getBranchRelationship(),
            _rootBranch = _self._branchModel.getRootBranch();
        _self._branchTree = new BranchTree(_branchRelationship, _rootBranch);
        _self._branchTree._event.on('branchTreeEvent', _self.onBranchTreeEvent, this);
        Messenger.openClose('/TREE CREATION');
    }

    async initWorkspaceManager(){
        Messenger.openClose('WORKSPACE INIT PRIMARY WORKSPACE');
        await WorkspaceManager.getInstance().initPrimaryWorkspace();
        Messenger.openClose('/WORKSPACE INIT PRIMARY WORKSPACE');
    }

    onBranchTreeEvent($evt){
        let _self = this,
            _eventType = $evt.eventType;
        switch(_eventType){
            case('mergeSuccess'): _self.mergeSuccessHandler($evt); break;
            case('mergeFail'): _self.mergeFailHandler($evt); break;
        }
    }

    mergeSuccessHandler($evt){
        // TODO: Implement merge success handler
        console.log("DEBUG: [AutoMerge_C] mergeSuccessHandler", $evt);
    }
    
    mergeFailHandler($evt){
        // TODO: Implement merge failed handler
        console.log("DEBUG: [AutoMerge_C] mergeFailHandler", $evt);
    }

    async startMerge(){
        let _self = this;
        Messenger.openClose('TREE PROPAGATE');
        // TODO: update cms branch table to all pending, last trigger time
        await _self._branchTree.propagate();
        Messenger.openClose('/TREE PROPAGATE');
    }
}


module.exports = AutoMergeController;