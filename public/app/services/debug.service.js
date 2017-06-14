'use strict';
/********************************************
 * 
 *********************************************/
(function(){
    
    angular
        .module('app.service.module')
        .factory('debugService', Service);

    Service.$inject = [ 
                        'internalStorageService',
                        'config'
                        ];
    function Service(   
                       internalStorageService, 
                       config
                    ){

                    
        var storage_name_debug_mode = 'is-debug-mode';
        var storage_name_direct_api_access = 'is-direct-api-access';      

        var status = {
            is_direct_api_access : null, 
            is_debug_mode : null
        };

        initialize();
        //

        var _services = {
            setDebugMode : setDebugMode,
            isDebugMode : isDebugMode,
            setDirectAPIAccess : setDirectAPIAccess,
            isDirectAPIAccess : isDirectAPIAccess,
            status : status
        };

        return _services;

        /////////
        /**
         * 
         * _value - boolean
         */
         function initialize(){
            isDebugMode();
            isDirectAPIAccess();
         }
        
        function setDebugMode(_value){
            status.is_debug_mode =  _value == true;            
            internalStorageService.store(storage_name_debug_mode, status.is_debug_mode);
        }

        /**
         * 
         * return boolean
         */
        function isDebugMode(){
            if ( !config.debug ) //if config is not debug
                return false;

            if ( status.is_debug_mode == null ){
                 status.is_debug_mode = internalStorageService.retrieve(storage_name_debug_mode);
                 if ( status.is_debug_mode == null || status.is_debug_mode == undefined ) {
                    status.is_debug_mode = false; //default;
                    setDebugMode(status.is_debug_mode);
                 }
            }

            status.is_debug_mode = status.is_debug_mode == 'true' || status.is_debug_mode == true;

            return status.is_debug_mode;
        }

        /**
         * 
         * _value - boolean
         */
        function setDirectAPIAccess(_value){
            status.is_direct_api_access =  _value == true;            
            internalStorageService.store(storage_name_direct_api_access, status.is_direct_api_access);
        }

        /**
         * 
         * return boolean
         */
        function isDirectAPIAccess(){
            if ( status.is_direct_api_access == null ){
                 status.is_direct_api_access = internalStorageService.retrieve(storage_name_direct_api_access);
                 if ( status.is_direct_api_access == null || status.is_direct_api_access == undefined ) {
                    status.is_direct_api_access = false; //default;
                    setDirectAPIAccess(status.is_direct_api_access);
                 }
            }
            return status.is_direct_api_access == 'true' || status.is_direct_api_access == true;
        }

        
    }

})();