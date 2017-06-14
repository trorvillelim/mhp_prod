'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('appNavUserInfo', {
            templateUrl : 'components/app-nav-user-info/app-nav-user-info.component.html',
            controller : Controller
    });

    Controller.$inject = ['$location','mhpApiService', '$rootScope', 'cacheVariableService'];
    function Controller($location, mhpApiService, $rootScope, cacheVariableService){

        var vm = this;
        
        vm.userInfo;

        vm.openMenu = openMenu;
        vm.logout = logout;
        vm.updateUserInfo = updateUserInfo;
        vm.changePassword = changePassword;

        activate();

        $rootScope.$on('app-nav-user-info.component.updateUserInfo', updateUserInfo);

        ///////

        function activate(){
            getUserInfo();
        }

        function openMenu($mdOpenMenu, ev) {
            $mdOpenMenu(ev);
        };

        function logout(){
            mhpApiService.logout().then(function(result){
                cacheVariableService.reset(); //remove all cached content
                $location.path('/login');
            });            
        }

        function getUserInfo(){
            mhpApiService.getLoggedUserInfo().then(function(result){
                 vm.userInfo = result.user;
            });
        }

        function updateUserInfo(){
            mhpApiService.getLoggedUserInfo(true).then(function(result){
                 vm.userInfo = result.user;
            });
        }        
        
        function isCurrentLocation(target_location){
            var _location = $location.path();
            return ( target_location.indexOf(_location) == 0 );
        }
        
        function changePassword() {
            $location.url('/change-password');
        }

    }

})();