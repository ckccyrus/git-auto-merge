require('dotenv').config();

const appRoot = require('app-root-path');
const Messenger = require(`${appRoot}/modules/messenger`);
const BranchTree = require(`${appRoot}/modules/branchTree`);
const WorkspaceManager = require(`${appRoot}/modules/workspaceManager`);

const CONFIG = {
    'GIT_USERNAME': encodeURIComponent(process.env.GIT_USERNAME),
    'GIT_PASSWORD': encodeURIComponent(process.env.GIT_PASSWORD),
    'BRANCH_RELATIONSHIP':{
        //'branch': 'parent'
        'master': null,
        'feature-1': 'master',
    },
    'ROOT_BRANCH': 'master'
}


async function asyncMain(){
    Messenger.openClose('MAIN');

    Messenger.openClose('WORKSPACE INIT PRIMARY WORKSPACE');
    await WorkspaceManager.getInstance().initPrimaryWorkspace();
    Messenger.openClose('/WORKSPACE INIT PRIMARY WORKSPACE');

    Messenger.openClose('TREE CREATION');
    let _branchTree = new BranchTree(CONFIG.BRANCH_RELATIONSHIP, CONFIG.ROOT_BRANCH);
    Messenger.openClose('/TREE CREATION');

    Messenger.openClose('TREE PROPAGATE');
    await _branchTree.propagate();
    Messenger.openClose('/TREE PROPAGATE');

    Messenger.openClose('/MAIN');
}

const main = async() => {
    await asyncMain();
}

main();