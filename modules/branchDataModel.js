class BranchDataModel{
    _CONFIG = {
        'BRANCH_RELATIONSHIP':{
            //'branch': 'parent'
            'master': null,
            'feature-1': 'master',
            'feature-2': 'feature-1',
            'feature-3': 'master'
        },
        'ROOT_BRANCH': 'master'
    }

    constructor(){

    }

    getBranchRelationship(){
        let _self = this;
        return _self._CONFIG.BRANCH_RELATIONSHIP;
    }

    getRootBranch(){
        let _self = this;
        return _self._CONFIG.ROOT_BRANCH;
    }

    init(){
        let _self = this;
        // call api to retrieve data
    }
}

module.exports = BranchDataModel;