'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('login', {
            templateUrl : 'components/login/login.component.html',
            controller : Controller
    });

    Controller.$inject = [
                            '$interval', '$location', 
                            'mhpApiService', 'mhpInhouseApiService', 'mockApiService', 
                            'internalStorageService', 'countDownTimerService', 'sessionTimeoutService', 
                            'debugService'];
    function Controller(
                            $interval, $location, 
                            mhpApiService, mhpInhouseApiService, mockApiService, 
                            internalStorageService , countDownTimerService, sessionTimeoutService, 
                            debugService){
        var vm = this;

        vm.debug_count_on_click_logo = 0;
        vm.debug_count_on_click_logo_max = 5;
        vm.debug_count_interval = null;
        vm.debug_status = debugService.status;


        vm.loginValue = {};
        vm.loggingIn = false;
        vm.loginFailed = false;
        vm.landingPage = '/patient-list';
        vm.rememberMe = false;
        vm.emailRegex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;

        vm.onClickLogo = onClickLogo;
        vm.onLogin = onLogin;
        // vm.onChangeRememberMe = onChangeRememberMe;

        activate();

        ///////
        function activate(){        
            vm.loginValue = {
                username : '',
                password : ''
            }

            // vm.rememberMe = internalStorageService.retrieve('rememberMe') == 'true';
        }

        function onClickLogo(){

            if ( vm.debug_count_interval ) 
                $interval.cancel(vm.debug_count_interval);

            vm.debug_count_interval = $interval(function(){
                vm.debug_count_on_click_logo = 0;
                $interval.cancel(vm.debug_count_interval);
            }, 500);

            vm.debug_count_on_click_logo++;
            if ( vm.debug_count_on_click_logo >= vm.debug_count_on_click_logo_max ){
                vm.debug_count_on_click_logo = 0;                
                if ( debugService.isDebugMode() )
                    debugService.setDebugMode(false);
                else
                    debugService.setDebugMode(true);
            }
        }

        function onLogin(){
            document.title = "MHP";

            vm.loginFailed = false;
            vm.loggingIn = true;
            mhpApiService.authenticate(vm.loginValue.username, vm.loginValue.password, vm.rememberMe).then(function(result){
                var _redirect_url = $location.search().r;
                if (  _redirect_url ) {
                    $location.search({}); //empty request params
                    $location.path(_redirect_url);
                } else {
                    $location.path(vm.landingPage);
                }
            }, function(result){
                vm.loginFailed = true;
                vm.loggingIn = false;
            });
          
        }

    }

})();