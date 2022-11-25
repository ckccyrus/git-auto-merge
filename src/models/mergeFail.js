const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });

class MergeFailModel{
    _mergeFailStack

    constructor(){
        let _self = this;
        _self._mergeFailStack = [];
    }

    getMergeFailStack(){
        let _self = this;
        return _self._mergeFailStack;
    }

    addMergeFailRecord($newRecord){
        let _self = this;
        _self._mergeFailStack.push($newRecord);
    }
}

module.exports = MergeFailModel;