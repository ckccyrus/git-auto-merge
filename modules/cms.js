const axios = require('axios');
var querystring = require('querystring');

class Cms{
    _CONFIG = {
        'CMS_URL': `http://192.168.1.84:9001`,
        'SEND_MESSAGE_API_SUFFIX': '/api/SendMessage'
    }

    constructor(){}

    async sendMessage($targetTgId, $message){
        console.log(`DEBUG: [CMS] sending message to ${$targetTgId}`);
        let _self = this,
            _url = `${_self._CONFIG.CMS_URL}${_self._CONFIG.SEND_MESSAGE_API_SUFFIX}`,
            _data = {
                "chat_id": $targetTgId,
                "message": $message 
            },
            _headers = { 'content-type': 'application/x-www-form-urlencoded' },
            _result = await axios.post(_url, querystring.stringify(_data), {_headers});
        console.log(`DEBUG: [CMS] Sent message to ${$targetTgId} with message ${$message}`);
    }
}

module.exports = Cms;