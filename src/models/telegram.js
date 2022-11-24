const appRoot = require('app-root-path');
const CmsService = require(`${appRoot}/src/services/cms`);

class TelegramModel{
    _cmsService;
    _telegramTable;

    constructor(){
        let _self = this;
        _self._cmsService = new CmsService();
    }

    getTelegramTable(){
        let _self = this;
    }
}

module.exports = TelegramModel;