const appRoot = require('app-root-path');
const axios = require('axios');
var querystring = require('querystring');
// const TELEGRAM_TABLE = require(`${appRoot}/data/telegramTable.json`)
const TELEGRAM_TABLE = {
    "214": "1433671879",
    "166": "999999999"
}

class CmsService{
    _telegramTable;

    _CONFIG = {
        'CMS_URL': process.env.CMS_HOST || '',
        'SEND_MESSAGE_API_SUFFIX': '/api/SendMessage',
        'GET_BRANCH_TABLE_SUFFIX': '/api/autoMergeList',
        'GET_TELEGRAM_TABLE_SUFFIX': '/api/autoMergeGetAllTelegrams'
    }

    constructor(){
        let _self = this;
        _self._telegramTable = TELEGRAM_TABLE;
        if(!_self._CONFIG.CMS_URL) throw new Error('process.env.CMS_HOST is undefined!');
    }

    async sendMessage($targetTgId, $message){
        console.log(`[CMS] sending message to ${$targetTgId} by ${this._CONFIG.CMS_URL}`);
        let _self = this,
            _url = `${_self._CONFIG.CMS_URL}${_self._CONFIG.SEND_MESSAGE_API_SUFFIX}`,
            _data = {
                "chat_id": $targetTgId,
                "message": $message 
            },
            _headers = { 'content-type': 'application/x-www-form-urlencoded' },
            _result = await axios.post(_url, querystring.stringify(_data), {_headers});
        console.log(`[CMS] Sent message to ${$targetTgId} with message ${$message}`);
    }

    async getTelegramTable(){
        let _self = this,
            _url = `${_self._CONFIG.CMS_URL}${_self._CONFIG.GET_TELEGRAM_TABLE_SUFFIX}`,
            _result = await axios.get(_url);
        // console.log("DEBUG: calling getTelegramTable...");
        // console.log("DEBUG: getTelegramTable result: ", _result.data.telegrams);
        return _result;
    }

    async getBranchTable(){
        let _self = this,
            _url = `${_self._CONFIG.CMS_URL}${_self._CONFIG.GET_BRANCH_TABLE_SUFFIX}`,
            _result = await axios.get(_url);
        // console.log("DEBUG: calling getBranchTable...");
        // console.log("DEBUG: getBranchTable result: ", _result.data.allBranches);
        return _result.data.allBranches;
    }

    async updateBranchStatus(){}
}

module.exports = CmsService;