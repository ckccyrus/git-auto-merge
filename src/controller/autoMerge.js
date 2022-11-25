const appRoot = require('app-root-path');
const MergeFail = require('../models/mergeFail');
require('dotenv').config({ path: `${appRoot}/.env` });
const Messenger = require(`${appRoot}/src/utils/messenger`);
const BranchTree = require(`${appRoot}/src/components/branchTree`);
const BranchModel = require(`${appRoot}/src/models/branch`);
const TelegramModel = require(`${appRoot}/src/models/telegram`);
const WorkspaceManager = require(`${appRoot}/src/managers/workspaceManager`);
const CmsService = require(`${appRoot}/src/services/cms`);
const MessageBuilderUtil = require(`${appRoot}/src/utils/messageBuilder`);
const MergeFailModel = require(`${appRoot}/src/models/mergeFail`);

class AutoMergeController{
    _branchTree;
    _branchModel;
    _telegramModel;
    _cmsService;
    _mergeFailModel;

    constructor(){}

    async init(){
        let _self = this;
        _self.initCmsService();
        await _self.initBranchModel();
        await _self.initTelegramModel();
        _self.initBranchTree();
        await _self.initWorkspaceManager();
        _self.initMergeFailModel();
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

    initMergeFailModel(){
        let _self = this;
        _self._mergeFailModel = new MergeFailModel();
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
        console.log("DEBUG: [AutoMerge_C] [TODO] mergeSuccessHandler called");

        // let _self = this,
        //     _fromBranch = $evt.from,
        //     _toBranch = $evt.to,
        //     _failedMsg = MessageBuilderUtil.getMergeConflictMsg(_fromBranch, _toBranch),
        //     _inChargeStaffCodeArr = _self._branchModel.getBranchInCharge(_toBranch),
        //     _inChargeStaffChatIdArr = _self._telegramModel.getChatIdByStaffCodeArr(_inChargeStaffCodeArr),
        //     _frontendGroupTG = _self._telegramModel.getFrontendGroupTG(),
        //     _fullMsg = appendMentionToMsg();

        // console.log("DEBUG: _inChargeStaffChatIdArr: ", _inChargeStaffChatIdArr, _frontendGroupTG);

        // await _self._cmsService.sendMessage(_frontendGroupTG, _fullMsg);

        // function appendMentionToMsg(){
        //     let _msg = _failedMsg;
        //     for (let $i = 0; $i < _inChargeStaffChatIdArr.length; $i++) {
        //         const _chatId = _inChargeStaffChatIdArr[$i],
        //               _chatKey = _inChargeStaffCodeArr[$i];
        //         // _msg = _msg + `[inline mention of a user](tg://user?id=${_chatId}) `;
        //         _msg = _msg + `\n<a href="tg://user?id=${_chatId}">@${_chatKey}</a>`;
        //     }
        //     return _msg;
        // }

        let _self = this;
        _self._mergeFailModel.addMergeFailRecord($evt);
    }
    
    async mergeFailHandler($evt){
        console.log("DEBUG: [AutoMerge_C] [TODO] mergeFailHandler called");

        // let _self = this,
        //     _fromBranch = $evt.from,
        //     _toBranch = $evt.to,
        //     _failedMsg = MessageBuilderUtil.getMergeConflictMsg(_fromBranch, _toBranch),
        //     _inChargeStaffCodeArr = _self._branchModel.getBranchInCharge(_toBranch),
        //     _inChargeStaffChatIdArr = _self._telegramModel.getChatIdByStaffCodeArr(_inChargeStaffCodeArr),
        //     _frontendGroupTG = _self._telegramModel.getFrontendGroupTG();

        // console.log("DEBUG: _inChargeStaffChatIdArr: ", _inChargeStaffChatIdArr);
    }

    async sendMergeErrorMessage(){
        let _self = this,
            _mergeErrorStack = JSON.parse(JSON.stringify(_self._mergeFailModel.getMergeFailStack())),
            _mergeErrorStackWithInChargeDetail = _self.appendInChargeDetail(_mergeErrorStack),
            _mergeErrorMsg = MessageBuilderUtil.getMergeFailMsg(_mergeErrorStackWithInChargeDetail),
            _frontendGroupTG = _self._telegramModel.getFrontendGroupTG();

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
        Messenger.openClose('/POST MERGE ACTION');
    }
}


module.exports = AutoMergeController;