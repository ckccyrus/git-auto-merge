const appRoot = require('app-root-path');
const fs = require('fs');
const path = require("path");
require('dotenv').config({ path: `${appRoot}/.env` });
const Messenger = require(`${appRoot}/src/utils/messenger`);
const BranchTree = require(`${appRoot}/src/components/branchTree`);
const BranchModel = require(`${appRoot}/src/models/branch`);
const TelegramModel = require(`${appRoot}/src/models/telegram`);
const WorkspaceManager = require(`${appRoot}/src/managers/workspaceManager`);
const CmsService = require(`${appRoot}/src/services/cms`);
const StrapiService = require(`${appRoot}/src/services/strapi`);
const MessageBuilderUtil = require(`${appRoot}/src/utils/messageBuilder`);
const MergeRecordModel = require(`${appRoot}/src/models/mergeRecord`);
const PreviewRecordModel = require(`${appRoot}/src/models/previewRecord`);

class AutoMergeController {
    _branchTree;
    _branchModel;
    _telegramModel;
    _cmsService;
    _strapiService;
    _mergeRecordModel;
    _previewRecordModel;

    constructor() { }

    async init() {
        let _self = this;
        _self.initCmsService();
        _self.initStrapiService();
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

    initStrapiService() {
        Messenger.openClose('STRAPI SERVICE CREATE');
        let _self = this;
        _self._strapiService = new StrapiService();
        Messenger.openClose('/STRAPI SERVICE CREATE');
    }

    async initBranchModel() {
        let _self = this;
        _self._branchModel = new BranchModel();
        let _branchTable = await _self._cmsService.getBranchTable();
        _self._branchModel.setBranchTable(_branchTable);

        //strapi API
        // const _strapiBranchTable = await _self._strapiService.getBranchTable();
        // console.log('DEBUG STRAPI: [getBranchTable] _strapiBranchTable', _strapiBranchTable);
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
        // await _self.sendUpdatePreviewCommit($evt);
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
        let _self = this,
            _recordPath = path.join(`${appRoot}`, '.previewRecords');
        Messenger.openClose('CLEAR OLD PREVIEW RECORD');
console.log(_recordPath);
console.log("Existence of .previewRecords: ", fs.existsSync(_recordPath));
        if(fs.existsSync(_recordPath)){
            fs.unlinkSync(_recordPath);
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

        //strapi API
        // const _strapiAllMergeErrors = await _self._strapiService.getAllMergeFailRecords();
        // console.log('DEBUG STRAPI: [handleMergeMessage] _strapiAllMergeErrors', _strapiAllMergeErrors);

        if (_hasMergeError) {
            await _self._cmsService.sendMergeErrorMessage(_frontendGroupTG, _mergeErrorMsg);
        } else {
            await _self._cmsService.clearMergeErrorMessage(_frontendGroupTG);
        }
    }

    async sendMergeSuccess($evt) {
        let _self = this;
        await _self._cmsService.sendMergeSuccess($evt);

        //strapi API
        // const _strapiMergeSuccess = await _self._strapiService.sendMergeSuccess($evt);
        // console.log('DEBUG STRAPI: [sendMergeSuccess] _strapiMergeSuccess', _strapiMergeSuccess);
    }

    async sendMergeFail($evt) {
        let _self = this;
        await _self._cmsService.sendMergeFail($evt);

        //strapi API
        // const _strapiMergeFail = await _self._strapiService.sendMergeFail($evt)
        // console.log('DEBUG STRAPI: [sendMergeFail] _strapiMergeFail', _strapiMergeFail);
    }

    async sendMergeStart() {
        let _self = this,
            _rootBranch = _self._branchModel.getRootBranch();
        await _self._cmsService.sendMergeStart(_rootBranch);

        //strapi API
        // const _strapiMergeStart = await _self._strapiService.sendMergeStart(_rootBranch);
        // console.log('DEBUG STRAPI: [sendMergeStart] _strapiMergeStart', _strapiMergeStart);
    }

    async sendUpdatePreviewCommit($evt) { //only available in strapi
        // const _self = this;
        // await _self._strapiService.sendUpdatePreviewCommit($evt);
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
            _previewRecordsForThisTime = _self._previewRecordModel.getPreviewRecordsForThisTime(),
            _recordPath = path.join(`${appRoot}`, '.previewRecords');

        console.log('Preview Record (Only for this time):', _previewRecordsForThisTime);
        console.log('_recordPath', _recordPath);
        
        fs.writeFileSync(_recordPath, JSON.stringify(_previewRecordsForThisTime), 'utf8', function (err) {
            if (err) { console.log(err); }
        });
    }
}


module.exports = AutoMergeController;