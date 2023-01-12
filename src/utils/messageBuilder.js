
class MessageBuilder{
    constructor(){}

    static getMergeFailMsg($mergeErrors, $allFrontendTG){
        let _datetime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }),
            _msg = "";
        _msg += "<b>Merge failed!</b>\n";
        _msg += "————————————\n";
        for (let $i = 0; $i < $mergeErrors.length; $i++) {
            const _error = $mergeErrors[$i],
                  _authorName = getAuthorName(_error['mMergeFailCommitMsg']),
                  _authorChatIdObj = getChatIdByAuthor(_authorName, $allFrontendTG),
                  _authorChatId = _authorChatIdObj['mchatId'],
                  _authorChatKey = _authorChatIdObj['o_key'];

            _msg += `\u{1F4A5} <b>${_error['mParentBranch']}</b> ----> <b>${_error['mBranchName']}</b>\n\n`;
            _msg += _authorChatId ? `<b>Author: </b> <a href="tg://user?id=${_authorChatId}">@${_authorChatKey}</a> \n\n` : '';
            _msg += `<b>Commit: </b>${_error['mMergeFailCommitMsg']}\n\n`;
            _msg += `<b>In Charge: </b>`;
            _msg += getAppendInChargeMsg(_error, $allFrontendTG);
            _msg += '\n————————————';
        }
        _msg += `\n${_datetime}`
        return _msg;

        function getChatIdByAuthor($authorName, $allFrontendTG){
            for(let i = 0; i < $allFrontendTG.length; i++){
                const _chatIdKey = $allFrontendTG[i]['o_key'],
                      _isKeyMatchAuthor = $authorName.includes(_chatIdKey);
                if(_isKeyMatchAuthor) return $allFrontendTG[i];
            }
            return false;
        }

        function getAuthorName($failCommitMsg){
            let _stringWrappedByBracket = $failCommitMsg.match(/\((.*?)\)/),_stringWrappedByFirstBracket = _stringWrappedByBracket[1];
            return _stringWrappedByFirstBracket;
        }

        function getAppendInChargeMsg($error, $allFrontendTG){
            let _inCharge = JSON.parse($error['mInCharge']),
                _isAllMemberInCharge = _inCharge.length == 0,
                _returnMsg = '';
            if(_isAllMemberInCharge){
                for (let $j = 0; $j < $allFrontendTG.length; $j++) {
                    const _inChargeCode = $allFrontendTG[$j]['o_key'],
                          _inChargeChatId = $allFrontendTG[$j]['mchatId'];
                    _returnMsg += `<a href="tg://user?id=${_inChargeChatId}">@${_inChargeCode}</a> `
                }
            }else{
                for (let $j = 0; $j < _inCharge.length; $j++) {
                    const _inChargeCode = _inCharge[$j],
                          _inChargeChatId = getChatIdByCode(_inChargeCode, $allFrontendTG);
                    _returnMsg += `<a href="tg://user?id=${_inChargeChatId}">@${_inChargeCode}</a> `
                }
            }
            return _returnMsg;
        }

        function getChatIdByCode($inChargeCode ,$allFrontendTG){
            for (let $j = 0; $j < $allFrontendTG.length; $j++) {
                const _frontendTG = $allFrontendTG[$j];
                if(_frontendTG['o_key'] === $inChargeCode){
                    return _frontendTG['mchatId'];
                }
            }
        }
    }
}

module.exports = MessageBuilder;