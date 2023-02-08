const appRoot = require('app-root-path');
const axios = require('axios');
var querystring = require('querystring');

class CmsService{
    _telegramTable;

    _CONFIG = {
        'CMS_URL': process.env.CMS_HOST || '',
        'ACCESS_TOKEN': 'a223824d1256db55c5f6f3e2d3303043', //Pimcore user access token
        'SEND_MESSAGE_API_SUFFIX': '/api/SendMessage',
        'GET_BRANCH_TABLE_SUFFIX': (process.env.IS_DEVELOPMENT) ? '/api/dev_autoMergeList' : '/api/autoMergeList',
        'SEND_MERGE_START_SUFFIX': (process.env.IS_DEVELOPMENT) ? '/api/dev_autoMergeMergeStart' : '/api/autoMergeMergeStart',
        'SEND_MERGE_SUCCESS_SUFFIX': (process.env.IS_DEVELOPMENT) ? '/api/dev_autoMergeMergeSuccess' : '/api/autoMergeMergeSuccess',
        'SEND_MERGE_FAIL_SUFFIX': (process.env.IS_DEVELOPMENT) ? '/api/dev_autoMergeMergeFail' : '/api/autoMergeMergeFail',
        'GET_TELEGRAM_TABLE_SUFFIX': (process.env.IS_DEVELOPMENT) ? '/api/dev_autoMergeGetAllTelegrams' : '/api/autoMergeGetAllTelegrams',
        'GET_ALL_MERGE_FAIL_RECORDS_SUFFIX': (process.env.IS_DEVELOPMENT) ? '/api/dev_autoMergeGetAllMergeFailRecords' : '/api/autoMergeGetAllMergeFailRecords',
        'SEND_MERGE_ERROR_MESSAGE': (process.env.IS_DEVELOPMENT) ? '/api/dev_autoMergeSendErrorMessage' : '/api/autoMergeSendErrorMessage',
        'CLEAR_MERGE_ERROR_MESSAGE': (process.env.IS_DEVELOPMENT) ? '/api/dev_autoMergeClearErrorMessage' : '/api/autoMergeClearErrorMessage'
    }

    constructor(){
        let _self = this;
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
        return _result;
    }

    async sendMergeErrorMessage($targetTgId, $message){
        console.log(`[CMS] sending merge error message to ${$targetTgId} by ${this._CONFIG.CMS_URL}`);
        let _self = this,
            _url = `${_self._CONFIG.CMS_URL}${_self._CONFIG.SEND_MERGE_ERROR_MESSAGE}`,
            _data = {
                "token": _self._CONFIG.ACCESS_TOKEN,
                "chat_id": $targetTgId,
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
            _data = {
                "token": _self._CONFIG.ACCESS_TOKEN,
                "chat_id": $targetTgId,
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