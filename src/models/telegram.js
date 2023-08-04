const appRoot = require('app-root-path');
require('dotenv').config({ path: `${appRoot}/.env` });

class TelegramModel{
    _telegramTable;

    _CONFIG={
        "FRONTEND_GROUP_TG_KEY": process.env.FRONTEND_GROUP_TG_KEY || "Frontend-Auto-Merge-Conflict"
    }

    constructor(){ }

    setTelegramTable($telegramTable){
        const _self = this;
        _self._telegramTable = $telegramTable;
    }

    getTelegramTable(){
        const _self = this;
        return _self._telegramTable;
    }

    getFrontendGroupTG(){
        const _self = this;
        for (let $i = 0; $i < _self._telegramTable.length; $i++) {
            const _telegramData = _self._telegramTable[$i];
            if(_telegramData['o_key'] === _self._CONFIG.FRONTEND_GROUP_TG_KEY) return _telegramData["mchatId"];
        }
    }

    getChatIdByStaffCodeArr($staffCodeArr){
        const _self = this;
        const _returnObj = [];
        for (let $i = 0; $i < $staffCodeArr.length; $i++) {
            const _staffCode = $staffCodeArr[$i],
                  _chatId = _self.getChatIdByStaffCode(_staffCode);
            _returnObj.push(_chatId);
        }
        return _returnObj;
    }

    getChatIdByStaffCode($staffCode){
        const _self = this;
        for (let $i = 0; $i < _self._telegramTable.length; $i++) {
            const _telegramData = _self._telegramTable[$i];
            if(_telegramData['o_key'] === $staffCode) return _telegramData['mchatId'];
        }
    }

    getAllFrontendTG(){
        const _self = this;
        const _result = [];
        for (let $i = 0; $i < _self._telegramTable.length; $i++) {
            const _telegramData = _self._telegramTable[$i];
            if(_telegramData['mType'] === 'individual'){
                _result.push(_telegramData)
            }
        }
        return _result;
    }
}

module.exports = TelegramModel;