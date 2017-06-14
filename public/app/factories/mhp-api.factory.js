'use strict';
(function(){
    
    /*
        User Info
    */
    angular
        .module('app.factory.module')
        .factory('mhpApiService', Service);
 
    Service.$inject = [
                        '$http', '$q',  '$cookies', 'config', 
                        'baseApiService', 'runIntervalService', 'debugService'];
    function Service(   
                        $http, $q, $cookies, config, 
                        baseApiService, runIntervalService, debugService
                    ){

        //cached contents
        var _cached = {
            userId : null,
            userInfo : null, 

            clear : function(){
                var _this = this;
                _this.userId = null;
                _this.userInfo = null;
            }
        }

        /**
         * Internal Token Storage manager
         */
        var tokenStorageManager = {
            id : 'mhp-access-token-v1.0',
            getToken : function(){
                var _this = this;
                return $cookies.getObject(_this.id);
            },
            storeToken : function(token, rememberMe){
                var _this = this;

                var _cookieConfig = {
                    path : "/"
                }

                //set expire date
                 var expireDate = new Date();
                     expireDate.setDate(expireDate.getDate() + 1);
                if ( rememberMe )
                    expireDate  = new Date(token['.expires']);

                _cookieConfig.expires = expireDate;

                $cookies.putObject(_this.id, token, _cookieConfig);
            },
            deleteToken : function(){
                var _this = this;
                var _cookieConfig = {
                    path : "/"
                }
                $cookies.remove(_this.id, _cookieConfig);
            }
        }    

        //custom header
        var _base_url = config.mhp_api_url;
        var _base_headers = {
            "Content-Type" : "application/json"
        };        

        //public services
        var services = {
            post: post,
            get: get,

            authenticate : authenticate,
            getAccessToken: getAccessToken,
            getAccessTokenInfo: getAccessTokenInfo,
            getUserId : getUserId,
            getLoggedUserInfo : getLoggedUserInfo,
            isLoggedIn : isLoggedIn,
            logout : logout
        }
        
        return services;
        
        //////////

        /**
         * Do POST requests
         */
        function post(api, data, custom_headers, with_auth_header){

            var _url =  _base_url;

            custom_headers = (custom_headers)?custom_headers:{};
            if ( with_auth_header ){
                return services
                        .getAccessToken()
                        .then(function(token){
                            custom_headers.Authorization = 'Bearer ' + token;
                            return baseApiService.post(_url + api, data, _base_headers, custom_headers);
                        });
            } else {
                return baseApiService.post(_url + api, data, _base_headers, custom_headers);    
            }
            
        }

        /**
         * Do GET requests
         */
        function get(api, custom_headers, with_auth_header){
            var _url =  _base_url;
            custom_headers = (custom_headers)?custom_headers:{};
            if ( with_auth_header ){
                return services
                        .getAccessToken()
                        .then(function(token){
                            custom_headers.Authorization = 'Bearer ' + token;
                            return baseApiService.get(_url + api, _base_headers, custom_headers);
                        });
            } else {            
                return baseApiService.get(_url + api, _base_headers, custom_headers);
            }
        }

        /**
         * Authenticate 
         */
        function authenticate(username, password, rememberMe){
            var _creds = 'grant_type=password&username='+username+'&password=' + password;
            
            //apply workaround
            if ( !config.mhp_api_direct_access ){
                _creds = {
                    creds : 'grant_type=password&username='+username+'&password=' + password
                }
            }

            var _deferred = $q.defer();
            var _url =  _base_url;

            baseApiService.post(_url + '/Token', _creds).then(
                function(_token){
                    tokenStorageManager.storeToken(_token, rememberMe); //store using manager
                    _cached.clear(); //clear cached contents       
                    _deferred.resolve(_token);
                },
                function(result){
                    _deferred.reject(result);
                }
            );   

            return _deferred.promise;
        }

        /**
         * Return Access Token
         */
        function getAccessToken(){
            var _deferred = $q.defer();
            var _token_info = tokenStorageManager.getToken();
            //do validations, like if token is expired
            if ( !!_token_info )
                _deferred.resolve(_token_info.access_token);
            else
                _deferred.reject(undefined);

            return _deferred.promise;            

        }

        function getAccessTokenInfo(){
            var _deferred = $q.defer();
            var _token = tokenStorageManager.getToken();
            //do validations, like if token is expired

            if ( _token )
                _deferred.resolve(_token);
            else
                _deferred.reject(reject);
                
            return _deferred.promise;            
        }

        /**
         * Check if user is logged in
         */
        function isLoggedIn(){
            var _deferred = $q.defer();
            services.getAccessToken().then(function(_token){
                if ( !_token ) 
                    return _deferred.reject('not logged in');
     
                services.getUserId().then(function(id){
                    return _deferred.resolve(id);   
                }, function(err){
                    return _deferred.reject(err);
                });

            }, function(_reason){
                _deferred.reject(_reason);
            });
            return _deferred.promise;            
        }

        /**
         * Remove token and any cached items
         */
        function logout(){
            var _deferred = $q.defer();
            try{
                services.post('/api/Account/Logout', {}, {}, true).then(function(){
                    tokenStorageManager.deleteToken(); //delete token
                    _cached.clear(); //clear cached user
                    runIntervalService.stopAll(); //clear all intervals
                    clearAllCookies(); 
                    _deferred.resolve("logged out");
                }, function(err){
                    _deferred.reject(err);
                });
            } catch (e) {
                _deferred.reject(e);
            }
            return _deferred.promise;
        }   

        function clearAllCookies(){
            var _cookies = $cookies.getAll();
            var _except = ['_ga'];
            angular.forEach(_cookies, function(v,k){
                if ( _except.indexOf(k) <= -1 )
                    $cookies.remove(k);
                
            });
        }

        /**
         * Get User Id from 
         * cache or via api
         */
        function getUserId(update){
            var _deferred = $q.defer();

            if ( _cached.userId && !update ) {
                _deferred.resolve(_cached.userId);
            } else {
                services.get('/api/GetMeUserId', {}, true)
                    .then(function(user_id){
                        _cached.userId = user_id;
                        _deferred.resolve(_cached.userId)
                    }, function(err){
                        _deferred.reject(err);
                    });
            }
            return _deferred.promise;
        }

        /**
         * Get User Info from 
         * cache or via api
         */
        function getLoggedUserInfo(update){
            var _deferred = $q.defer();
            if (  _cached.userInfo && !update ) {
                _deferred.resolve(_cached.userInfo);
            } else {
                services.getUserId()
                    .then(function(user_id){
                        var _url = '/api/GetMePhysicianV1';
                        return services.get(_url, {}, true);
                    }, function(err){
                        _deferred.reject(err);
                    }).then(function(userInfo){
                        _cached.userInfo = userInfo;
                        _deferred.resolve(_cached.userInfo);
                    }, function(err){
                        _deferred.reject(err);
                    });  
            }
            return _deferred.promise;         
        }     

    }

})();