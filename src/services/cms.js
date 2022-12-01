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
        'ACCESS_TOKEN': 'a223824d1256db55c5f6f3e2d3303043', //Pimcore user access token
        'SEND_MESSAGE_API_SUFFIX': '/api/SendMessage',
        'GET_BRANCH_TABLE_SUFFIX': '/api/autoMergeList',
        'SAVE_MERGE_FAIL_RECORDS': 'api/saveMergeFailRecords',
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

    async sendMergeFailRecords($mergeFailRecords){
        console.log(`[CMS] sending mergeFailRecords to CMS`);
        let _self = this,
            _url = `${_self._CONFIG.CMS_URL}${_self._CONFIG.SAVE_MERGE_FAIL_RECORDS}`,
            _data = {
                "token": _self._CONFIG.ACCESS_TOKEN,
                "records": $mergeFailRecords
            },
            _headers = { 'content-type': 'application/x-www-form-urlencoded' },
            _result = await axios.post(_url, querystring.stringify(_data), {_headers});
        console.log(`[CMS] Sent mergeFailRecords to CMS with result: `, _result);
    }

    async getTelegramTable(){
        let _self = this,
            _url = `${_self._CONFIG.CMS_URL}${_self._CONFIG.GET_TELEGRAM_TABLE_SUFFIX}`,
            _result = await axios.get(_url);
        return _result.data.telegrams;
    }

    async getBranchTable(){
        let _self = this,
            _url = `${_self._CONFIG.CMS_URL}${_self._CONFIG.GET_BRANCH_TABLE_SUFFIX}`,
            _result = await axios.get(_url);
        return _result.data.allBranches;
    }

    async updateBranchStatus(){}
}

module.exports = CmsService;