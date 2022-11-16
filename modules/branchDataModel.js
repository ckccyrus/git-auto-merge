const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });
const BRANCH_RELATIONSHIP = require(`${appRoot}/data/branchRelationship.json`);

class BranchDataModel{
    _branchRelationship;

    _CONFIG = {
        'BRANCH_RELATIONSHIP':{
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
        _self._branchRelationship = BRANCH_RELATIONSHIP;
    }

    getBranchRelationship(){
        let _self = this;
        // return _self._CONFIG.BRANCH_RELATIONSHIP;
        return _self._branchRelationship;
    }

    getRootBranch(){
        let _self = this;
        return _self._CONFIG.ROOT_BRANCH;
    }
}

module.exports = BranchDataModel;