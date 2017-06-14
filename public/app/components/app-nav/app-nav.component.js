'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('appNav', {
            templateUrl : 'components/app-nav/app-nav.component.html',
            controller : Controller
    });

    Controller.$inject = ['config'];
    function Controller(config){

        var vm = this;

        vm.appVersion = config.version;
        vm.buildDate = config.build_date;

        activate();

        ///////

        function activate(){
        }

    }

})();