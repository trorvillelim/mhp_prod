'use strict';
(function(){
    
    angular
        .module('app.factory.module')
        .factory('sampleService', SampleService);

    SampleService.$inject = ['$q'];
    function SampleService($q){

        var services = {
            samplePromise: samplePromise,
            getLoggedInUserInfo : getLoggedInUserInfo
        }
        
        return services;
        
        //////////

        /**
         * Create sample promise
         */
        function samplePromise(name){
            var deferred = $q.defer();

            setTimeout(function() {
                deferred.notify('About to greet ' + name + '.');
                if (!!name) {
                    deferred.resolve('Hello, ' + name + '!');
                } else {
                    deferred.reject('Hello Carabao!');
                }
            }, 1000);

            return deferred.promise;                 
        }

        /**
         * Simulate getting logged user info
         * and will wait for 2 secs before it will 
         * return
         */
        function getLoggedInUserInfo(isUserLoggedInFlag){
            var deferred = $q.defer();
            var _sample_user = {
                id : 1,
                firstname : 'john',
                lastname : 'doe'
            }

            setTimeout(function() {
                deferred.notify('Processing Logged in user...');
                if (!!isUserLoggedInFlag) { //is logged in and token is ok
                    deferred.resolve(_sample_user);
                } else { //not logged in
                    deferred.reject(null);
                }
            }, 2000);

            return deferred.promise;                
        }
    }

})();