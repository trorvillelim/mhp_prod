'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('sessionTimeout', {
            controller : Controller
    });

    Controller.$inject = [  
                            '$scope', '$mdDialog', '$location', 
                            'Idle', 
                            'mhpApiService', 'runIntervalService', 
                            'sessionTimeoutConfig', 
                        ];
    function Controller(
                            $scope, $mdDialog, $location, 
                            Idle, 
                            mhpApiService, runIntervalService, 
                            sessionTimeoutConfig
                        ){

        var vm = this;

        vm.showDialog = showDialog;

        $scope.$on('IdleStart', IdleStart);
        $scope.$on('IdleEnd', IdleEnd);
        $scope.$on('IdleTimeout', IdleTimeout);

        //ADD on change route
        $scope.$on('$locationChangeSuccess', activate);

        //////////

        function activate(){
             mhpApiService.isLoggedIn().then(
                 function(){
                     start();
                 }, 
                 function(){
                     stop();
                 }
             );            
        }

        function start(){
            Idle.unwatch();
            Idle.watch();
        }

        function stop(){
            Idle.unwatch();
        }

        function IdleStart() {
            mhpApiService.isLoggedIn().then(
                function(){
                    vm.showDialog();
                    console.log('(start session) logged in...');
                }, 
                function(){
                    console.log('(start session) not logged in...');
                }
            )
            document.title = "MHP";

        }

        function IdleEnd() {
            console.log('idle end...');
            document.title = "MHP";

        }

        function IdleTimeout() {
            mhpApiService.isLoggedIn().then(
                function(){
                    mhpApiService.logout().then(function(){
                        $location.path('/login');
                    });
                    console.log(' (idle timeout) idle timeout...');
                }, 
                function(){
                    console.log(' (idle timeout) not logged in...');           
                }
            );
            
            start();
            $mdDialog.hide();     
            document.title = "MHP";
                               
        }

        function showDialog(){

            $mdDialog.show({

                controller: DialogController,
                templateUrl: '/templates/dialog/session-timeout.template.html',
                clickOutsideToClose:false

            }).then(
                function() {
                    console.log('continue...');
                }, function() {
                    console.log('logout...');
                    IdleTimeout();
                }
            );

            DialogController.$inject = ['$scope', '$mdDialog'];
            function DialogController($scope, $mdDialog){

                var _countdown_interval = 'session-timeout-countdown-interval';
                $scope.countdown = sessionTimeoutConfig.timeout;
                $scope.signing_out = false;

                $scope.continue = resetSessionCounter;
                $scope.logout = logout;
                $scope.time = (sessionTimeoutConfig.idle / 60)

                $scope.logging_out = false;

                function resetSessionCounter(){
                   runIntervalService.stop(_countdown_interval);
                   $mdDialog.hide();
                }

                function logout(){
                    if ( $scope.logging_out ) //prevent double trigger
                        return;
                    $scope.logging_out = true;
                    runIntervalService.stop(_countdown_interval);
                    IdleTimeout();
                }

                runIntervalService.start(_countdown_interval, function(){

                    if ( $scope.countdown == 1 )
                        $scope.signing_out = true;
                    
                    if ( $scope.countdown <= 1 ){
                        $scope.logout();
                    } else {
                        $scope.countdown--;
                    }
                        
                }, 1000);

            }
        }

    }

})();