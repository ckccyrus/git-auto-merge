const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });
class BranchModel{
    _branchTable;

    _CONFIG = {
        'ROOT_BRANCH': `${process.env.ROOT_BRANCH}`
    }

    constructor(){
        let _self = this;
        if(_self._CONFIG.ROOT_BRANCH == undefined){
            new Error ('[BranchModel] ROOT_BRANCH is undefined!')
        }
    }

    setBranchTable($branchTable){
        let _self = this;
        _self._branchTable = $branchTable;
    }

    getBranchTable(){
        let _self = this;
        return _self._branchTable;
    }

    getRootBranch(){
        // TODO: should set root branch by environment variable
        let _self = this;
        return _self._CONFIG.ROOT_BRANCH;
    }

    getBranchInCharge($branchName){
        let _self = this,
            _branchData = _self.getBranchData($branchName);
        return JSON.parse(_branchData['mInCharge']);
    }

    getBranchData($branchName){
        let _self = this;
        for (let $i = 0; $i < _self._branchTable.length; $i++) {
            const _branchData = _self._branchTable[$i];
            if(_branchData['mBranchName'] === $branchName) return _branchData;
        }
    }
}

module.exports = BranchModel;