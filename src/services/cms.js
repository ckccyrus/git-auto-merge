const axios = require('axios');
const appRoot = require('app-root-path');
var querystring = require('querystring');
const Messenger = require(`${appRoot}/src/utils/messenger`);

class CmsService{
    _telegramTable;

    _CONFIG = {
        'CMS_URL': process.env.CMS_HOST || '',
        'ACCESS_TOKEN': '9dac263396c47824151354d955fe0f0d', //Pimcore user access token
        'GET_TELEGRAM_TABLE_SUFFIX': '/api/autoMergeGetAllTelegrams',
        'SEND_MERGE_ERROR_MESSAGE': '/api/autoMergeSendErrorMessage',
        'CLEAR_MERGE_ERROR_MESSAGE': '/api/autoMergeClearErrorMessage'
    }

    constructor(){
        let _self = this;
        if(!_self._CONFIG.CMS_URL) throw new Error('process.env.CMS_HOST is undefined!');
    }

    async sendMergeErrorMessage($targetTgId, $message){
        Messenger.log(`[CMS] sending merge error message to ${$targetTgId} by ${this._CONFIG.CMS_URL}`);
        let _self = this,
            _url = `${_self._CONFIG.CMS_URL}${_self._CONFIG.SEND_MERGE_ERROR_MESSAGE}`,
            _chatId = $targetTgId,
            _data = {
                "token": _self._CONFIG.ACCESS_TOKEN,
                "chat_id": _chatId,
                "message": $message 
            },
            _headers = { 'content-type': 'application/x-www-form-urlencoded' },
            _result = await axios.post(_url, querystring.stringify(_data), {_headers});
        Messenger.log(`[CMS] Sent message to ${$targetTgId} with message ${$message}`);
        return _result;
    }

    async clearMergeErrorMessage($targetTgId){
        Messenger.log(`[CMS] Clearing merge error message to ${$targetTgId} by ${this._CONFIG.CMS_URL}`);
        let _self = this,
            _url = `${_self._CONFIG.CMS_URL}${_self._CONFIG.CLEAR_MERGE_ERROR_MESSAGE}`,
            _chatId = $targetTgId,
            _data = {
                "token": _self._CONFIG.ACCESS_TOKEN,
                "chat_id": _chatId,
            },
            _headers = { 'content-type': 'application/x-www-form-urlencoded' },
            _result = await axios.post(_url, querystring.stringify(_data), {_headers});
        Messenger.log(`[CMS] Cleared message to ${$targetTgId}`);
        return _result;
    }

    async getTelegramTable(){
        let _self = this,
            _url = `${_self._CONFIG.CMS_URL}${_self._CONFIG.GET_TELEGRAM_TABLE_SUFFIX}`,
            _result = await axios.get(_url);
        return _result.data.telegrams;
    }
}

module.exports = CmsService;