
class MessageBuilder{
    constructor(){}

    static getMergeFailMsg($errorStack){
        let _datetime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }),
            _msg = "";
        _msg += "Merge failed!\n=====================\n\n";
        for (let $i = 0; $i < $errorStack.length; $i++) {
            const _error = $errorStack[$i];
            _msg += `\u{1F4A5} <b>${_error['from']}</b> ----> <b>${_error['to']}</b> `;
            for (let $j = 0; $j < _error['inCharge'].length; $j++) {
                const _inChargeCode = _error['inCharge'][$j],
                      _inChargeChatId = _error['inChargeId'][$j];
                _msg += `<a href="tg://user?id=${_inChargeChatId}">@${_inChargeCode}</a> `
            }
            _msg += '\n';
        }
        _msg += `\n=====================\n${_datetime}`
        return _msg;
    }
}

module.exports = MessageBuilder;