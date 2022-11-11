
class MessageBuilder{
    _CONFIG = {}

    constructor(){}

    getMergeConflictMsg($sourceBranch, $destinationBranch){
        let _datetime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' })
        return `Merge conflict!\n=====================\n\n<b>${$sourceBranch}</b> ----> <b>${$destinationBranch}</b>\n\n=====================\n${_datetime}`
    }
}

module.exports = MessageBuilder;