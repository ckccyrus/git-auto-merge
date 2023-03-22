const appRoot = require('app-root-path');
const fs = require('fs');
require('dotenv').config({ path: `${appRoot}/.env` });
const Messenger = require(`${appRoot}/src/utils/messenger`);
const BranchTree = require(`${appRoot}/src/components/branchTree`);
const BranchModel = require(`${appRoot}/src/models/branch`);
const TelegramModel = require(`${appRoot}/src/models/telegram`);
const WorkspaceManager = require(`${appRoot}/src/managers/workspaceManager`);
const CmsService = require(`${appRoot}/src/services/cms`);
const MessageBuilderUtil = require(`${appRoot}/src/utils/messageBuilder`);
const MergeRecordModel = require(`${appRoot}/src/models/mergeRecord`);
const PreviewRecordModel = require(`${appRoot}/src/models/previewRecord`);

class AutoMergeController {
    _branchTree;
    _branchModel;
    _telegramModel;
    _cmsService;
    _mergeRecordModel;
    _previewRecordModel;

    constructor() { }

    async init() {
        let _self = this;
        _self.initCmsService();
        await _self.initBranchModel();
        await _self.initTelegramModel();
        _self.initBranchTree();
        await _self.initWorkspaceManager();
        _self.initMergeRecordModel();
        _self.initPreviewRecordModel();
    }

    initCmsService() {
        Messenger.openClose('CMS SERVICE CREATE');
        let _self = this;
        _self._cmsService = new CmsService();
        Messenger.openClose('/CMS SERVICE CREATE');
    }

    async initBranchModel() {
        let _self = this;
        _self._branchModel = new BranchModel();
        let _branchTable = await _self._cmsService.getBranchTable();
        _self._branchModel.setBranchTable(_branchTable);
    }

    async initTelegramModel() {
        let _self = this;
        _self._telegramModel = new TelegramModel();
        let _telegramModel = await _self._cmsService.getTelegramTable();
        _self._telegramModel.setTelegramTable(_telegramModel);
    }

    initMergeRecordModel() {
        let _self = this;
        _self._mergeRecordModel = new MergeRecordModel();
    }

    initPreviewRecordModel() {
        let _self = this;
        _self._previewRecordModel = new PreviewRecordModel();
    }

    initBranchTree() {
        Messenger.openClose('TREE CREATION');
        let _self = this,
            _branchTable = _self._branchModel.getBranchTable(),
            _rootBranch = _self._branchModel.getRootBranch();
        _self._branchTree = new BranchTree(_branchTable, _rootBranch);
        _self._branchTree._event.on('branchTreeEvent', _self.onBranchTreeEvent, this);
        Messenger.openClose('/TREE CREATION');
    }

    async initWorkspaceManager() {
        Messenger.openClose('WORKSPACE INIT PRIMARY WORKSPACE');
        try {
            await WorkspaceManager.getInstance().initPrimaryWorkspace();
        } catch ($err) {
            console.log("ERROR: initWorkspaceManager error: ", $err);
            throw Error($err);
        }
        Messenger.openClose('/WORKSPACE INIT PRIMARY WORKSPACE');
    }

    async onBranchTreeEvent($evt) {
        let _self = this,
            _eventType = $evt.eventType;
        switch (_eventType) {
            case ('mergeSuccess'): await _self.mergeSuccessHandler($evt); break;
            case ('mergeFail'): await _self.mergeFailHandler($evt); break;
            case ('updatePreview'): await _self.updatePreviewHandler($evt); break;
        }
    }

    async mergeSuccessHandler($evt) {
        let _self = this;
        _self._mergeRecordModel.addMergeSuccessRecordForThisTime($evt);
        await _self.sendMergeSuccess($evt);
    }

    async mergeFailHandler($evt) {
        let _self = this;
        _self._mergeRecordModel.addMergeFailRecordForThisTime($evt);
        await _self.sendMergeFail($evt);
    }

    async updatePreviewHandler($evt) {
        let _self = this;
        _self._previewRecordModel.addPreviewRecordForThisTime($evt);
    }

    appendInChargeDetail($errorStack) {
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

    async clearOldPreviewRecords(){
        Messenger.openClose('CLEAR OLD PREVIEW RECORD');
        console.log("Existence of .previewRecords: ", fs.existsSync("../../.previewRecords"));

        if(fs.existsSync("../../.previewRecords")){
            fs.unlinkSync("../../.previewRecords");
        }
        Messenger.openClose('/CLEAR OLD PREVIEW RECORD');
    }

    async startMerge() {
        let _self = this;
        Messenger.openClose('TREE PROPAGATE');
        _self.sendMergeStart();
        await _self._branchTree.propagate();
        Messenger.openClose('/TREE PROPAGATE');
    }

    async handleMergeMessage() {
        let _self = this,
            _allMergeErrors = await _self._cmsService.getAllMergeFailRecords(),
            _allFrontendTG = _self._telegramModel.getAllFrontendTG(),
            _mergeErrorMsg = MessageBuilderUtil.getMergeFailMsg(_allMergeErrors, _allFrontendTG),
            _frontendGroupTG = _self._telegramModel.getFrontendGroupTG(),
            _hasMergeError = _allMergeErrors.length > 0;

        if (_hasMergeError) {
            await _self._cmsService.sendMergeErrorMessage(_frontendGroupTG, _mergeErrorMsg);
        } else {
            await _self._cmsService.clearMergeErrorMessage(_frontendGroupTG);
        }
    }

    async sendMergeSuccess($evt) {
        let _self = this;
        await _self._cmsService.sendMergeSuccess($evt);
    }

    async sendMergeFail($evt) {
        let _self = this;
        await _self._cmsService.sendMergeFail($evt);
    }

    async sendMergeStart() {
        let _self = this,
            _rootBranch = _self._branchModel.getRootBranch();
        await _self._cmsService.sendMergeStart(_rootBranch);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async postMergeAction() {
        Messenger.openClose('POST MERGE ACTION');
        let _self = this;
        await _self.handleMergeMessage();
        let _mergeSuccessRecordsForThisTime = _self._mergeRecordModel.getMergeSuccessRecordsForThisTime(),
            _mergeFailRecordsForThisTime = _self._mergeRecordModel.getMergeFailRecordsForThisTime();

        console.log('Success (Only for this time):', _mergeSuccessRecordsForThisTime);
        console.log('Fail: (Only for this time):', _mergeFailRecordsForThisTime);
        Messenger.openClose('/POST MERGE ACTION');
    }

    exportPreviewRecords(){
        let _self = this,
            _previewRecordsForThisTime = _self._previewRecordModel.getPreviewRecordsForThisTime();

        fs.writeFileSync("../../.previewRecords", JSON.stringify(_previewRecordsForThisTime), 'utf8', function (err) {
            if (err) { console.log(err); }
        });
    }
}


module.exports = AutoMergeController;