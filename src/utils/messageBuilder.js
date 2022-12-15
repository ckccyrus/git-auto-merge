
class MessageBuilder{
    constructor(){}

    static getMergeFailMsg($errorStack, $allFrontendTG){
        let _datetime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }),
            _msg = "";
        _msg += "Merge failed!\n=====================\n\n";
        for (let $i = 0; $i < $errorStack.length; $i++) {
            const _error = $errorStack[$i];
            _msg += `\u{1F4A5} <b>${_error['from']}</b> ----> <b>${_error['to']}</b> `;
            appendInChargeToMsg(_msg, _error, $allFrontendTG);
            _msg += '\n';
        }
        _msg += `\n=====================\n${_datetime}`
        return _msg;

        function appendInChargeToMsg($msg, $error, $allFrontendTG){
            const _isAllMemberInCharge = $error['inCharge'].length == 0;
            if(_isAllMemberInCharge){
                for (let $j = 0; $j < $allFrontendTG.length; $j++) {
                    const _inChargeCode = $allFrontendTG[$j]['o_key'],
                          _inChargeChatId = $allFrontendTG[$j]['mchatId'];
                    $msg += `<a href="tg://user?id=${_inChargeChatId}">@${_inChargeCode}</a> `
                }
            }else{
                for (let $j = 0; $j < $error['inCharge'].length; $j++) {
                    const _inChargeCode = $error['inCharge'][$j],
                          _inChargeChatId = $error['inChargeId'][$j];
                    $msg += `<a href="tg://user?id=${_inChargeChatId}">@${_inChargeCode}</a> `
                }
            }
        }
    }
}

module.exports = MessageBuilder;