class Event{
    _events = {}

    constructor(){
    }

    on($eventName, $callback, $context){
        let _self = this;
        _self._events[$eventName] = _self._events[$eventName] || [];
        _self._events[$eventName].push({callback: $callback, context: $context});
    }

    off($eventName, $callback){
        let _self = this;
        if(_self._events[$eventName]){
            for(let i = 0; i < _self._events[$eventName].length; i++){
                if(_self._events[$eventName][i].$callback === $callback){
                    _self._events[$eventName].splice(i, 1);
                    break;
                }                
            }
        }
    }

    async dispatch($eventName, $sendObj){
        let _self = this;
        if(!_self._events[$eventName]) return
        for(let i = 0; i < _self._events[$eventName].length; i++){
            let _eventObj = _self._events[$eventName][i],
                _callback = _eventObj.callback,
                _context = _eventObj.context;
            if(_context){
                await _callback.call(_context, $sendObj)
            } else {
                _callback($sendObj);
            }
        }
    }

    dispose(){
        let _self = this;
        Object.keys(_self._events).forEach(function($eventName) {
            for (let i = 0; i < _self._events[$eventName].length; i++){
                _self._events[$eventName].splice(i, 1);
            }
        })
    }
}

module.exports = Event;

// _self.instance._event.addEventListener('instanceEvent', _self.func_instanceEvent, _self);