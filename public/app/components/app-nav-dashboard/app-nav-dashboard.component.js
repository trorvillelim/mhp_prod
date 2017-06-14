'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('appNavDashboard', {
            templateUrl : 'components/app-nav-dashboard/app-nav-dashboard.component.html',
            controller : Controller
    });

    Controller.$inject = [  '$rootScope', '$location', 
                            'mockApiService', 'mhpApiService','mhpInhouseApiService',
                            'runIntervalService',  
                            'cacheVariableService', 'defaultParam', 
                            'intervalsConfig'];
    function Controller(    $rootScope, $location, 
                            mockApiService, mhpApiService, mhpInhouseApiService,
                            runIntervalService,  
                            cacheVariableService, defaultParam, 
                            intervalsConfig){

        var vm = this;
        
        vm.patient = "";
        vm.searchPatient = searchPatient;
        vm.cache_variable_notifications = 'app-cache-update-notifications';
        vm.cache_variable_notifications_have_not_looked = 'app-cache-update-notifications-have-not-looked';
        vm.notifications = {
            monitored : 0,
            required_attention : 0,
            under_control : 0,
            have_not_looked: 0,
            no_data_for_days : 0,
        };
        vm.interval_config = {
            update_notification_count : {
                time_in_millis : intervalsConfig.auto_update_patients_counts,
                todo : updateNotificationCounts
            }
        }
        
        $rootScope.$on('app-nav-dashboard.component.updateNotificationCounts', updateNotificationCounts);

        activate();

        ///////

        function activate(){
            mhpApiService.isLoggedIn().then(function(){
                updateFromAppCache();
                updateNotificationCounts();
                startAutoUpdateInterval();
            });
        }

        /**
         * Check if has cached notifications 
         */
        function updateFromAppCache(){
            var _cached_notifications = cacheVariableService.get(vm.cache_variable_notifications);
            var _cached_notifications_have_not_looked = cacheVariableService.get(vm.cache_variable_notifications_have_not_looked);
            if ( _cached_notifications ){
                angular.copy(_cached_notifications, vm.notifications);
            }
            if ( _cached_notifications_have_not_looked ){
                vm.notifications.have_not_looked = _cached_notifications_have_not_looked;
            }
        }

        /*******************************************************
         * Update Notification Counts
         *******************************************************/
        function updateNotificationCounts(){
            var _request_params = '?startDate=' + defaultParam.startDate + '&endDate=' + defaultParam.endDate;
            mhpApiService.get('/api/GetMePhysicianALVMPatients' + _request_params, {}, true).then(function(result){
                vm.notifications.monitored = _.where(result, {bMonitored : true}).length;
                vm.notifications.required_attention = _.where(result, {bRequireAttention : true}).length;
                vm.notifications.under_control = _.where(result, {bUnderControl : true}).length;
                vm.notifications.no_data_for_days = _.where(result, {bNotActive : true}).length;

                cacheVariableService.save(vm.cache_variable_notifications, vm.notifications); //cache
            });
            //get not reviewed patients count
            mhpApiService.getUserId().then(function(userId){
                if ( userId ) {
                    mhpInhouseApiService.post('/api/GetPatientNotReviewed', {"PhysicianUserId" : userId}).then(function(result){
                        if ( result && result.message && result.message instanceof Array){
                            vm.notifications.have_not_looked = result.message.length;
                            cacheVariableService.save(vm.cache_variable_notifications_have_not_looked, vm.notifications.have_not_looked);//cache
                        }
                    });
                }
            });
        }        

        function searchPatient(){
            $location.path('/patient-list/search?q=' + vm.patient);
            vm.patient = '';
        }

        /************************
         * Auto Update Counts
         ************************/
        function startAutoUpdateInterval(){
            runIntervalService.start('auto-update-notification-counts', 
                vm.interval_config.update_notification_count.todo, 
                vm.interval_config.update_notification_count.time_in_millis).then(
                    function(message) {console.log(message)},
                    function(error) {console.log(error)}
            );                     
        }

    }

})();