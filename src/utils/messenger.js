const chalk = require('chalk');
const readline = require('readline');

class Messenger {
    static _CONFIG = {
        "SECTION_OPEN_CLOSE_LENGTH": 50
    }

    static openClose($message) {
        const _targetMessageLength = Messenger._CONFIG.SECTION_OPEN_CLOSE_LENGTH,
            _curMessageLength = $message.length,
            _fillLength = (_targetMessageLength - _curMessageLength > 0) ? _targetMessageLength - _curMessageLength : 0,
            _fillBefore = Math.floor(_fillLength / 2),
            _fillAfter = Math.ceil(_fillLength / 2),
            _filledMessage = Array(_fillBefore).fill("=").join('') + $message + Array(_fillAfter).fill("=").join('');
        Messenger.print(_filledMessage);
    }
    static print($message, $clearLine) {
        const _currentDate = new Date(),
            _currentHour = String(_currentDate.getHours()).padStart(2, '0'),
            _currentMinute = String(_currentDate.getMinutes()).padStart(2, '0'),
            _currentSecond = String(_currentDate.getSeconds()).padStart(2, '0');
        let _suffix = '\n';
        Messenger.clearLine();
        if ($clearLine) _suffix = '\r';
        global.process.stdout.write(chalk.blue(`[${_currentHour}:${_currentMinute}:${_currentSecond}] ` + $message) + _suffix);
    }
    static error($title, $error) {
        Messenger.print(`**********${$title}**********`);
        Messenger.print($error);
        Messenger.print(`**********/${$title}**********`);
    }
    static log(...$message) {
        const _currentDate = new Date(),
            _currentHour = String(_currentDate.getHours()).padStart(2, '0'),
            _currentMinute = String(_currentDate.getMinutes()).padStart(2, '0'),
            _currentSecond = String(_currentDate.getSeconds()).padStart(2, '0');

        global.process.stdout.write(chalk.green(`[${_currentHour}:${_currentMinute}:${_currentSecond}] `));
        console.log.apply(console, $message);
    }
    static clearLine() {
        if (!process.stdout.clearLine) {
            readline.clearLine();
        } else {
            process.stdout.clearLine();
        }
    }
}

module.exports = Messenger;