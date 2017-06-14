// 'use strict'; //DUE TO safari issue :(
(function(){
    
    angular
        .module('app.factory.module')
        .factory('runIntervalService', Service);

    Service.$inject = ['$q', '$interval', '$cookies'];
    function Service($q, $interval, $cookies){

        var _running_intervals = {};

        var _interval_manager = {
            update_last_run_interval : update_last_run_interval,
            is_allowed_to_run : is_allowed_to_run, 
            unregister : unregister, 
            cookie_options : {
                 path : "/" 
            }            
        };

        var services = {
            start:start,
            stop:stop,
            stopAll:stopAll
        }
        
        return services;
        
        //////////

        /***
         * Start
         *  - label
         *  - function_to_run
         *  - interval_in_millis
         *  - session_strict ( will restrict intervals, including tabs and new windows )
         */
        function start(label, function_to_run, interval_in_millis, session_strict){
            var _deferred = $q.defer();

            if (function_to_run instanceof Function == false) {
                _deferred.reject('should provide function to run');
            } else if ( !label || label == '') {
                _deferred.reject('label is required');
            } else if ( interval_in_millis > 0 == false ) {
                _deferred.reject('should provide intervals');
            } else {
                try {
                    var _running_interval = _running_intervals[label];
                    if ( !_running_interval ) {

                        //record
                        _running_intervals[label] = {
                            label : label,
                            interval_in_millis : interval_in_millis,
                        };                  

                        if ( session_strict ) {
                            function _interval_function(){
                                if ( _interval_manager.is_allowed_to_run(label) ){
                                    _interval_manager.update_last_run_interval(_running_intervals[label]);
                                    function_to_run();
                                } else {
                                    console.log('unable to run ' + label + ', please check if another tab or window is running same interval');
                                }
                            }                                  
                            _running_intervals[label].registered_interval = $interval(_interval_function, interval_in_millis);
                        } else {
                            _running_intervals[label].registered_interval = $interval(function_to_run, interval_in_millis);
                        }

                        _deferred.resolve(label + ' is now running every ' + interval_in_millis + ' milliseconds');
                    } else { //already running
                        _deferred.resolve(label + ' is already running for every ' + _running_interval.interval_in_millis + ' milliseconds');
                    }
                } catch (e){
                    _deferred.reject(e);
                }
            }
            return _deferred.promise;
        }

        function stop(label){
            var _deferred = $q.defer();
            var _running_interval = _running_intervals[label];

            try {
                if ( _running_interval ){
                    $interval.cancel(_running_interval.registered_interval);
                    delete _running_intervals[label];
                    _deferred.resolve(label + ' is cancelled');
                } else {
                    _deferred.resolve(label + ' not registered, it maybe deleted or not registered in the first place');
                }
            } catch ( e ) {
                 _deferred.reject(e);
            }

            return _deferred.promise;
        }

        function stopAll(){
            var _deferred = $q.defer();
            for ( var i in _running_intervals ){
                var _label = _running_intervals[i].label;
                //logs only
                stop(_label)
                    .then(
                        function(){console.log('cleared interval : ' + _label)},
                        function(){console.log('failed clear interval : ' + _label)}
                    );
                _interval_manager.unregister(_label);
            }
            _deferred.resolve('deleted');
            return _deferred.promise;            
        }


        /**
         *  - store current intervals last run date in $cookie
         */
        function update_last_run_interval(running_interval){
            running_interval.last_run_in_millis = new Date().getTime();
            $cookies.putObject(running_interval.label, running_interval, _interval_manager.cookie_options);
        }   

        /**
         * - check if allowed to run, based on stored interval on $cookie
         */
        function is_allowed_to_run(running_interval_label){
            var _stored_running_interval = $cookies.getObject(running_interval_label);
            if (!_stored_running_interval || _stored_running_interval.last_run_in_millis > 0 == false)
                return true;
            var _last_run_interval = (new Date().getTime() - _stored_running_interval.last_run_in_millis);

            var _max_interval_range = 200; //because interval not exactly set on expected value (if registered as 3000, usually _last_run_interval is 2900+)
            var _max_interval_millis = _stored_running_interval.interval_in_millis - _max_interval_range;
            return ( _last_run_interval >= _max_interval_millis );   
        }

        /**
         * - delete from storage $cookie
         */
        function unregister(running_interval_label){
            $cookies.remove(running_interval_label, _interval_manager.cookie_options);                      
        }
      
    }

})();