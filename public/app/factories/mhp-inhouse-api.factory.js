'use strict';
(function(){
    
    angular
        .module('app.factory.module')
        .factory('mhpInhouseApiService', Service);

    Service.$inject = ['$http', '$q','config', 'baseApiService'];
    function Service($http, $q, config, baseApiService){

        //custom
        var _base_headers = {
            "Content-Type" : "application/json"
        };

        var services = {
            post: post,
            get: get,
            getPatientIntegerId :  getPatientIntegerId
        }
        
        return services;
        
        //////////
      
        /**
         * Do POST requests
         */
        function post(api, data, custom_headers){
            var _url = config.mhp_inhouse_api_url + api;
            return baseApiService.post(_url, data, _base_headers, custom_headers);
        }

        /**
         * Do GET requests
         */
        function get(api, custom_headers){
            var _url = config.mhp_inhouse_api_url + api;
            return baseApiService.get(_url, _base_headers, custom_headers);
        }

        /**
         * Temporary, this is a work around
         */
        function getPatientIntegerId(patientUserId, custom_headers){
            var _url = config.mhp_inhouse_api_url + '/api/getPatientIntId';
             return baseApiService.post(_url, {patientUserId : patientUserId}, _base_headers, custom_headers);
        }

    }

})();