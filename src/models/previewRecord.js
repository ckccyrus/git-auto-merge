const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });

class PreviewRecord {
    _previewRecordForThisTime;

    constructor(){
        const _self = this;
        _self._previewRecordForThisTime = [];
    }

    getPreviewRecordsForThisTime(){
        const _self = this;
        return _self._previewRecordForThisTime;
    }

    addPreviewRecordForThisTime($newRecord){
        const _self = this
        const _returnObj = {}; 
        _returnObj.branchName = $newRecord.target;            
        _returnObj.targetBranchCommitHash = $newRecord.result.targetBranchCommitHash;
        _returnObj.targetBranchPreviewCommitHash = $newRecord.result.targetBranchPreviewCommitHash;

        _self._previewRecordForThisTime.push(_returnObj);
    }
}

module.exports = PreviewRecord;