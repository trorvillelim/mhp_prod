'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('patientProfileContainer', {
            templateUrl : 'components/patient-profile-container/patient-profile-container.component.html',
            controller : Controller
    });

    Controller.$inject = [  '$scope',
                            '$location', '$routeParams', 
                            'defaultParam', 'intervalsConfig', 
                            'mhpApiService', 'mhpInhouseApiService', 'runIntervalService', 'cacheVariableService'];
    function Controller(    $scope,
                            $location, $routeParams, 
                            defaultParam, intervalsConfig, 
                            mhpApiService, mhpInhouseApiService, runIntervalService, cacheVariableService){
        var vm = this;
        vm.view = "dashboard";//default
        vm.patientId = $routeParams.patientId;
        vm.target_views = [ 'dashboard', 'profile', 'recommendation', 
                            'notification', 'bp_measurements', 'patient_review_log', 
                            'alert_notification', 'messages_new', 'messages_acknowledged',
                            'messages_dismissed', 'patient_file_container', 'patient-medication-container'];

        vm.message_view_types = {   'messages_new' : 'New',
                                    'messages_acknowledged' : 'Acknowledged',
                                    'messages_dismissed' : 'Dismissed'};
        vm.message_view_type = '';
                                    
        vm.patient_details;
        vm.user_id;
        vm.messages_count = { new_messages : 0, acknowledged_messages : 0,dismissed_messages : 0 };
        
        // screen size workaround for badge overlapping
        listenToBrowserScreen();

        //auto logs
        vm.views_with_auto_logs = [ {view: 'notification', value: '3', name : 'Notifications' },
                                    {view: 'messages_new', value: '0', name : 'Notifications' },
                                    {view: 'messages_acknowledged', value: '0', name : 'Notifications' },
                                    {view: 'messages_dismissed', value: '0', name : 'Notifications' },
                                    {view: 'patient_drugs', value: '1', name : 'Patient Drugs' },
                                    {view: 'bp_measurements', value: '2', name : 'BP Measurements' },
                                    {view: 'recommendation', value:  '3', name : 'Recommendations' },
                                    {view: 'patient-medication-container', value:  '3', name : 'Medication' },
                                    {view: 'profile', value:  '3', name : 'Profile' }



        ];

        //interval configs                                    
        vm.auto_update_messages_count = { name : 'auto-update-messages-count', time_in_millis : intervalsConfig.auto_log_patients_view };                                    
        vm.auto_log_interval_config = { name : 'auto-log-views-for-patient', time_in_millis : intervalsConfig.auto_update_patients_messages_counts };
        vm.record_time_per_auto_log_in_millis = 3;
        vm.current_auto_log_interval_name = null;
        
        //functions
        vm.updateView = updateView;
        vm.updateMessageTypeBasedonView = updateMessageTypeBasedonView;

        //$scope specifics
        $scope.$on('$routeChangeStart', routeChangeStart);        

        activate();

        ///////

        function listenToBrowserScreen(){
            vm.screenWidth = window.innerWidth;
            window.onresize = function(event){
                vm.screenWidth = window.innerWidth;
            }
        }


        function activate(){
            updateViewOnLoad();

            // vm.patient_details = {
            //     formalName : ''
            // }

            vm.patientFullName = "";

            getPatientDetails();
            updateMessagesCount();
           // autoUpdateMessagesCount();
        }

        function updateViewOnLoad(){
            var _target_view = $routeParams.type;
            updateView(_target_view);
        }

        function updateView(target_view){
            if (vm.target_views.indexOf(target_view) > -1 && target_view != vm.view) {
                vm.view = target_view;

                //comment out to remove changing of url
                $location.path('/patient/' + target_view + '/' + vm.patientId);
            }
            autoLogBasedOnViews(target_view);
            updateMessageTypeBasedonView(target_view);
        }

        /***********************************
         * Trigger auto update for 
         *  - Recommendations
         *  - Notifications
         *  - BP Measurements
         *  - Patient Review Log Details
         *  - Profile
         *  - Medication and Notes
         ************************************/
        function autoLogBasedOnViews(target_view){
            var _path = $location.path();
            
            if ( !vm.current_auto_log_interval_name !=  vm.auto_log_interval_config.name + '-' + target_view + '-' + vm.patientId) {
                runIntervalService.stop(vm.current_auto_log_interval_name); //delete any intervals
                vm.current_auto_log_interval_name = vm.auto_log_interval_config.name + '-' + target_view + '-' + vm.patientId;
            }
            

            var _logs_view = null;
            _.each(vm.views_with_auto_logs, function(_view){
                if ( target_view.indexOf(_view.view) > -1 ){
                    _logs_view = _view;
                }
            });
            
            if ( _logs_view && vm.patientId) {
                var _log_body = {
                    PatientUserId : vm.patientId,
                    PageReviewed : _logs_view.name,
                    Status : '1',
                    UserId : '',
                    Duration : vm.record_time_per_auto_log_in_millis,
                    Note : '[auto-log]',
                    View : target_view
                };
                runIntervalService.start(vm.current_auto_log_interval_name, function(){          
                    mhpApiService.getUserId().then(function(userId){
                        _log_body.UserId = userId;
                       
                        return  mhpInhouseApiService.post('/api/LogTime', _log_body);
                    })
                    .then(function(result){
                        console.log('successfully done auto update ( ' + _logs_view.name + ' )');
                    }, 
                    function(err){
                        console.log('auto updated failed', err);
                    });                                  
                }, vm.auto_log_interval_config.time_in_millis, true);
            }                
        }

        /******************************************
         * When route changes, trigger this
         *******************************************/
        function routeChangeStart(){ //reset on change view
            if ( vm.current_auto_log_interval_name )
                runIntervalService.stop(vm.current_auto_log_interval_name); //delete any intervals

            runIntervalService.stop(vm.auto_update_messages_count.name); //delete any intervals            
        }

        /******************************************
         * Get patients details
         ******************************************/
        function getPatientDetails(userId){
            var _url = '/api/GetMePhysicianPatientV2';
            var _request_param = '?patientUserId=' + vm.patientId + 
                            '&startDate=' + defaultParam.startDate +
                            '&endDate=' + defaultParam.endDate +
                            '&bCondition=false' + 
                            '&bBpm=false' + 
                            '&bNotification=false' + 
                            '&bRecommendation=false' + 
                            '&bDrug=false' + 
                            '&bPhysician=false' +
                            '&bRA=false'+
                            '&bReviewLog=false';

            mhpApiService.get(_url + _request_param, {}, true).then(function(result){
                vm.patient_details = result.user;
                vm.patientFullName = result.user.lName + ", " +result.user.fName
            }, function(result){
                console.log('mhpApiService error', result);
            });
        }

        /******************************************************
         * Update Messages Count
         ******************************************************/
        function updateMessagesCount(){
            var _cache_variable = 'patient-messages-count-' + vm.patientId;
            var _cached_messages_count = cacheVariableService.get(_cache_variable);

            if ( _cached_messages_count !== vm.messages_count && _cached_messages_count ) {
                angular.copy(_cached_messages_count, vm.messages_count);
            }

            var _url = '/api/GetMePhysicianPatientV2';
            var _request_param = '?patientUserId=' + vm.patientId + 
                            '&startDate=' + defaultParam.startDate +
                            '&endDate=' + defaultParam.endDate +
                            '&bCondition=false' + 
                            '&bBpm=false' + 
                            '&bNotification=true' + 
                            '&bRecommendation=false' + 
                            '&bDrug=false' + 
                            '&bPhysician=false' +
                            '&bRA=false'+
                            '&bReviewLog=false';

             mhpApiService.get(_url + _request_param, {}, true)
                .then(function(_result){
                    var _notification_bases = _result.notificationBases;
                    var _notifications = [];
                    _.each(_notification_bases, function(_notification_base){
                        //get last updated notification
                        _.each(_notification_base.notifications, function(_notification){
                            if ( _notification.responseType != 2) /*not kill*/
                            _notifications.push(_notification);
                        });                           
                    });
                    
                    vm.messages_count.new_messages =  _.where(_notifications, {responseType:null}).length;
                    vm.messages_count.acknowledged_messages =  _.where(_notifications, {responseType:0}).length;
                    vm.messages_count.dismissed_messages =  _.where(_notifications, {responseType:1}).length;
                    cacheVariableService.save(_cache_variable, vm.messages_count) 
                });
        }

        /******************************************************
         * Auto Update Messages Count
         ******************************************************/
        function autoUpdateMessagesCount(){
            runIntervalService.stop(vm.auto_update_messages_count.name); //delete any intervals
            runIntervalService.start(vm.auto_update_messages_count.name, function(interval_info){
                updateMessagesCount();                                      
            }, vm.auto_update_messages_count.time_in_millis)
                .then(
                    function(message){ console.log('auto update', message); },
                    function(err){ console.log('fail set interval', err); }
                );
        }

        /******************************************************
         * Update Message view type to auto select
         * messages
         ******************************************************/
        function updateMessageTypeBasedonView(target_view){
            var _message_view_type = vm.message_view_types[target_view];
             if ( _message_view_type )
                vm.message_view_type = _message_view_type;
        }
    }

})();