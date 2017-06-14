'use strict';
(function(){

    /**
     * SET CONFIGURATIONS
     */
    var _app_configs = {
        version : '0.2',
        build_date : '20170307',
        mhp_inhouse_api_url : "", //will use current location
        mhp_api_url : "external",
        mhp_api_file_url : 'external-file-upload',
        mhp_api_url_direct : 'https://dev.mhealthpharma.com',
        mhp_api_direct_access : false,        
        debug : false
    };

    var _session_timeout_configs = {
        idle : 900,
        timeout : 120,
        interval : 30
    }

    /**
     * Update Config based on environment 
     */
    var _current_url = window.location.hostname;
    var _dev_url = 'dev-doctor.';    
    var _stage_url = 'stage-doctor.';
    var _prod_url = 'doctor.';
    if ( _current_url.indexOf(_dev_url) === 0 ){
       _app_configs.mhp_api_url_direct = 'https://dev.mhealthpharma.com';
       _app_configs.debug = false;
    } else if ( _current_url.indexOf(_stage_url) === 0 ){
      _app_configs.mhp_api_url_direct = 'https://stage.mhealthpharma.com';
      _app_configs.debug = false;
    } else if ( _current_url.indexOf(_prod_url) === 0 ){
      _app_configs.mhp_api_url_direct = 'https://prod.mhealthpharma.com';
      _app_configs.debug = false;
    }

    //will switch to direct access instead 
    //of Workaround access within doctors-ui API ('/external' && '/external-file-upload')
    if ( _app_configs.mhp_api_direct_access ){
        _app_configs.mhp_api_url = _app_configs.mhp_api_url_direct;
        _app_configs.mhp_api_file_url = _app_configs.mhp_api_url_direct;
    }

    /* - END Setting CONFIGURATIONS - */

    angular
        .module('app')
        .constant('config', _app_configs)
        .constant('sessionTimeoutConfig', _session_timeout_configs);
    //////////////

    /**
     * Session Timeout Config
     */
    angular
        .module('app')
        .config(SessionTimeoutConfig);

    SessionTimeoutConfig.$inject = ['IdleProvider', 'KeepaliveProvider'];
    function SessionTimeoutConfig(IdleProvider, KeepaliveProvider){
        IdleProvider.idle(_session_timeout_configs.idle);
        IdleProvider.timeout(_session_timeout_configs.timeout);
        KeepaliveProvider.interval(_session_timeout_configs.interval);
    };

})();

