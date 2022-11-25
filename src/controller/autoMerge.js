const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });
const Messenger = require(`${appRoot}/src/utils/messenger`);
const BranchTree = require(`${appRoot}/src/components/branchTree`);
const BranchModel = require(`${appRoot}/src/models/branch`);
const TelegramModel = require(`${appRoot}/src/models/telegram`);
const WorkspaceManager = require(`${appRoot}/src/managers/workspaceManager`);
const CmsService = require(`${appRoot}/src/services/cms`);
const MessageBuilderUtil = require(`${appRoot}/src/utils/messageBuilder`);
const MergeRecordModel = require(`${appRoot}/src/models/mergeRecord`);

class AutoMergeController{
    _branchTree;
    _branchModel;
    _telegramModel;
    _cmsService;
    _mergeRecordModel;

    constructor(){}

    async init(){
        let _self = this;
        _self.initCmsService();
        await _self.initBranchModel();
        await _self.initTelegramModel();
        _self.initBranchTree();
        await _self.initWorkspaceManager();
        _self.initMergeRecordModel();
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

    initMergeRecordModel(){
        let _self = this;
        _self._mergeRecordModel = new MergeRecordModel();
    }

    initBranchTree(){
        Messenger.openClose('TREE CREATION');
        let _self = this,
            _branchTable = _self._branchModel.getBranchTable(),
            _rootBranch = _self._branchModel.getRootBranch();
        _self._branchTree = new BranchTree(_branchTable, _rootBranch);
        _self._branchTree._event.on('branchTreeEvent', _self.onBranchTreeEvent, this); // TODO: problem, how to handle event that is async?
        Messenger.openClose('/TREE CREATION');
    }

    async initWorkspaceManager(){
        Messenger.openClose('WORKSPACE INIT PRIMARY WORKSPACE');
        await WorkspaceManager.getInstance().initPrimaryWorkspace();
        Messenger.openClose('/WORKSPACE INIT PRIMARY WORKSPACE');
    }

    async onBranchTreeEvent($evt){
        let _self = this,
            _eventType = $evt.eventType;
        switch(_eventType){
            case('mergeSuccess'): await _self.mergeSuccessHandler($evt); break;
            case('mergeFail'): await _self.mergeFailHandler($evt); break;
        }
    }

    async mergeSuccessHandler($evt){
        let _self = this;
        _self._mergeRecordModel.addMergeSuccessRecord($evt);
    }
    
    async mergeFailHandler($evt){
        let _self = this;
        _self._mergeRecordModel.addMergeFailRecord($evt);
    }

    async sendMergeErrorMessage(){
        let _self = this,
            _mergeErrorRecords = JSON.parse(JSON.stringify(_self._mergeRecordModel.getMergeFailRecords())),
            _mergeErrorRecordsWithInChargeDetail = _self.appendInChargeDetail(_mergeErrorRecords),
            _mergeErrorMsg = MessageBuilderUtil.getMergeFailMsg(_mergeErrorRecordsWithInChargeDetail),
            _frontendGroupTG = _self._telegramModel.getFrontendGroupTG();

        if(_mergeErrorRecords.length <= 0) return;
        await _self._cmsService.sendMessage(_frontendGroupTG, _mergeErrorMsg);
    }

    appendInChargeDetail($errorStack){
        let _self = this,
            _errorStack = JSON.parse(JSON.stringify($errorStack));
        for (let $i = 0; $i < _errorStack.length; $i++) {
            let _errorObj = _errorStack[$i],
                _toBranch = _errorObj.to,
                _inChargeStaffCodeArr = _self._branchModel.getBranchInCharge(_toBranch),
                _inChargeStaffChatIdArr = _self._telegramModel.getChatIdByStaffCodeArr(_inChargeStaffCodeArr);
            _errorObj['inCharge'] = _inChargeStaffCodeArr;
            _errorObj['inChargeId'] = _inChargeStaffChatIdArr;
        }
        return _errorStack;
    }

    async startMerge(){
        let _self = this;
        Messenger.openClose('TREE PROPAGATE');
        // TODO: update cms branch table to all pending, last trigger time
        await _self._branchTree.propagate();
        Messenger.openClose('/TREE PROPAGATE');
    }

    async postMergeAction(){
        Messenger.openClose('POST MERGE ACTION');
        let _self = this;
        await _self.sendMergeErrorMessage();
        let _mergeSuccessRecords = _self._mergeRecordModel.getMergeSuccessRecords(),
            _mergeFailRecords = _self._mergeRecordModel.getMergeFailRecords();
        
        console.log('Success:', _mergeSuccessRecords);
        console.log('Fail:', _mergeFailRecords);
        Messenger.openClose('/POST MERGE ACTION');
    }
}


module.exports = AutoMergeController;