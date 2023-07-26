const axios = require('axios');
var querystring = require('querystring');

class StrapiService {
    _CONFIG = {
        'STRAPI_URL': 'http://192.168.0.212:1337', //localhost
        'ACCESS_TOKEN': 'Bearer 906a4292205e6ef4ae5aabec024b68313105ea25900efcf1a0dbf5441e7280473e67c378ac107a21ce57de29022568ea99d5d5b80c481f31e5e24f8178333cf6e9c63bddc0337b969fd5e904ca42545a4e446526493ef088bd7234563d118de720adcf8663ca787c8d7a2d6e15f5a9aacdd2b0859a31768ff05e133268d76acc', //strapi API token
        // 'SEND_MESSAGE_API_SUFFIX': '/api/SendMessage',
        'GET_BRANCH_TABLE_SUFFIX': '/api/branches/get/allBranches',
        'SEND_MERGE_START_SUFFIX': '/api/branches/merge/start',
        'SEND_MERGE_SUCCESS_SUFFIX': '/api/branches/merge/success',
        'SEND_MERGE_FAIL_SUFFIX': '/api/branches/merge/fail',
        // 'GET_TELEGRAM_TABLE_SUFFIX': '/api/autoMergeGetAllTelegrams',
        'GET_ALL_MERGE_FAIL_RECORDS_SUFFIX': '/api/branches/get/allMergeFailRecords',
        // 'SEND_MERGE_ERROR_MESSAGE': '/api/autoMergeSendErrorMessage',
        // 'CLEAR_MERGE_ERROR_MESSAGE': '/api/autoMergeClearErrorMessage'
    }

    constructor() {
        let _self = this;
        if (!_self._CONFIG.STRAPI_URL) throw new Error('STRAPI_URL is undefined!');
    }

    // async sendMessage($targetTgId, $message){
    //     console.log(`[STRAPI] sending message to ${$targetTgId} by ${this._CONFIG.STRAPI_URL}`);
    //     let _self = this,
    //         _url = `${_self._CONFIG.STRAPI_URL}${_self._CONFIG.SEND_MESSAGE_API_SUFFIX}`,
    //         _chatId = $targetTgId,
    //         _data = {
    //             "chat_id": _chatId,
    //             "message": $message 
    //         },
    //         _headers = { 'content-type': 'application/x-www-form-urlencoded' },
    //         _result = await axios.post(_url, querystring.stringify(_data), {_headers});
    //     console.log(`[STRAPI] Sent message to ${$targetTgId} with message ${$message}`);
    //     return _result;
    // }

    // async sendMergeErrorMessage($targetTgId, $message){
    //     console.log(`[STRAPI] sending merge error message to ${$targetTgId} by ${this._CONFIG.STRAPI_URL}`);
    //     let _self = this,
    //         _url = `${_self._CONFIG.STRAPI_URL}${_self._CONFIG.SEND_MERGE_ERROR_MESSAGE}`,
    //         _chatId = $targetTgId,
    //         _data = {
    //             "token": _self._CONFIG.ACCESS_TOKEN,
    //             "chat_id": _chatId,
    //             "message": $message 
    //         },
    //         _headers = { 'content-type': 'application/x-www-form-urlencoded' },
    //         _result = await axios.post(_url, querystring.stringify(_data), {_headers});
    //     console.log(`[STRAPI] Sent message to ${$targetTgId} with message ${$message}`);
    //     return _result;
    // }

    // async clearMergeErrorMessage($targetTgId){
    //     console.log(`[STRAPI] Clearing merge error message to ${$targetTgId} by ${this._CONFIG.STRAPI_URL}`);
    //     let _self = this,
    //         _url = `${_self._CONFIG.STRAPI_URL}${_self._CONFIG.CLEAR_MERGE_ERROR_MESSAGE}`,
    //         _chatId = $targetTgId,
    //         _data = {
    //             "token": _self._CONFIG.ACCESS_TOKEN,
    //             "chat_id": _chatId,
    //         },
    //         _headers = { 'content-type': 'application/x-www-form-urlencoded' },
    //         _result = await axios.post(_url, querystring.stringify(_data), {_headers});
    //     console.log(`[STRAPI] Cleared message to ${$targetTgId}`);
    //     return _result;
    // }

    async sendMergeStart($rootBranch) {
        console.log(`[STRAPI] Sending mergeStart to CMS with root ${$rootBranch}`);
        let _self = this,
            _rootBranchName = $rootBranch.replaceAll("/", "_"),
            _url = `${_self._CONFIG.STRAPI_URL}${_self._CONFIG.SEND_MERGE_START_SUFFIX}`,
            _data = {
                "root": _rootBranchName
            },
            _headers = {
                'Authorization': _self._CONFIG.ACCESS_TOKEN
            },
            _result = await axios.post(_url + '?' + querystring.stringify(_data), { _headers });
    }

    async sendMergeSuccess($successRecord) {
        console.log(`[STRAPI] Sending mergeSuccess to CMS from ${$successRecord.from} to ${$successRecord.to}`);
        let _self = this,
            _parentBranchName = $successRecord.from.replaceAll("/", "_"),
            _targetBranchName = $successRecord.to.replaceAll("/", "_"),
            _url = `${_self._CONFIG.STRAPI_URL}${_self._CONFIG.SEND_MERGE_SUCCESS_SUFFIX}`,
            _data = {
                "parent": _parentBranchName,
                "target": _targetBranchName
            },
            _headers = {
                'Authorization': _self._CONFIG.ACCESS_TOKEN
            },
            _result = await axios.post(_url + '?' + querystring.stringify(_data), { _headers });
    }

    async sendMergeFail($failRecord) {
        console.log(`[STRAPI] Sending mergeFail to CMS from ${$failRecord.from} to ${$failRecord.to}`);
        let _self = this,
            _parentBranchName = $failRecord.from.replaceAll("/", "_"),
            _targetBranchName = $failRecord.to.replaceAll("/", "_"),
            _url = `${_self._CONFIG.STRAPI_URL}${_self._CONFIG.SEND_MERGE_FAIL_SUFFIX}`,
            _data = {
                "parent": _parentBranchName,
                "target": _targetBranchName,
                "failMessage": $failRecord.fromCommitMsg
            },
            _headers = {
                'Authorization': _self._CONFIG.ACCESS_TOKEN
            },
            _result = await axios.post(_url + '?' + querystring.stringify(_data), { _headers });
    }

    // async getTelegramTable() {
    //     let _self = this,
    //         _url = `${_self._CONFIG.STRAPI_URL}${_self._CONFIG.GET_TELEGRAM_TABLE_SUFFIX}`,
    //         _result = await axios.get(_url);
    //     return _result.data.telegrams;
    // }

    async getBranchTable() {
        let _self = this,
            _url = `${_self._CONFIG.STRAPI_URL}${_self._CONFIG.GET_BRANCH_TABLE_SUFFIX}`,
            _result = await axios.get(_url);
        return _result.data;
    }

    async getAllMergeFailRecords() {
        let _self = this,
            _url = `${_self._CONFIG.STRAPI_URL}${_self._CONFIG.GET_ALL_MERGE_FAIL_RECORDS_SUFFIX}`,
            _result = await axios.get(_url);
        return _result;
    }
}

module.exports = StrapiService;
