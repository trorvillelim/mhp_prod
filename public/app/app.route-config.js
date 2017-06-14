'use strict';
(function(){

    angular
        .module('app')
        .config(Config);

    /* - test members DELETE when not used - */
    var _is_user_logged_in = true;
    /*- end test members -*/

    Config.$inject = ['$locationProvider', '$routeProvider' , '$idleProvider', '$keepaliveProvider'];
    function Config($locationProvider, $routeProvider  ,$idleProvider, $keepaliveProvider){
        $locationProvider.hashPrefix('!');

        /**
         * START
         * Track user in idle 
         */

        // // The keepalive ping will be sent every 30 seconds. 
        // $keepaliveProvider.setInterval(30);

        // // We will ping the following address to keep the session alive.
        // $keepaliveProvider.http("http://"+window.location.host); /// change URL
        
        // // Set the idle and timeout timers in seconds. 
        // // User is considered idle if AFK for 15 minutes  900S
        // $idleProvider.setIdleTime(900);
        // // User will timeout at the end of 15 mins after considered idle.  120S
        // $idleProvider.setTimeoutTime(120); 
        // // The $idle service will ping the specified URL (see $keepaliveProvider.http) to keep the session alive. 
        // $idleProvider.keepalive(true);

        /**
         * END
         * Track user in idle 
         */


        $routeProvider
            .when('/', {
                templateUrl: 'views/patient-list.view.html',
                resolve : {
                    loginRequired : loginRequired
                }                
            })
            .when('/home', {
                templateUrl: 'views/patient-list.view.html',
                resolve : {
                    loginRequired : loginRequired
                }                
            })
            .when('/login', {
                templateUrl: 'views/login.view.html',
                resolve : {
                    notAccessibleWhenLoggedIn : notAccessibleWhenLoggedIn
                }                    
            })    
            .when('/forgot-password', {
                templateUrl: 'views/forgot-password.view.html',
                resolve : {
                    notAccessibleWhenLoggedIn : notAccessibleWhenLoggedIn
                }
            })    
            .when('/patient-list/:type', {
                templateUrl: 'views/patient-list.view.html',
                resolve : {
                    loginRequired : loginRequired
                }                 
            })
            .when('/patient-list', {
                templateUrl: 'views/patient-list.view.html',
                resolve : {
                    loginRequired : loginRequired
                }                 
            })
            .when('/patient', {
                templateUrl: 'views/patient-profile-container.view.html',
                resolve : {
                    loginRequired : loginRequired
                }                 
            })
            .when('/patient/:type', {
                templateUrl: 'views/patient-profile-container.view.html',
                resolve : {
                    loginRequired : loginRequired
                }                 
            })
            .when('/patient/:type/:patientId', {
                templateUrl: 'views/patient-profile-container.view.html',
                resolve : {
                    loginRequired : loginRequired
                }                 
            })

            // -----
            .when('/required-logged-in-page', {
                template: '<h1>This is a private page!</h1>',
                resolve : {
                    loginRequired : loginRequired
                }
            })
            .when('/review-logs', {
                templateUrl: 'views/review-logs.view.html',
                resolve : {
                    isLoggedIn : isLoggedIn,
                    loginRequired : loginRequired
                }                  
            })  
            .when('/patient-review-log-list/:id', {
                templateUrl: 'views/patient-review-log-list.view.html',
                resolve : {
                    isLoggedIn : isLoggedIn,
                    loginRequired : loginRequired
                }                  
            })          
            .when('/sample-data-table', {
                template: '<sample-data-table></sample-data-table>'
            })
            .when('/404', {
                templateUrl: 'views/404.view.html',
                resolve : {
                    isLoggedIn : isLoggedIn
                }                   
            })
            .when('/under-construction', {
                templateUrl: 'views/underconstruction.view.html',
                resolve : {
                    isLoggedIn : isLoggedIn
                }                    
            })
            .when('/change-password', {
                templateUrl: 'views/change-password.view.html',
                resolve : {
                    isLoggedIn : isLoggedIn,
                    loginRequired : loginRequired
                }
            })
            .otherwise('/404');

    }

    ////////////


    /*
        Creating a sample service that will be used on resolves
    */
    sampleServiceResult.$inject = ['sampleService'];
    function sampleServiceResult(sampleService) {
        return sampleService.samplePromise('then');
    }

    /**
     * Check in resolve if user is logged in
     * if logged in then get info
     * if not, then redirect to login
     * 
     */
    loginRequired.$inject = ['$location','$q', 'mhpApiService'];
    function loginRequired($location, $q, mhpApiService) {

        var deferred = $q.defer();
        mhpApiService.isLoggedIn().then(function(){ 
            deferred.resolve(true);
        }).catch(function(error){
            deferred.reject(false);

            var _redirect_path = $location.path();
            var _redirect_url = '/login';

            if ( "/" !== _redirect_path ) //add redirect url
                return $location.path(_redirect_url).search({'r':_redirect_path});
            else
                return $location.path(_redirect_url);
        });

        return deferred.promise;                         
    }    

   /**
     * Not Accessible when logged in
     * if logged in then get info
     * if not, then redirect to login
     * 
     */
    notAccessibleWhenLoggedIn.$inject = ['$location','$q', 'mhpApiService'];
    function notAccessibleWhenLoggedIn($location, $q, mhpApiService) {

        var deferred = $q.defer();
        mhpApiService.isLoggedIn().then(function(){
            deferred.reject(true);
            return $location.path('/home'); 
        }).catch(function(error){
            deferred.resolve(false);
        });

        return deferred.promise;                         
    }     

    /**
     * Check in resolve if user is logged in
     * if logged in then get info
     * if not, then redirect to login
     * 
     */
    isLoggedIn.$inject = ['$location','$q', 'mhpApiService'];
    function isLoggedIn($location, $q, mhpApiService) {

        var deferred = $q.defer();
        mhpApiService.isLoggedIn().then(function(){ 
            deferred.resolve(true);
        }).catch(function(error){
            deferred.resolve(false);
        });

        return deferred.promise;                         
    }           

})();