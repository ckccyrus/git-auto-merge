const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });
const Messenger = require(`${appRoot}/src/utils/messenger`);
const AutoMergeController = require(`${appRoot}/src/controller/autoMerge`);

async function asyncMain(){
    Messenger.openClose('MAIN');

    let _autoMergeController = new AutoMergeController();
    await _autoMergeController.init();
    await _autoMergeController.startMerge();
    await _autoMergeController.postMergeAction();

    Messenger.openClose('/MAIN');
}

const main = async() => {
    await asyncMain();
}

main();