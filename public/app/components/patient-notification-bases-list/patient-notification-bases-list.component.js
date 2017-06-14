'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('patientNotificationBasesList', {
            templateUrl : 'components/patient-notification-bases-list/patient-notification-bases-list.component.html',
            controller : Controller
    });

    Controller.$inject = [  '$scope',
                            'mhpApiService',
                            'tableConfig', 
                            '$location', 
                            'defaultParam', 
                            '$routeParams', 
                            '$filter',
                            'utilityService'
                        ];
    function Controller(    $scope,
                            mhpApiService, 
                            tableConfig, 
                            $location, 
                            defaultParam, 
                            $routeParams, 
                            $filter,
                            utilityService){
        var vm = this;

        vm.notifications = [];
        vm.query = {};
        vm.notification_to_view = {};
        vm.notification_to_view_copy = {};
        vm.show_details = false;
        vm.show_notification_list = false;
        vm.get_notifications;
        vm.patientId = $routeParams.patientId;
        vm.selected_notification_base = {};
        vm.notificationToView = {};
        vm.base_length = 0;

        vm.tableConfig = tableConfig;
        vm.updateNotifications = updateNotifications;
        vm.editClick = editClick;
        vm.deleteClick = deleteClick;
        vm.createNew = createNew;
        vm.showNotificationList = showNotificationList;
        vm.setSpecificNotificationData = setSpecificNotificationData;
        vm.process_updateNotifications = true;
        vm.patientIntId;
        vm.hasValueForNotifBase = false;

        activate();

        ///////

        function activate(){
            vm.query = {
                order : '-startDate',
                limit: vm.tableConfig.defaultRowCount,
                page: 1,
            };

            onShow()
        }

        function onShow() {
            $scope.$watch('$ctrl.show_details', function(onShowDetails){
                if (!onShowDetails){
                    updateNotifications(); // fetch data every time list is shown.
                }
            });
        }

        function updateNotifications(callback){
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
                            
            vm.notifications = [];
            vm.process_updateNotifications = true;
            vm.get_notifications = mhpApiService.get(_url + _request_param, {}, true).then(function(result){
                vm.notifications = result.notificationBases;    
                vm.patientIntId = result.id;
                vm.hasValueForNotifBase = true;
                // console.log('patient Notification bases',vm.notifications)

                addFilterAttributeDescription();

                sortByDescDate();

                // see 'setSpecificNotificationData' function
                if ( callback ){
                    callback(vm.notifications);
                }

                vm.process_updateNotifications = false;
            }, function(result){
                console.log('mhpApiService error', result);
            });
        }


        // called by notification list to get the latest data
        function setSpecificNotificationData(id, callback){

            updateNotifications(function () {
                var _notification_to_view = _.findWhere(vm.notifications, {id: id});
                callback(_notification_to_view);
            });

        }

        /** sort descending date by default
         */
        function sortByDescDate(){

            if ( vm.base_length == 0){
                vm.base_length  = vm.notifications.length;
            }else{
                var sortByCreatedDate = utilityService.isNewElementInArray( vm.notifications,  vm.base_length);

                if (sortByCreatedDate){
                    vm.notifications = utilityService.sortByNewItemOnTop(vm.notifications, '-unixStartDate', '-id'); //new item will on top of the list regardless of date
                    vm.base_length  = vm.notifications.length;
                    vm.query.order = undefined;
                }else{
                    vm.query.order = '-unixStartDate'; // default sorting
                }
            }

        }

        function editClick(id) {
            vm.notification_to_view = {};

            var _notification_to_view = _.findWhere(vm.notifications, {id: id});

            // Temporary fix for datepicker error passing string
            // _notification_to_view.startDate = new Date(_notification_to_view.startDate);
            // _notification_to_view.endDate = new Date(_notification_to_view.endDate);

            var _startDate = new Date(_notification_to_view.startDate);
            var _endDate = new Date(_notification_to_view.endDate);

            var rangeDate = {
                startDate: _notification_to_view.startDate,
                endDate: _notification_to_view.endDate
            };

            _notification_to_view.rangeDate = rangeDate

            vm.notification_to_view = _notification_to_view;
            vm.notification_to_view_copy = angular.copy(vm.notification_to_view);
            vm.show_details = true;
        }

        function deleteClick(id) {
            var _notification_to_view = _.findWhere(vm.notifications, {id: id});
            var _index = vm.notifications.indexOf(_notification_to_view);
            vm.notifications.splice(_index, 1);
        }

        function createNew() {
            var rangeDate = {
                startDate: moment(),
                endDate: moment()
            };
            vm.notification_to_view = {
                "id" : 0,
                "patientId": vm.patientIntId,
                "description": "Please measure your blood pressure",
                "rangeDate" : rangeDate

            };
            vm.show_details = true;
        }

        function showNotificationList(id) {
            
            vm.selected_notification_base = _.findWhere(vm.notifications, {id: id});

            vm.show_notification_list = true;
        }

        /**
         * Added attribute for search
         * Remove added attribute when submit if needed
         */
        function addFilterAttributeDescription(){
            _.each(vm.notifications, function(notification, i){
                vm.notifications[i]._howToEnd = $filter('howToEndEnum')(notification.howToEnd);
                vm.notifications[i]._dayOfWeek = $filter('dayOfWeekEnum')(notification.dayOfWeek);
                vm.notifications[i]._status = $filter('status')(notification.status);
                vm.notifications[i]._startDate = new Date(notification.startDate).getTime();
                vm.notifications[i]._endDate = new Date(notification.endDate).getTime();
                vm.notifications[i].unixStartDate = moment(notification.startDate).format('x'); // for accurate sorting

                // console.log('vm.notifications['+i+'].notifications',vm.notifications[i].id, vm.notifications[i].description, vm.notifications[i].notifications)
            });
        }
    }

})();