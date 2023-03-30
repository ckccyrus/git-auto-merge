const appRoot = require('app-root-path');
const axios = require('axios');
var querystring = require('querystring');

class CmsService{
    _telegramTable;

    _CONFIG = {
        'CMS_URL': process.env.CMS_HOST || '',
        'ACCESS_TOKEN': '9dac263396c47824151354d955fe0f0d', //Pimcore user access token
        'SEND_MESSAGE_API_SUFFIX': '/api/SendMessage',
        'GET_BRANCH_TABLE_SUFFIX': '/api/autoMergeList',
        'SEND_MERGE_START_SUFFIX': '/api/autoMergeMergeStart',
        'SEND_MERGE_SUCCESS_SUFFIX': '/api/autoMergeMergeSuccess',
        'SEND_MERGE_FAIL_SUFFIX': '/api/autoMergeMergeFail',
        'GET_TELEGRAM_TABLE_SUFFIX': '/api/autoMergeGetAllTelegrams',
        'GET_ALL_MERGE_FAIL_RECORDS_SUFFIX': '/api/autoMergeGetAllMergeFailRecords',
        'SEND_MERGE_ERROR_MESSAGE': '/api/autoMergeSendErrorMessage',
        'CLEAR_MERGE_ERROR_MESSAGE': '/api/autoMergeClearErrorMessage'
    }

    constructor(){
        let _self = this;
        if(!_self._CONFIG.CMS_URL) throw new Error('process.env.CMS_HOST is undefined!');
    }

    async sendMessage($targetTgId, $message){
        console.log(`[CMS] sending message to ${$targetTgId} by ${this._CONFIG.CMS_URL}`);
        let _self = this,
            _url = `${_self._CONFIG.CMS_URL}${_self._CONFIG.SEND_MESSAGE_API_SUFFIX}`,
            _chatId = $targetTgId,
            _data = {
                "chat_id": _chatId,
                "message": $message 
            },
            _headers = { 'content-type': 'application/x-www-form-urlencoded' },
            _result = await axios.post(_url, querystring.stringify(_data), {_headers});
        console.log(`[CMS] Sent message to ${$targetTgId} with message ${$message}`);
        return _result;
    }

    async sendMergeErrorMessage($targetTgId, $message){
        console.log(`[CMS] sending merge error message to ${$targetTgId} by ${this._CONFIG.CMS_URL}`);
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
        console.log(`[CMS] Sent message to ${$targetTgId} with message ${$message}`);
        return _result;
    }

    async clearMergeErrorMessage($targetTgId){
        console.log(`[CMS] Clearing merge error message to ${$targetTgId} by ${this._CONFIG.CMS_URL}`);
        let _self = this,
            _url = `${_self._CONFIG.CMS_URL}${_self._CONFIG.CLEAR_MERGE_ERROR_MESSAGE}`,
            _chatId = $targetTgId,
            _data = {
                "token": _self._CONFIG.ACCESS_TOKEN,
                "chat_id": _chatId,
            },
            _headers = { 'content-type': 'application/x-www-form-urlencoded' },
            _result = await axios.post(_url, querystring.stringify(_data), {_headers});
        console.log(`[CMS] Cleared message to ${$targetTgId}`);
        return _result;
    }

    async sendMergeStart($rootBranch){
        console.log(`[CMS] Sending mergeStart to CMS with root ${$rootBranch}`);
        let _self = this,
            _url = `${_self._CONFIG.CMS_URL}${_self._CONFIG.SEND_MERGE_START_SUFFIX}`,
            _data = {
                "token": _self._CONFIG.ACCESS_TOKEN,
                "root": $rootBranch
            },
            _headers = { 'content-type': 'application/x-www-form-urlencoded' },
            _result = await axios.post(_url, querystring.stringify(_data), {_headers});
    }

    async sendMergeSuccess($successRecord){
        console.log(`[CMS] Sending mergeSuccess to CMS from ${$successRecord.from} to ${$successRecord.to}`);
        let _self = this,
            _url = `${_self._CONFIG.CMS_URL}${_self._CONFIG.SEND_MERGE_SUCCESS_SUFFIX}`,
            _data = {
                "token": _self._CONFIG.ACCESS_TOKEN,
                "from": $successRecord.from,
                "to": $successRecord.to
            },
            _headers = { 'content-type': 'application/x-www-form-urlencoded' },
            _result = await axios.post(_url, querystring.stringify(_data), {_headers});
    }

    async sendMergeFail($failRecord){
        console.log(`[CMS] Sending mergeFail to CMS from ${$failRecord.from} to ${$failRecord.to}`);
        let _self = this,
            _url = `${_self._CONFIG.CMS_URL}${_self._CONFIG.SEND_MERGE_FAIL_SUFFIX}`,
            _data = {
                "token": _self._CONFIG.ACCESS_TOKEN,
                "from": $failRecord.from,
                "to": $failRecord.to,
                "fromCommitMsg": $failRecord.fromCommitMsg
            },
            _headers = { 'content-type': 'application/x-www-form-urlencoded' },
            _result = await axios.post(_url, querystring.stringify(_data), {_headers});
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

    async getAllMergeFailRecords(){
        let _self = this,
            _url = `${_self._CONFIG.CMS_URL}${_self._CONFIG.GET_ALL_MERGE_FAIL_RECORDS_SUFFIX}`,
            _result = await axios.get(_url);
        return _result.data.allMergeFailRecords;
    }
}

module.exports = CmsService;