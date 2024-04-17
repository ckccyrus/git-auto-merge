const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });

class BranchModel{
    _branchTable;

    _CONFIG = {
        'ROOT_BRANCH': `${process.env.ROOT_BRANCH}`
    }

    constructor(){
        const _self = this;
        if(_self._CONFIG.ROOT_BRANCH == undefined){
            new Error ('[BranchModel] ROOT_BRANCH is undefined!')
        }
    }

    setBranchTable($branchTable){
        const _self = this;
        _self._branchTable = $branchTable;
    }

    getBranchTable(){
        const _self = this;
        return _self._branchTable;
    }

    getRootBranch(){
        const _self = this;
        return _self._CONFIG.ROOT_BRANCH;
    }

    getBranchInCharge($branchName){
        const _self = this,
            _branchData = _self.getBranchData($branchName);
        return JSON.parse(_branchData['InCharge']);
    }

    getBranchData($branchName){
        const _self = this;
        for (let $i = 0; $i < _self._branchTable.length; $i++) {
            const _branchData = _self._branchTable[$i];
            if(_branchData['Name'] === $branchName) return _branchData;
        }
    }
}

module.exports = BranchModel;