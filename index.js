const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });
const Messenger = require(`${appRoot}/src/utils/messenger`);
const BranchTree = require(`${appRoot}/src/components/branchTree`);
const BranchModel = require(`${appRoot}/src/models/branch`);
const WorkspaceManager = require(`${appRoot}/src/managers/workspaceManager`);

function getBranchTree(){
    let _branchModel = new BranchModel(),
        _branchRelationship = _branchModel.getBranchRelationship(),
        _rootBranch = _branchModel.getRootBranch(),
        _branchTree = new BranchTree(_branchRelationship, _rootBranch);
    return _branchTree;
}

async function asyncMain(){
    let _branchTree;

    Messenger.openClose('MAIN');

    Messenger.openClose('WORKSPACE INIT PRIMARY WORKSPACE');
    await WorkspaceManager.getInstance().initPrimaryWorkspace();
    Messenger.openClose('/WORKSPACE INIT PRIMARY WORKSPACE');

    Messenger.openClose('TREE CREATION');
    _branchTree = getBranchTree();
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