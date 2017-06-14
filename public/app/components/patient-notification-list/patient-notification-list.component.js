'use strict';
(function () {

    angular
        .module('app.component.module')
        .component('patientNotificationList', {
            templateUrl: 'components/patient-notification-list/patient-notification-list.component.html',
            bindings: {
                showNotificationList: '=',
                selectedNotificationBase: '=',
                notificationBaseController : '='
            },
            controller: Controller
        });

    Controller.$inject = ['tableConfig', '$scope', '$timeout','timeService', 'utilityService', '$filter'];
    function Controller(tableConfig, $scope, $timeout, timeService, utilityService, $filter) {
        var vm = this;

        vm.query;
        vm.show_details = false;
        vm.notification_to_view = {};
        vm.notification_to_view_copy = {};
        vm.notification_base = {};
        vm.template = {};
        vm.baseController = vm.notificationBaseController;
        vm.baseId = vm.selectedNotificationBase.id;

        vm.list_length = 0;

        vm.displayNotificationList = displayNotificationList;
        vm.createNew = createNew;
        vm.edit = edit;
        activate();

        ///////

        function activate() {
            vm.query = {
                order: '-unixEventDate',
                limit: tableConfig.defaultRowCount,
                page: 1
            }

            reloadNotificationList();
        }

        function displayNotificationList(display) {
            vm.showNotificationList = display;
        }

        function createNew() {
            vm.notification_to_view = {
                "id": 0,
            };


            vm.notification_base = vm.selectedNotificationBase;
            vm.show_details = true;
        }

        function reloadNotificationList() {
            $scope.$watch('$ctrl.show_details', function (newVal) {

                if (!newVal) {
                    vm.baseController.setSpecificNotificationData(vm.baseId, function (selectedNotificationBase) { // fetch new notifications from baseController
                        // console.log('notification fetch', selectedNotificationBase.notifications);
                        vm.selectedNotificationBase.notifications = selectedNotificationBase.notifications;

                        _.each(vm.selectedNotificationBase.notifications, function (notification, i) {
                            vm.selectedNotificationBase.notifications[i].unixEventDate = moment(notification.eventDate).format('x');
                        });

                        sortByDescDate();

                    });

                };
            });
        }

        function edit(id) {
            vm.notification_to_view = {};
            vm.template = (JSON.parse(JSON.stringify(vm.selectedNotificationBase.notifications)));
            var _notification_to_view = _.findWhere(vm.template, { id: id });

            // uncomment code below for default date value UTC

            // // Temporary fix for datepicker error passing string
            // var eventDateObj = new Date( _notification_to_view.eventDate );
            // var deliverydDateObj = new Date( _notification_to_view.deliverydDate );
            // var confirmationDateObj = new Date( _notification_to_view.confirmationDate );
            //
            // // so the datepicker can display the data
            // _notification_to_view.eventDate = new Date(eventDateObj.getUTCFullYear(), eventDateObj.getUTCMonth(), eventDateObj.getUTCDate(),  eventDateObj.getUTCHours(), eventDateObj.getUTCMinutes(), eventDateObj.getUTCSeconds());
            // _notification_to_view.deliverydDate = new Date(deliverydDateObj.getUTCFullYear(), deliverydDateObj.getUTCMonth(), deliverydDateObj.getUTCDate(),  deliverydDateObj.getUTCHours(), deliverydDateObj.getUTCMinutes(), deliverydDateObj.getUTCSeconds());
            // _notification_to_view.confirmationDate= new Date(confirmationDateObj.getUTCFullYear(), confirmationDateObj.getUTCMonth(), confirmationDateObj.getUTCDate(),  confirmationDateObj.getUTCHours(), confirmationDateObj.getUTCMinutes(), confirmationDateObj.getUTCSeconds());

            //UTC to local, vm.template used in notification  detail.
            // timeService.toLocalDate( vm.template, ['deliverydDate', 'confirmationDate', 'eventDate']);

            vm.notification_to_view = _notification_to_view;
            vm.notification_to_view_copy = angular.copy(vm.notification_to_view);
            vm.notification_base = vm.selectedNotificationBase;
            vm.show_details = true;
        }

        /** sort descending date by default
         */
        function sortByDescDate(){

            if( vm.list_length == 0){
                vm.list_length  = vm.selectedNotificationBase.notifications.length;
            }else{
                var sortByCreatedDate = utilityService.isNewElementInArray( vm.selectedNotificationBase.notifications,  vm.list_length);

                if (sortByCreatedDate){
                    vm.selectedNotificationBase.notifications = utilityService.sortByNewItemOnTop(vm.selectedNotificationBase.notifications, '-unixEventDate', '-id'); //new item will on top of the list regardless of date
                    vm.list_length  = vm.selectedNotificationBase.notifications.length;
                    vm.query.order = undefined;
                }else{
                    vm.query.order = '-unixEventDate'; // default sorting
                }
            }

        }

    }

})();