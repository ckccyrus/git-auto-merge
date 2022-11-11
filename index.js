const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });
const Messenger = require(`${appRoot}/modules/messenger`);
const BranchTree = require(`${appRoot}/modules/branchTree`);
const BranchDataModel = require(`${appRoot}/modules/branchDataModel`);
const WorkspaceManager = require(`${appRoot}/modules/workspaceManager`);

async function asyncMain(){
    Messenger.openClose('MAIN');

    let _branchDataModel = new BranchDataModel();
        _branchDataModel.init();
        _branchRelationship = _branchDataModel.getBranchRelationship(),
        _rootBranch = _branchDataModel.getRootBranch();

    Messenger.openClose('WORKSPACE INIT PRIMARY WORKSPACE');
    await WorkspaceManager.getInstance().initPrimaryWorkspace();
    Messenger.openClose('/WORKSPACE INIT PRIMARY WORKSPACE');

    Messenger.openClose('TREE CREATION');
    let _branchTree = new BranchTree(_branchRelationship, _rootBranch);
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