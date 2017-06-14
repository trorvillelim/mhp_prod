'use strict';
(function() {

    angular
        .module('app.component.module')
        .component('patientNotificationDetails', {
            templateUrl: 'components/patient-notification-details/patient-notification-details.component.html',
            bindings: {
                notifications: '=',
                notificationToView: '=',
                notificationToViewCopy: '<',
                showDetails: '=',
                notificationBase: '='
            },
            controller: Controller
        });

    Controller.$inject = ['$scope', '$routeParams', 'mhpDialog', '$msg', 'mhpApiService', 'utilityService'];
    function Controller($scope, $routeParams, mhpDialog, $msg, mhpApiService, utilityService) {
        var vm = this;

        vm.cancel = cancel;
        vm.submit = submit;
        vm.currentDate = moment();
        vm.patientId = $routeParams.patientId;
        vm.dateRegex = /[/\d/]{4}[-][/\d/]{2}[-][/\d/]{2}[/\s/][/\d/]{2}[:][/\d/]{2}[/\s/](am|pm)$/;
        vm.notifications_length = 0;
        vm.checkErr = checkErr;
        vm.validationErrMessage = false;
        activate();

        ///////

        function activate() {
            var notif = vm.notificationToView;
            if (!notif.deliverydDate && !notif.confirmationDate && !notif.eventDate) {
                vm.notificationToView.deliverydDate = moment();
                vm.notificationToView.eventDate =  moment();
                vm.notificationToView.confirmationDate = null;
            }else{
                vm.notificationToView.deliverydDate = moment(vm.notificationToView.deliverydDate);
                vm.notificationToView.eventDate =  moment(vm.notificationToView.eventDate);
            }
        }

        function cancel() {
            vm.showDetails = false;
            // angular.copy(vm.notificationToViewCopy, vm.notificationToView);

            resetFormValidation();
        }

        function toTimeZone(time, zone) {
            var format = 'YYYY/MM/DD HH:mm:ss ZZ';
            return moment(time, format).tz(zone).format(format);
        }

        function submit() {
            var _notification_base = angular.copy(vm.notificationBase);
            _notification_base.notifications = [];

            var delDate = new Date(vm.notificationToView.deliverydDate._d );
            var eventDate = new Date(vm.notificationToView.eventDate._d );

            vm.notificationToView.deliverydDate = moment(delDate).format('YYYY-MM-DD HH:mm');
            vm.notificationToView.eventDate =  moment(eventDate).format('YYYY-MM-DD HH:mm');

            _notification_base.notifications.push(vm.notificationToView);

            /** DELETE attributes if null*/
            if (_notification_base.notifications[0].confirmationDate == null) {
                delete _notification_base.notifications[0].confirmationDate;
                vm.notificationToView.confirmationDate = "";
            }

            if (_notification_base.notifications[0].responseType == null) {
                delete _notification_base.notifications[0].responseType;
            }

            if ($scope.notificationDetailsForm.$valid) {
                var obj = {"notificationBases": [_notification_base]};

                // console.log("_notification_base", obj);

                upsertMePhysicianPatientV2(obj, function (success) {
                    if (success) {
                        // mhpDialog.showDialog('Patient notifications', 'Notifications Upsert Successful');
                        updateListUi();
                    }
                    else {
                        mhpDialog.showDialog('Patient notifications', $msg.errorAPI);
                    }
                    resetFormValidation();
                    vm.showDetails = false;
                });
            }
        }

        function updateListUi(){
          var notification =   vm.notificationToView;

            // if(moment.isMoment(notification.eventDate)){
            //     vm.notificationToView.eventDate = notification.eventDate._d;
            // }
            // if( moment.isMoment(notification.deliverydDate )){
            //     vm.notificationToView.deliverydDate = notification.deliverydDate._d;
            // }

            /** Format date with AM/PM upon update to display */
            var delDate = new Date(vm.notificationToView.deliverydDate );
            var eventDate = new Date(vm.notificationToView.eventDate );
            vm.notificationToView.deliverydDate = moment(delDate).format('YYYY-MM-DD hh:mm A');
            vm.notificationToView.eventDate =  moment(eventDate).format('YYYY-MM-DD hh:mm A');

            /** ADD NEW*/
            if ( vm.notificationToView.id === 0){
                vm.notificationBase.notifications.push( vm.notificationToView );
            }else{
                var index =  utilityService.containsObject( vm.notificationToView, vm.notificationBase.notifications);
                /** update existing object in array*/
                if ( index !== -1 ) {
                    vm.notificationBase.notifications.splice(index , 1);
                    vm.notificationBase.notifications.push( vm.notificationToView );
                }
            }
        }

        function resetFormValidation() {
            $scope.notificationDetailsForm.$setPristine();
            $scope.notificationDetailsForm.$setUntouched();
        }

        function upsertMePhysicianPatientV2(data, callback) {
            var _url = '/api/UpsertMePhysicianPatientV2';
            var _request_param = '?patientUserId=' + vm.patientId;

            mhpApiService.post(_url + _request_param, data, {}, true).then(function (result) {
                console.log('mhpApiService success', result);
                callback(true);
            }, function (result) {
                console.log('mhpApiService error', result);
                callback(false);
            });
        }


        function checkErr(_eventDate,_deliveryDate) {
            vm.errMessage = '';

            var eventDate = moment(new Date(_eventDate)).format('YYYY-MM-DD HH:mm');
            var deliveryDate = moment(new Date(_deliveryDate)).format('YYYY-MM-DD HH:mm');

            // console.log('eventDate ', eventDate);
            // console.log('deliveryDate ', deliveryDate);

            if(deliveryDate < eventDate){
                vm.errMessage = 'Delivery Date must be greater than Event Date.';
                $scope.notificationDetailsForm.deliverydDate.$error.validationErrMessage = true;
                $scope.notificationDetailsForm.$invalid = true;
            }else{
               $scope.notificationDetailsForm.deliverydDate.$error.validationErrMessage = false;
            }
        }

    }
}
)();