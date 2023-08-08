
class MessageBuilder {
    constructor() { }

    static getMergeFailMsg($mergeErrors, $allFrontendTG) {
        let _datetime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }),
            _msg = "";

        _msg += "<b>Merge failed!</b>\n";
        _msg += "————————————\n";

        for (const _error of $mergeErrors) {
            const _authorName = getAuthorName(_error['MergeFailCommitMessage']);
            const _authorChatIdObj = getChatIdByAuthor(_authorName, $allFrontendTG);
            const _authorChatId = _authorChatIdObj['mchatId'];
            const _authorChatKey = _authorChatIdObj['o_key'];

            _msg += `\u{1F4A5} <b>${_error['Parent']}</b> ----> <b>${_error['Name']}</b>\n\n`;
            _msg += `<b>In Charge: </b>`;
            _msg += getAppendInChargeMsg(_error, $allFrontendTG);
            _msg += `<b>Commit: </b>${_error['MergeFailCommitMessage']}\n\n`;
            _msg += _authorChatId ? `<b>Author: </b> <a href="tg://user?id=${_authorChatId}">@${_authorChatKey}</a> \n\n` : '';
            _msg += '\n————————————';
        }

        _msg += `\n${_datetime}`
        return _msg;


        function getAuthorName($failCommitMsg) {
            if (!$failCommitMsg) return '';
            const _stringWrappedByBracket = $failCommitMsg.match(/\((.*?)\)/);
            const _authorName = _stringWrappedByBracket[1];
            return _authorName;
        }

        function getChatIdByAuthor($authorName, $allFrontendTG) {
            for (const _chatId of $allFrontendTG) {
                const _chatIdKey = _chatId['o_key'];
                const _isKeyMatchAuthor = $authorName.includes(_chatIdKey);
                if (_isKeyMatchAuthor) return _chatId;
            }
            return false;
        }

        function getAppendInChargeMsg($error, $allFrontendTG) {
            const _inCharge = JSON.parse($error['InCharge']);
            const _isAllMemberInCharge = (_inCharge.length == 0);
            let _returnMsg = '';

            if (_isAllMemberInCharge) {
                for (const _tg of $allFrontendTG) {
                    const _inChargeCode = _tg['o_key'];
                    const _inChargeChatId = _tg['mchatId'];
                    _returnMsg += `<a href="tg://user?id=${_inChargeChatId}">@${_inChargeCode}</a> `
                }
            } else {
                for (const _person of _inCharge) {
                    const _inChargeChatId = getChatIdByCode(_person, $allFrontendTG);
                    _returnMsg += `<a href="tg://user?id=${_inChargeChatId}">@${_person}</a> `
                }
            }
            return _returnMsg;
        }

        function getChatIdByCode($inChargeCode, $allFrontendTG) {
            for (const _tg of $allFrontendTG) {
                if (_tg['o_key'] === $inChargeCode) {
                    return _tg['mchatId'];
                }
            }
        }
    }
}

module.exports = MessageBuilder;