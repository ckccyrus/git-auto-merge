const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });
// const BRANCH_RELATIONSHIP = require(`${appRoot}/data/branchRelationship.json`);
const BRANCH_RELATIONSHIP = {
    "master": {
        "parent": null,
        "inCharge": ["frontend"]
    },
    "feature-1": {
        "parent": "master",
        "inCharge": ["214"]
    },
    "feature-2": {
        "parent": "feature-1",
        "inCharge": ["214", "166"]
    },
    "feature-3": {
        "parent": "master",
        "inCharge": ["166"] 
    }
};

class BranchModel{
    _branchTable;

    _CONFIG = {
        'BRANCH_TABLE':{
            //'branch': 'parent'
            'master': null,
            'feature-1': 'master',
            'feature-2': 'feature-1',
            'feature-3': 'master'
        },
        'ROOT_BRANCH': `${process.env.ROOT_BRANCH || 'master'}`
    }

    constructor(){
        let _self = this;
        // _self._branchTable = _CONFIG.BRANCH_TABLE;
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
}

module.exports = BranchModel;