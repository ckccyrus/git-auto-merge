require('dotenv').config();

const appRoot = require('app-root-path');
const Messenger = require(`${appRoot}/modules/messenger`);
const BranchTree = require(`${appRoot}/modules/branchTree`);
const WorkspaceManager = require(`${appRoot}/modules/workspaceManager`);

const CONFIG = {
    'GIT_USERNAME': '900',
    'GIT_PASSWORD': encodeURIComponent('Test1234#'),
    'BRANCH_RELATIONSHIP':{
        //'branch': 'parent'
        'master': null,
        'feature-1': 'master',
        'feature-3': 'feature-1',
        'feature-2': 'master'
    },
    'ROOT_BRANCH': 'master'
}


async function asyncMain(){
    Messenger.openClose('MAIN');

    Messenger.openClose('WORKSPACE INIT PRIMARY WORKSPACE');
    await WorkspaceManager.getInstance().initPrimaryWorkspace();
    Messenger.openClose('/WORKSPACE INIT PRIMARY WORKSPACE');

    Messenger.openClose('TREE CREATION');
    // let _rootBranch = 'feature-1',
    //     _branchTree = new BranchTree(CONFIG.BRANCH_RELATIONSHIP, _rootBranch);
    Messenger.openClose('/TREE CREATION');

    Messenger.openClose('TREE PROPAGATE');
    // await _branchTree.propagate();
    Messenger.openClose('/TREE PROPAGATE');

    Messenger.openClose('/MAIN');
}

const main = async() => {
    await asyncMain();
}

main();