const axios = require('axios');
const appRoot = require('app-root-path');
var querystring = require('querystring');
const Messenger = require(`${appRoot}/src/utils/messenger`);

class StrapiService {
    _CONFIG = {
        'STRAPI_URL': 'http://192.168.1.209/automerge', //proxy in MM209 to redirect
        // 'STRAPI_URL': 'http://192.168.0.212:1337', //localhost
        'ACCESS_TOKEN': 'Bearer 5ebfff3bed88348daf6dd13c0c68c17c67d74e815259a3d8af1ad79c2abb4aef8cdd8e10335321759dacae0244cd36ac0706989eba67decbea0c5b2af342b01a1c71746345ce4921f7955f5bdc3cce4cb053ed849c96b7073b643c612be13fafbbcc7d98e129e9564eb40bc43935a849136f76ed981d9d49cf6193df40d4d214', //strapi API token
        'GET_BRANCH_TABLE_SUFFIX': '/api/branches/getAllBranches',
        'SEND_MERGE_START_SUFFIX': '/api/branches/mergeStart',
        'SEND_MERGE_SUCCESS_SUFFIX': '/api/branches/mergeSuccess',
        'SEND_MERGE_FAIL_SUFFIX': '/api/branches/mergeFail',
        'SEND_UPDATE_PREVIEW_COMMIT_SUFFIX': '/api/branches/updatePreviewCommit',
        'GET_ALL_MERGE_FAIL_RECORDS_SUFFIX': '/api/branches/getAllMergeFailRecords',
    }

    constructor() {
        let _self = this;
        if (!_self._CONFIG.STRAPI_URL) throw new Error('STRAPI_URL is undefined!');
    }

    async sendMergeStart($rootBranch) {
        Messenger.log(`[STRAPI] Sending mergeStart to Strapi with root ${$rootBranch}`);
        const _self = this;
        const _data = {
            "root": $rootBranch
        }
        const _queryString = querystring.stringify(_data);
        const _config = {
            timeout: 5000,
            signal: AbortSignal.timeout(5000),
            method: 'POST',
            url: `${_self._CONFIG.STRAPI_URL}${_self._CONFIG.SEND_MERGE_START_SUFFIX}?${_queryString}`,
            headers: {
                'Authorization': _self._CONFIG.ACCESS_TOKEN
            }
        };
        Messenger.log(`[STRAPI] Sending mergeStart to Strapi with ${_self._CONFIG.STRAPI_URL}${_self._CONFIG.SEND_MERGE_START_SUFFIX}?${_queryString}`);

        await axios.request(_config);
    }

    async sendMergeSuccess($successRecord) {
        Messenger.log(`[STRAPI] Sending mergeSuccess to Strapi parent ${$successRecord.parent} to ${$successRecord.target}`);
        const _self = this;
        const _data = {
            "parent": $successRecord.parent,
            "target": $successRecord.target
        }
        const _queryString = querystring.stringify(_data);
        const _config = {
            timeout: 5000,
            signal: AbortSignal.timeout(5000),
            method: 'POST',
            url: `${_self._CONFIG.STRAPI_URL}${_self._CONFIG.SEND_MERGE_SUCCESS_SUFFIX}?${_queryString}`,
            headers: {
                'Authorization': _self._CONFIG.ACCESS_TOKEN
            }
        };
        Messenger.log(`[STRAPI] Sending mergeSuccess to Strapi with ${_self._CONFIG.STRAPI_URL}${_self._CONFIG.SEND_MERGE_SUCCESS_SUFFIX}?${_queryString}`);

        await axios.request(_config);
    }

    async sendMergeFail($failRecord) {
        Messenger.log(`[STRAPI] Sending mergeFail to Strapi parent ${$failRecord.parent} to ${$failRecord.target} with Message: ${$failRecord.result.parentBranchCommitMsg}`);
        const _self = this;
        const _data = {
            "parent": $failRecord.parent,
            "target": $failRecord.target,
            "failMessage": $failRecord.result.parentBranchCommitMsg
        }
        const _queryString = querystring.stringify(_data);
        const _config = {
            timeout: 5000,
            signal: AbortSignal.timeout(5000),
            method: 'POST',
            url: `${_self._CONFIG.STRAPI_URL}${_self._CONFIG.SEND_MERGE_FAIL_SUFFIX}?${_queryString}`,
            headers: {
                'Authorization': _self._CONFIG.ACCESS_TOKEN
            }
        };
        Messenger.log(`[STRAPI] Sending mergeFail to Strapi with ${_self._CONFIG.STRAPI_URL}${_self._CONFIG.SEND_MERGE_FAIL_SUFFIX}?${_queryString}`);

        await axios.request(_config);
    }

    async sendUpdatePreviewCommit($previewRecord) {
        const _self = this;
        const _encodedName = encodeURIComponent($previewRecord.branchName);
        const _mergeCommit = $previewRecord.targetBranchCommitHash;
        const _newPreviewCommit = $previewRecord.targetBranchPreviewCommitHash;
        Messenger.log(`[STRAPI] Sending updatePreviewCommit to Strapi for ${_encodedName}`);
        const _data = {
            "target": $previewRecord.branchName,
            "mergeCommit": _mergeCommit
        };
        if (_newPreviewCommit) {
            _data.newPreviewCommit = _newPreviewCommit;
        }
        const _queryString = querystring.stringify(_data);
        const _config = {
            timeout: 5000,
            signal: AbortSignal.timeout(5000),
            method: 'PUT',
            url: `${_self._CONFIG.STRAPI_URL}${_self._CONFIG.SEND_UPDATE_PREVIEW_COMMIT_SUFFIX}?${_queryString}`,
            headers: {
                'Authorization': _self._CONFIG.ACCESS_TOKEN
            }
        };
        Messenger.log(`[STRAPI] Sending updatePreviewCommit to Strapi with ${_self._CONFIG.STRAPI_URL}${_self._CONFIG.SEND_UPDATE_PREVIEW_COMMIT_SUFFIX}?${_queryString}`);

        await axios.request(_config);
    }

    async getBranchTable() {
        const _self = this;
        const _config = {
            timeout: 5000,
            signal: AbortSignal.timeout(5000),
            method: 'GET',
            url: `${_self._CONFIG.STRAPI_URL}${_self._CONFIG.GET_BRANCH_TABLE_SUFFIX}`,
            headers: {
                'Authorization': _self._CONFIG.ACCESS_TOKEN
            }
        };
        Messenger.log(`[STRAPI] Sending getBranchTable to Strapi with ${_self._CONFIG.STRAPI_URL}${_self._CONFIG.GET_BRANCH_TABLE_SUFFIX}`);

        return await axios
            .request(_config)
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                if (error.code === 'ECONNABORTED') {
                    Messenger.log('[STRAPI] getBranchTable() error: Request timed out');
                } else {
                    Messenger.log(`[STRAPI] getBranchTable() error:`, error.message);
                }
            })
    }

    async getAllMergeFailRecords() {
        const _self = this;
        const _config = {
            timeout: 5000,
            signal: AbortSignal.timeout(5000),
            method: 'GET',
            url: `${_self._CONFIG.STRAPI_URL}${_self._CONFIG.GET_ALL_MERGE_FAIL_RECORDS_SUFFIX}`
        };
        Messenger.log(`[STRAPI] Sending getAllMergeFailRecords to Strapi with ${_self._CONFIG.STRAPI_URL}${_self._CONFIG.GET_ALL_MERGE_FAIL_RECORDS_SUFFIX}`);

        return await axios
            .request(_config)
            .then((response) => {
                // return response.data.map($branch => $branch['MergeFailCommitMessage']);
                return response.data;
            })
            .catch((error) => {
                if (error.code === 'ECONNABORTED') {
                    Messenger.log('[STRAPI] getAllMergeFailRecords() error: Request timed out');
                } else {
                    Messenger.log(`[STRAPI] getAllMergeFailRecords() error:`, error);
                }
            })
    }
}

module.exports = StrapiService;
