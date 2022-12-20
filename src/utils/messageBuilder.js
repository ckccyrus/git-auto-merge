
class MessageBuilder{
    constructor(){}

    // static getMergeFailMsg($errorStack, $allFrontendTG){
    //     let _datetime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }),
    //         _msg = "";
    //     _msg += "Merge failed!\n=====================\n\n";
    //     for (let $i = 0; $i < $errorStack.length; $i++) {
    //         const _error = $errorStack[$i];
    //         _msg += `\u{1F4A5} <b>${_error['from']}</b> ----> <b>${_error['to']}</b> `;
    //         _msg = appendInChargeToMsg(_msg, _error, $allFrontendTG);
    //         _msg += '\n';
    //     }
    //     _msg += `\n=====================\n${_datetime}`
    //     return _msg;

    //     function appendInChargeToMsg($msg, $error, $allFrontendTG){
    //         const _isAllMemberInCharge = $error['inCharge'].length == 0;
    //         if(_isAllMemberInCharge){
    //             for (let $j = 0; $j < $allFrontendTG.length; $j++) {
    //                 const _inChargeCode = $allFrontendTG[$j]['o_key'],
    //                       _inChargeChatId = $allFrontendTG[$j]['mchatId'];
    //                 $msg += `<a href="tg://user?id=${_inChargeChatId}">@${_inChargeCode}</a> `
    //             }
    //         }else{
    //             for (let $j = 0; $j < $error['inCharge'].length; $j++) {
    //                 const _inChargeCode = $error['inCharge'][$j],
    //                       _inChargeChatId = $error['inChargeId'][$j];
    //                 $msg += `<a href="tg://user?id=${_inChargeChatId}">@${_inChargeCode}</a> `
    //             }
    //         }
    //         return $msg;
    //     }
    // }

    static getMergeFailMsg($mergeErrors, $allFrontendTG){
        let _datetime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }),
            _msg = "";
        _msg += "<b>Merge failed!</b>\n————————————\n";
        for (let $i = 0; $i < $mergeErrors.length; $i++) {
            const _error = $mergeErrors[$i];
            _msg += `\u{1F4A5} <b>${_error['mParentBranch']}</b> ----> <b>${_error['mBranchName']}</b>\n\n`;
            // _msg += `<b>Commit: </b>${_error['mMergeFailCommitMsg']}\n\n`
            _msg += `<b>In Charge: </b>`
            _msg = appendInChargeToMsg(_msg, _error, $allFrontendTG);
            _msg += '\n————————————';
        }
        _msg += `\n${_datetime}`
        return _msg;

        function appendInChargeToMsg($msg, $error, $allFrontendTG){
            let _inCharge = JSON.parse($error['mInCharge']),
                _isAllMemberInCharge = _inCharge.length == 0;
            if(_isAllMemberInCharge){
                for (let $j = 0; $j < $allFrontendTG.length; $j++) {
                    const _inChargeCode = $allFrontendTG[$j]['o_key'],
                          _inChargeChatId = $allFrontendTG[$j]['mchatId'];
                    $msg += `<a href="tg://user?id=${_inChargeChatId}">@${_inChargeCode}</a> `
                }
            }else{
                for (let $j = 0; $j < _inCharge.length; $j++) {
                    const _inChargeCode = _inCharge[$j],
                          _inChargeChatId = getChatIdByCode(_inChargeCode, $allFrontendTG);
                    $msg += `<a href="tg://user?id=${_inChargeChatId}">@${_inChargeCode}</a> `
                }
            }
            return $msg;
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