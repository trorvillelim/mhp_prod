'use strict';
(function(){
    
    angular
        .module('app.factory.module')
        .factory('sessionTimeoutService', Service);

    Service.$inject = ['$q', 'Idle'];
    function Service($q, Idle){

        var services = {
            start : start,
            stop : stop
        }
        
        // $scope.$on('IdleStart', IdleStart);
        // $scope.$on('IdleEnd', IdleEnd);
        // $scope.$on('IdleTimeout', IdleTimeout);

        return services;
        
        //////////

        function start(){
            Idle.watch();
        }

        function stop(){
            Idle.unwatch();
        }

        function IdleStart() {
            console.log('start...')
        }

        function IdleEnd() {
            console.log('idle end...');
        }

        function IdleTimeout() {
          console.log('idle timeout...');
        }

        function showDialog(){

        }

      
    }

})();