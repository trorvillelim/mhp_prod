'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('debugContainer', {
            templateUrl : 'components/debug-container/debug-container.component.html',
            controller : Controller
    });

    Controller.$inject = ['debugService', 'config'];
    function Controller(debugService, config){

        var vm = this;

        
        vm.debug_status = debugService.status;
        
        vm.direct_api_access = false;
        vm.onChangeDirectAPIAccess = onChangeDirectAPIAccess;
        vm.onClickClose = onClickClose;

        activate();

        ///////

        function activate(){
            vm.direct_api_access = debugService.isDirectAPIAccess();
        }

        function onChangeDirectAPIAccess(){
            if (vm.direct_api_access)
                console.log('API requests are now directly accessing ', config.mhp_api_url_direct)
            else
                console.log('API requests are returned to workaround implementation', window.location.origin + '/' + config.mhp_api_url);
            debugService.setDirectAPIAccess(vm.direct_api_access);    
        }

        function onClickClose(){
            debugService.setDebugMode(false);
        }

    }

})();