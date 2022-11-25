const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });

class MergeRecordModel{
    _mergeFailRecords
    _mergeSuccessRecords

    constructor(){
        let _self = this;
        _self._mergeFailRecords = [];
        _self._mergeSuccessRecords = [];
    }

    getMergeSuccessRecords(){
        let _self = this;
        return _self._mergeSuccessRecords;
    }

    getMergeFailRecords(){
        let _self = this;
        return _self._mergeFailRecords;
    }

    addMergeSuccessRecord($newRecord){
        let _self = this;
        _self._mergeSuccessRecords.push($newRecord);
    }

    addMergeFailRecord($newRecord){
        let _self = this;
        _self._mergeFailRecords.push($newRecord);
    }
}

module.exports = MergeRecordModel;