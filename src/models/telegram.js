const appRoot = require('app-root-path');

class TelegramModel{
    _cmsService;
    _telegramTable;

    constructor(){
        let _self = this;
    }

    setTelegramTable($telegramTable){
        let _self = this;
        _self._telegramTable = $telegramTable;
    }

    getTelegramTable(){
        let _self = this;
        return _self._telegramTable;
    }
}

module.exports = TelegramModel;