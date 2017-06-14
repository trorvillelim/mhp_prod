'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('patientNotificationBasesDetails', {
            templateUrl : 'components/patient-notification-bases-details/patient-notification-bases-details.component.html',
            bindings : {
                notifications : '=',
                notificationToView : '=',
                notificationToViewCopy : '<',
                showDetails : '='
            },
            controller : Controller
    });

    Controller.$inject = ['$scope', '$routeParams', 'mhpDialog', '$msg' , 'mhpApiService', 'utilityService'];
    function Controller($scope, $routeParams, mhpDialog, $msg, mhpApiService, utilityService){
        var vm = this;

        vm.master_form = {};
        vm.notificationDetail = {};
        vm.currentDate = moment();
        vm.notificationToView.description;

        vm.cancel = cancel;
        vm.submit = submit;
        vm.dateRegex = /[/\d/]{4}[-][/\d/]{2}[-][/\d/]{2}[/\s/][-][/\s/][/\d/]{4}[-][/\d/]{2}[-][/\d/]{2}$/;
        vm.patientId = $routeParams.patientId;
        vm.physicianId;


        activate();

        ///////

        function activate(){
            vm.dateRangeOptions = {
                locale:{format:'YYYY-MM-DD'},
                ranges: {
                    'Next 7 Days': [moment(), moment().add(6, 'days') ],
                    'Next 30 Days': [moment(), moment().add(29, 'days')]
                }
            }
            getPhysicianID()
        }

        function getPhysicianID(){
            var _url = '/api/GetMePhysicianV1';            
                        
            mhpApiService.get(_url, {}, true).then(function(result){
            vm.physicianId = result.id;           

            }, function(result){
            console.log('mhpApiService error', result);
            });
        }

        function cancel() {
            vm.showDetails = false;

            angular.copy(vm.notificationToViewCopy, vm.notificationToView);
            resetFormValidation();
        }

        function submit(){
            console.log( vm.notificationToView.rangeDate)
            var _notification_base = angular.copy(vm.notificationToView);

            _notification_base.startDate = moment(vm.notificationToView.rangeDate.startDate._d).format('YYYY-MM-DD HH:mm');
            _notification_base.endDate = moment(vm.notificationToView.rangeDate.endDate._d).format('YYYY-MM-DD HH:mm');

            _notification_base.physicianId = vm.physicianId;

            delete _notification_base.notifications;
            delete _notification_base.notificationTemplateId;
            delete _notification_base.rangeDate;

            if ($scope.patientNotificationBasesDetailsForm.$valid){
                var obj = {"notificationBases":[_notification_base]};
                console.log("_notification_base",obj);

                upsertMePhysicianPatientV2(obj,function(success){
                    if (success) {

                    } else {
                        mhpDialog.showDialog('Patient Notification Bases', $msg.errorAPI);
                        console.log('Patient Notification Bases', $msg.exceptionMessage);
                    }

                    resetFormValidation();
                    vm.showDetails = false;

                })
             }
            
        }

        function resetFormValidation(){
            $scope.patientNotificationBasesDetailsForm.$setPristine();
            $scope.patientNotificationBasesDetailsForm.$setUntouched();            
        }
        
        function upsertMePhysicianPatientV2(data,callback) {
            var _url = '/api/UpsertMePhysicianPatientV2';
            var _request_param = '?patientUserId=' + vm.patientId;

            mhpApiService.post(_url + _request_param, data, {}, true).then(function(result){
                console.log('mhpApiService success', result);
                callback(true);
            }, function(result){
                console.log('mhpApiService error', result);
                callback(false);
            });
        }

    }

})();