'use strict';
(function(){

  angular
        .module('app', [   
            'ngRoute',
            'ngMessages',            
            'ngMaterial',
            'material.components.expansionPanels',
            'md.data.table',
            'ngCookies',
            
            'app.factory.module',
            'app.service.module', 
            'app.dataservice.module', 
            'app.component.module',
            'app.filter.module',
            'app.constant.module',
            'chart.js',
            'ADM-dateTimePicker',
            '$idle',
            'filterService',
            'daterangepicker',
            'bpListService',
            'ngFileUpload',
            'countDownService',
            'ngIdle',
            'LocalStorageModule'
        ])
        .run(initialize);
    //////////////

    initialize.$inject = ['$rootScope' ];
    function initialize($rootScope ){
 
        //Workaround for material design light :(
        $rootScope.$on('$viewContentLoaded', function(){
            setTimeout(function(){
                componentHandler.upgradeAllRegistered();
            }, 500);
        });
    }

})();

