const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });

class PreviewRecord {
    _previewRecordForThisTime

    constructor(){
        let _self = this;
        _self._previewRecordForThisTime = [];
    }

    getPreviewRecordsForThisTime(){
        let _self = this;
        return _self._previewRecordForThisTime;
    }

    addPreviewRecordForThisTime($newRecord){
        let _self = this,
            _returnObj = {};

        _returnObj.branchName = $newRecord.to;            
        _returnObj.destinationCommitHash = $newRecord.result.destinationBranchCommitHash;
        _returnObj.destinationPreviewCommitHash = $newRecord.result.destinationBranchPreviewCommitHash;

        _self._previewRecordForThisTime.push(_returnObj);
    }
}

module.exports = PreviewRecord;