const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });
const Messenger = require(`${appRoot}/src/utils/messenger`);
const BranchTree = require(`${appRoot}/src/components/branchTree`);
const BranchModel = require(`${appRoot}/src/models/branch`);
const TelegramModel = require(`${appRoot}/src/models/telegram`);
const WorkspaceManager = require(`${appRoot}/src/managers/workspaceManager`);
const CmsService = require(`${appRoot}/src/services/cms`)

class AutoMergeController{
    _branchTree;
    _branchModel;
    _telegramModel;
    _cmsService;

    constructor(){}

    async init(){
        let _self = this;
        _self.initCmsService();
        await _self.initBranchModel();
        await _self.initTelegramModel();
        _self.initBranchTree();
        await _self.initWorkspaceManager();
    }

    initCmsService(){
        Messenger.openClose('CMS SERVICE CREATE');
        let _self = this;
        _self._cmsService = new CmsService();
        Messenger.openClose('/CMS SERVICE CREATE');
    }

    async initBranchModel(){
        let _self = this;
        _self._branchModel = new BranchModel();
        let _branchTable = await _self._cmsService.getBranchTable();
        _self._branchModel.setBranchTable(_branchTable);
    }

    async initTelegramModel(){
        let _self = this;
        _self._telegramModel = new TelegramModel();
        let _telegramModel = await _self._cmsService.getTelegramTable();
        _self._telegramModel.setTelegramTable(_telegramModel);
    }

    initBranchTree(){
        Messenger.openClose('TREE CREATION');
        let _self = this,
            _branchTable = _self._branchModel.getBranchTable(),
            _rootBranch = _self._branchModel.getRootBranch();
        _self._branchTree = new BranchTree(_branchTable, _rootBranch);
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
        console.log("DEBUG: [AutoMerge_C] [TODO] mergeSuccessHandler called");
    }
    
    mergeFailHandler($evt){
        // TODO: Implement merge failed handler
        console.log("DEBUG: [AutoMerge_C] [TODO] mergeFailHandler called");
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