'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('patientMessageList', {
            templateUrl : 'components/patient-message-list/patient-message-list.component.html',
            bindings : {
                initialStatus : '=',
            },
            controller : Controller
    });

    Controller.$inject = [
                            '$routeParams', 
                            'tableConfig', 'defaultParam', 
                            'mockApiService', 'mhpApiService',
                            'timeService'
                            ];
    function Controller(
                            $routeParams, 
                            tableConfig, defaultParam, 
                            mockApiService, mhpApiService,
                            timeService
                        ){
        var vm = this;
        // console.log(vm);
        /*-variables-*/
        vm.patientId = $routeParams.patientId;
        vm.tableConfig = tableConfig;        
        vm.query = { order : '-eventDate', limit: tableConfig.defaultRowCount, page: 1 };
        vm.search_processed = false;
        vm.filter_by_status = '';
        vm.query_promise;
        vm.messages = [];

        /*-end-*/

        /*-functions-*/
        vm.updateMessages = updateMessages;
        vm.isEmpty = isEmpty;
        /*- end -*/


        activate();

        ///////

        function activate(){

            if ( vm.initialStatus )
                vm.filter_by_status = vm.initialStatus;
            //set initial filter
            updateMessages();
        }

        /**
         * Process on success get email
         */
        function onSuccessUpdateMessages(_result){
            var _notification_bases = _result.notificationBases;

            var _notifications = [];
            _.each(_notification_bases, function(_notification_base){ //get all notifications from notification_bases;
                vm.search_processed = true;                
                //get latest only, based on last lastModifiedDate on notifications object
                // var _notification = _.max(_notification_base.notifications, function(_notification){
                //     return new Date(_notification.lastModifiedDate).getTime();
                // });

                // if ( _notification ){
                //     _notification.notification_base_id = _notification_base.id;
                //     _notification.subject = _notification_base.subject;
                //     _notification.description = _notification_base.description;
                //     _notification.startDate = _notification_base.startDate;
                //     _notification.endDate = _notification_base.endDate;

                //     _notifications.push(_notification);
                // }                

                //get all
                _.each(_notification_base.notifications, function(_notification){
                    //set parent value here
                    _notification.subject = _notification_base.subject;
                    _notification.description = _notification_base.description;
                    _notification.startDate = _notification_base.startDate;
                    _notification.endDate = _notification_base.endDate;

                    _notification.response_type_label = 'New';
                    if ( _notification.responseType == 0 ) {
                        _notification.response_type_label = 'Acknowledged';
                    } if ( _notification.responseType == 1 ) {
                        _notification.response_type_label = 'Dismissed';
                    }     

                    _notifications.push(_notification);
                });                
            });
            vm.messages = _notifications;

            // UTC to local time
            timeService.toLocalDate(vm.messages, ['eventDate', 'deliverydDate']);
            return _notifications;
        }

        function updateMessages(){
            vm.search_processed = false;
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

             vm.query_promise = mhpApiService.get(_url + _request_param, {}, true).then(onSuccessUpdateMessages);
            // vm.query_promise = mockApiService.post('/sample-messages.json').then(onSuccessUpdateMessages);
        }

        function isEmpty(str){
            return ( !str || str == '' )
        }
    }

})();