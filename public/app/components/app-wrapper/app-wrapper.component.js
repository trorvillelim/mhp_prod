'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('appWrapper', {
            bindings: {
                withSidePanel : '<'
            },
            transclude: true,
            templateUrl : 'components/app-wrapper/app-wrapper.component.html',
            controller : Controller
    });

    Controller.$inject = ['$interval', 'config', 'debugService'];
    function Controller($interval, config, debugService){
        var vm = this;

        vm.debug = false;

        vm.debug_count_on_click_logo = 0;
        vm.debug_count_on_click_logo_max = 5;
        vm.debug_count_interval = null;
        vm.debug_status = debugService.status;
        
        vm.onClickLogo = onClickLogo;

        activate();

        ///////

        function activate(){
          vm.debug = config.debug;
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

    }

})();