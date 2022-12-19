const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });
const CmsService = require(`${appRoot}/src/services/cms`);

class MergeRecordModel{
    _mergeFailRecordsForThisTime
    _mergeSuccessRecordsForThisTime
    _cms

    constructor(){
        let _self = this;
        _self._mergeFailRecordsForThisTime = [];
        _self._mergeSuccessRecordsForThisTime = [];
        _self._cms = new CmsService();
    }

    getMergeSuccessRecordsForThisTime(){
        let _self = this;
        return _self._mergeSuccessRecordsForThisTime;
    }

    getMergeFailRecordsForThisTime(){
        let _self = this;
        return _self._mergeFailRecordsForThisTime;
    }

    addMergeSuccessRecordForThisTime($newRecord){
        let _self = this;
        _self._mergeSuccessRecordsForThisTime.push($newRecord);
    }

    addMergeFailRecordForThisTime($newRecord){
        let _self = this;
        _self._mergeFailRecordsForThisTime.push($newRecord);
    }
}

module.exports = MergeRecordModel;