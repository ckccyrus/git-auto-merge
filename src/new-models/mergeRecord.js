const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });

class MergeRecordModel{
    _mergeFailRecordsForThisTime;
    _mergeSuccessRecordsForThisTime;

    constructor(){
        const _self = this;
        _self._mergeFailRecordsForThisTime = [];
        _self._mergeSuccessRecordsForThisTime = [];
    }

    getMergeSuccessRecordsForThisTime(){
        const _self = this;
        return _self._mergeSuccessRecordsForThisTime;
    }

    getMergeFailRecordsForThisTime(){
        const _self = this;
        return _self._mergeFailRecordsForThisTime;
    }

    addMergeSuccessRecordForThisTime($newRecord){
        const _self = this;
        _self._mergeSuccessRecordsForThisTime.push($newRecord);
    }

    addMergeFailRecordForThisTime($newRecord){
        const _self = this;
        _self._mergeFailRecordsForThisTime.push($newRecord);
    }
}

module.exports = MergeRecordModel;