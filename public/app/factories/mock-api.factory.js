'use strict';
(function(){
    
    angular
        .module('app.factory.module')
        .factory('mockApiService', Service);

    Service.$inject = ['$http', '$q', 'baseApiService'];
    function Service($http, $q, baseApiService){

        var _base_url = 'factories/json';
        var _headers = {'Content-Type' : 'application/json'};

        var services = {
            post: post,
            get: get
        }
        
        return services;
        
        //////////

        function post(target_json, data, custom_headers){
           return get(target_json);
        }
        
        function get(target_json){
            var _deferred = $q.defer();
            $http.get(_base_url + target_json).then(
                function(result){
                    baseApiService.success(_deferred, result, true);
                }, 
                function(result){
                    baseApiService.fail(_deferred, result, true);
                })
                .catch(function(result){
                    baseApiService.error(_deferred, result, true);
                });
            return _deferred.promise;            
        }        

    }

})();