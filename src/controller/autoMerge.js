const appRoot = require('app-root-path');
const fs = require('fs');
const path = require("path");
require('dotenv').config({ path: `${appRoot}/.env` });

const Messenger = require(`${appRoot}/src/utils/messenger`);
const MessageBuilderUtil = require(`${appRoot}/src/utils/messageBuilder`);

//services
const CmsService = require(`${appRoot}/src/services/cms`);
const StrapiService = require(`${appRoot}/src/services/strapi`);

//components
const BranchTree = require(`${appRoot}/src/components/branchTree`);
const NewBranchTree = require(`${appRoot}/src/new-components/branchTree`);

//manager
const WorkspaceManager = require(`${appRoot}/src/managers/workspaceManager`);

//old model for pimcore
const BranchModel = require(`${appRoot}/src/models/branch`);
const MergeRecordModel = require(`${appRoot}/src/models/mergeRecord`);
const PreviewRecordModel = require(`${appRoot}/src/models/previewRecord`);

const TelegramModel = require(`${appRoot}/src/models/telegram`);

//new model for strapi
const NewBranchModel = require(`${appRoot}/src/new-models/branch`);
const NewMergeRecordModel = require(`${appRoot}/src/new-models/mergeRecord`);
const NewPreviewRecordModel = require(`${appRoot}/src/new-models/previewRecord`);


class AutoMergeController {
    _branchTree;
    _newBranchTree;

    _workspaceManager;

    _cmsService;
    _strapiService;

    // _branchModel;
    _newBranchModel;

    _telegramModel;

    // _mergeRecordModel;
    _newMergeRecordModel;

    // _previewRecordModel;
    _newPreviewRecordModel;

    constructor() { }

    //---------------------------------------------------------------
    //------------------------------Init---------------------------------
    async init() {
        const _self = this;
        _self._workspaceManager = WorkspaceManager.getInstance();
        //----------------------init API service------------------------
        _self.initCmsService();
        _self.initStrapiService();
        //----------------------init models------------------------
        // await _self.initBranchModel();
        await _self.initNewBranchModel();

        await _self.initTelegramModel();

        // _self.initBranchTree();
        _self.initNewBranchTree();

        await _self.initWorkspaceManager();

        // _self.initMergeRecordModel();
        _self.initNewMergeRecordModel();

        // _self.initPreviewRecordModel();
        _self.initNewPreviewRecordModel();
    }

    //----------------------init API service------------------------
    initCmsService() {
        Messenger.openClose('CMS SERVICE CREATE');
        const _self = this;
        _self._cmsService = new CmsService();
        Messenger.openClose('/CMS SERVICE CREATE');
    }

    initStrapiService() {
        Messenger.openClose('STRAPI SERVICE CREATE');
        const _self = this;
        _self._strapiService = new StrapiService();
        Messenger.openClose('/STRAPI SERVICE CREATE');
    }

    //----------------------init branch model------------------------
    // async initBranchModel() {
    //     const _self = this;
    //     _self._branchModel = new BranchModel();
    //     let _branchTable = await _self._cmsService.getBranchTable();
    //     _self._branchModel.setBranchTable(_branchTable);
    // }

    async initNewBranchModel() {
        const _self = this;
        _self._newBranchModel = new NewBranchModel();
        const _strapiBranchTable = await _self._strapiService.getBranchTable();
        _self._newBranchModel.setBranchTable(_strapiBranchTable);
    }

    async initTelegramModel() {
        const _self = this;
        _self._telegramModel = new TelegramModel();
        const _telegramModel = await _self._cmsService.getTelegramTable();
        _self._telegramModel.setTelegramTable(_telegramModel);
        console.log('clog _self._telegramModel.getAllFrontendTG()', _self._telegramModel.getAllFrontendTG());
    }

    // initBranchTree() {
    //     Messenger.openClose('TREE CREATION');
    //     const _self = this,
    //         _branchTable = _self._branchModel.getBranchTable(),
    //         _rootBranch = _self._branchModel.getRootBranch();
    //     _self._branchTree = new BranchTree(_branchTable, _rootBranch);
    //     // _self._branchTree._event.on('branchTreeEvent', _self.onBranchTreeEvent, this);
    //     Messenger.openClose('/TREE CREATION');
    // }

    initNewBranchTree() {
        Messenger.openClose('NEW TREE CREATION');
        const _self = this;
        const _branchTable = _self._newBranchModel.getBranchTable();
        const _rootBranch = _self._newBranchModel.getRootBranch();
        _self._newBranchTree = new NewBranchTree(_branchTable, _rootBranch);
        _self._newBranchTree._event.on('branchTreeEvent', _self.onBranchTreeEvent, this);
        Messenger.openClose('/NEW TREE CREATION');
    }

    //----------------------branch tree event handler------------------------
    async onBranchTreeEvent($evt) {
        const _self = this;
        const _eventType = $evt.eventType;
        switch (_eventType) {
            case ('mergeSuccess'): await _self.mergeSuccessHandler($evt); break;
            case ('mergeFail'): await _self.mergeFailHandler($evt); break;
            case ('updatePreview'): await _self.updatePreviewHandler($evt); break;
        }
    }

    async mergeSuccessHandler($evt) {
        const _self = this;
        // _self._mergeRecordModel.addMergeSuccessRecordForThisTime($evt);
        _self._newMergeRecordModel.addMergeSuccessRecordForThisTime($evt);
        await _self.sendMergeSuccess($evt);
    }

    async mergeFailHandler($evt) {
        const _self = this;
        // _self._mergeRecordModel.addMergeFailRecordForThisTime($evt);
        _self._newMergeRecordModel.addMergeFailRecordForThisTime($evt);
        await _self.sendMergeFail($evt);
    }

    async updatePreviewHandler($evt) {
        const _self = this;
        // _self._previewRecordModel.addPreviewRecordForThisTime($evt);
        _self._newPreviewRecordModel.addPreviewRecordForThisTime($evt);
        // await _self.sendUpdatePreviewCommit($evt);
    }

    async sendMergeSuccess($evt) {
        // const _self = this;
        // await _self._cmsService.sendMergeSuccess($evt);

        //strapi API
        const _self = this;
        await _self._strapiService.sendMergeSuccess($evt);
    }

    async sendMergeFail($evt) {
        // const _self = this;
        // await _self._cmsService.sendMergeFail($evt);

        //strapi API
        const _self = this;
        await _self._strapiService.sendMergeFail($evt)
    }

    async sendUpdatePreviewCommit($evt) { //only available in strapi
        const _self = this;
        await _self._strapiService.sendUpdatePreviewCommit($evt);
    }

    async initWorkspaceManager() {
        Messenger.openClose('WORKSPACE INIT PRIMARY WORKSPACE');
        const _self = this;
        try {
            await _self._workspaceManager.removeWorkspaces();
            await _self._workspaceManager.initPrimaryWorkspace();
        } catch ($err) {
            Messenger.log("ERROR: initWorkspaceManager error: ", $err);
            throw Error($err);
        }
        Messenger.openClose('/WORKSPACE INIT PRIMARY WORKSPACE');
    }

    // initMergeRecordModel() {
    //     const _self = this;
    //     _self._mergeRecordModel = new MergeRecordModel();
    // }

    initNewMergeRecordModel() {
        const _self = this;
        _self._newMergeRecordModel = new NewMergeRecordModel();
    }

    // initPreviewRecordModel() {
    //     const _self = this;
    //     _self._previewRecordModel = new PreviewRecordModel();
    // }

    initNewPreviewRecordModel() {
        const _self = this;
        _self._newPreviewRecordModel = new NewPreviewRecordModel();
    }

    //---------------------------------------------------------------
    //------------------------------Clear old preview records---------------------------------
    async clearOldPreviewRecords() {
        Messenger.openClose('CLEAR OLD PREVIEW RECORD');
        const _recordPath = path.join(`${appRoot}`, '.previewRecords');
        Messenger.log(`Existence of .previewRecords (${_recordPath}):`, fs.existsSync(_recordPath));
        if (fs.existsSync(_recordPath)) {
            fs.rmSync(_recordPath, { force: true });
        }
        Messenger.openClose('/CLEAR OLD PREVIEW RECORD');
    }

    //---------------------------------------------------------------
    //------------------------------Start merge---------------------------------
    async startMerge() {
        Messenger.openClose('TREE PROPAGATE');
        const _self = this;
        _self.sendMergeStart();
        await _self._newBranchTree.propagate();
        Messenger.openClose('/TREE PROPAGATE');
    }

    async sendMergeStart() {
        const _self = this;
        // const _rootBranch = _self._branchModel.getRootBranch();
        // await _self._cmsService.sendMergeStart(_rootBranch);

        //strapi API
        const _newRootBranch = _self._newBranchModel.getRootBranch();
        await _self._strapiService.sendMergeStart(_newRootBranch);
    }

    //---------------------------------------------------------------
    //------------------------------Post merge action---------------------------------
    async postMergeAction() {
        Messenger.openClose('POST MERGE ACTION');
        const _self = this;
        await _self.handleMergeMessage();
        const _mergeSuccessRecordsForThisTime = _self._newMergeRecordModel.getMergeSuccessRecordsForThisTime();
        const _mergeFailRecordsForThisTime = _self._newMergeRecordModel.getMergeFailRecordsForThisTime();

        Messenger.log('Success (Only for this time):', _mergeSuccessRecordsForThisTime);
        Messenger.log('Fail: (Only for this time):', _mergeFailRecordsForThisTime);
        Messenger.openClose('/POST MERGE ACTION');
    }

    async handleMergeMessage() {
        const _self = this;
        // const _allMergeErrors = await _self._cmsService.getAllMergeFailRecords();
        const _newAllMergeErrors = await _self._strapiService.getAllMergeFailRecords();
        const _mergeFailRecordsForThisTime = _self._newMergeRecordModel.getMergeFailRecordsForThisTime();
        const _frontendGroupTG = _self._telegramModel.getFrontendGroupTG();
        const _hasMergeError = (_newAllMergeErrors.length > 0) || (_mergeFailRecordsForThisTime.length > 0);
        
        if (_hasMergeError) {
            const _allFrontendTG = _self._telegramModel.getAllFrontendTG();
            const _mergeErrorMsg = MessageBuilderUtil.getMergeFailMsg(_newAllMergeErrors, _allFrontendTG);
            await _self._cmsService.sendMergeErrorMessage(_frontendGroupTG, _mergeErrorMsg);
        } else {
            await _self._cmsService.clearMergeErrorMessage(_frontendGroupTG);
        }
    }

    //---------------------------------------------------------------
    //------------------------------Update Merge commit and Preview commit---------------------------------
    async updatePreviewCommit(){
        Messenger.openClose('UPDATE ALL PREVIEW COMMIT');
        const _self = this;
        const _previewRecordsForThisTime = _self._newPreviewRecordModel.getPreviewRecordsForThisTime();

        for (const _eachRecord of _previewRecordsForThisTime) {
            await _self._strapiService.sendUpdatePreviewCommit(_eachRecord);
        }

        Messenger.openClose('/UPDATE ALL PREVIEW COMMIT');
    }
    //---------------------------------------------------------------
    //------------------------------Export new preview records---------------------------------
    exportPreviewRecords() {
        const _self = this;
        const _previewRecordsForThisTime = _self._newPreviewRecordModel.getPreviewRecordsForThisTime();
        const _recordPath = path.join(`${appRoot}`, '.previewRecords');

        Messenger.log('Preview Record (Only for this time):', _previewRecordsForThisTime);
        Messenger.log('_recordPath', _recordPath);

        fs.writeFileSync(_recordPath, JSON.stringify(_previewRecordsForThisTime), 'utf8', function (err) {
            if (err) { Messenger.log(err); }
        });
    }
}


module.exports = AutoMergeController;