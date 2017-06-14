'use strict';
(function(){
    
    angular
        .module('app.factory.module')
        .factory('baseApiService', Service);

    Service.$inject = ['$http','$q'];
    function Service($http, $q){

        var services = {
            post : post,
            get : get,
            success: success,
            fail: fail,
            error : error,
            mergeHeaders : mergeHeaders
        }
        
        return services;
        
        /////////

        /**
         * POST
         */
        function post(_url, data, main_headers, custom_headers){
            var _config = { headers : main_headers };

            //use custom headers & merge to default headers
             _config.headers =  (!!custom_headers && custom_headers instanceof Object) ? services.mergeHeaders(_config.headers, custom_headers) : _config.headers; 
            
            var _deferred = $q.defer();

            //do extra processing once responded
            $http.post(_url, data, _config).then(
                function(result){
                    services.success(_deferred, result, false);
                }, 
                function(result){
                    services.fail(_deferred, result, false);
                })
                .catch(function(result){
                    services.error(_deferred, result, true);
                }); 

            return _deferred.promise;                     
        }

        /**
         * GET 
         */
        function get(_url, main_headers, custom_headers){

            var _config = { headers : main_headers };

            //use custom headers & merge to default headers
             _config.headers =  (!!custom_headers && custom_headers instanceof Object) ? services.mergeHeaders(_config.headers, custom_headers) : _config.headers; 
            
            //do extra processing once responded
            var _deferred = $q.defer();
                $http.get(_url, _config).then(
                    function(result){
                        services.success(_deferred, result, false);
                    }, 
                    function(result){
                        services.fail(_deferred, result, false);
                    })
                    .catch(function(result){
                        services.error(_deferred, result, true);
                    });

            return _deferred.promise;      
        }        

        function success(_deferred, result, debug){
            if ( debug )
                console.log('success', result);
            return _deferred.resolve(result.data);
        }

        function fail(_deferred, result, debug){
            if ( debug )
                console.log('fail', result);
            return _deferred.reject(result);
        }

        function error(_deferred, result, debug){
            if ( debug )
                console.log('error', result);
            return _deferred.reject(result);
        }

        function mergeHeaders(mainHeaders, customHeaders) {
            var _merge_headers = {};
            for (var i in mainHeaders) 
                _merge_headers[i]=mainHeaders[i];
            for (var i in customHeaders) 
                _merge_headers[i]=customHeaders[i];     
            return _merge_headers;           
        }

    }

})();