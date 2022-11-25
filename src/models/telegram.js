const appRoot = require('app-root-path');

class TelegramModel{
    _cmsService;
    _telegramTable;

    _CONFIG={
        "FRONTEND_GROUP_TG_KEY": "BotGroup"
    }

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

    getFrontendGroupTG(){
        let _self = this;
        for (let $i = 0; $i < _self._telegramTable.length; $i++) {
            const _telegramData = _self._telegramTable[$i];
            if(_telegramData['o_key'] === _self._CONFIG.FRONTEND_GROUP_TG_KEY) return _telegramData["mchatId"];
        }
    }

    getChatIdByStaffCodeArr($staffCodeArr){
        let _self = this,
            _returnObj = [];
        for (let $i = 0; $i < $staffCodeArr.length; $i++) {
            const _staffCode = $staffCodeArr[$i],
                  _chatId = _self.getChatIdByStaffCode(_staffCode);
            _returnObj.push(_chatId);
        }
        return _returnObj;
    }

    getChatIdByStaffCode($staffCode){
        let _self = this;
        for (let $i = 0; $i < _self._telegramTable.length; $i++) {
            const _telegramData = _self._telegramTable[$i];
            if(_telegramData['o_key'] === $staffCode) return _telegramData['mchatId'];
        }
    }
}

module.exports = TelegramModel;