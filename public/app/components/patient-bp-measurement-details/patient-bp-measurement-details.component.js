'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('patientBpMeasurementDetails', {
            templateUrl : 'components/patient-bp-measurement-details/patient-bp-measurement-details.component.html',
            bindings : {
                bpMeasurementToView : '=',
                bpMeasurementToViewCopy : '<',
                bpMeasurements : '=',
                showDetails : '='
            },
            controller : Controller
    });

    Controller.$inject = ['$scope', 'mhpApiService', 'mhpDialog' ,'$routeParams', '$msg', 'defaultParam', 'utilityService'];
    function Controller($scope, mhpApiService ,mhpDialog ,$routeParams, $msg, defaultParam, utilityService){
        var vm = this;

        vm.numberRegex = /^\d+$/;
        vm.cancel = cancel;
        vm.save = save;
        vm.watchNoteTextArea = watchNoteTextArea;
        vm.patientId = $routeParams.patientId;
        vm.currentDate = moment();
        vm.regex = /^[/\d/]{4}[-][/\d/]{2}[-][/\d/]{2}[/\s/][/\d/]{2}[:][/\d/]{2}[/\s/](am|pm)$/;

        activate();

        ///////

        function activate(){
            if ( !vm.bpMeasurementToView.measureDate){
                vm.bpMeasurementToView.measureDate = new Date();
                console.log('vm.bpMeasurementToView',vm.bpMeasurementToView);
            }
        }

        function cancel(){

            // angular.copy(vm.bpMeasurementToViewCopy, vm.bpMeasurementToView);

            vm.bpMeasurementToView.text = vm.bpMeasurementToViewCopy.text;
            vm.showDetails = false;        
            resetFormValidation();
        }



        function save(){
            // uncomment if upsert is working
            //if (success) {
            // if (vm.bpMeasurementToView.id == 0) {
            //     vm.bpMeasurementToView.id = vm.bpMeasurements.length + 1;
            //     vm.bpMeasurements.push(vm.bpMeasurementToView);
            // } 

            vm.bpMeasurementToView.measureDate = moment(vm.bpMeasurementToView.measureDate).format('YYYY-MM-DD HH:mm') 

            var obj = {"bpMeasurements":[vm.bpMeasurementToView]};

            if ($scope.bpMeasurementDetails.$valid){
                var obj = {"bpMeasurements":[vm.bpMeasurementToView]};
                console.log(obj);
                upsertMePhysicianPatientV2(obj,function(success){
                    if (success) {
                        vm.showDetails = false;
                    } else {
                        mhpDialog.showDialog('Patient BP measurement', $msg.errorAPI);
                    }
                    resetFormValidation();
                })
            }
        }

        function resetFormValidation(){
            $scope.bpMeasurementDetails.$setPristine();
            $scope.bpMeasurementDetails.$setUntouched();
        }

        // Prevent Note from typing limit to 150 characters
        function watchNoteTextArea(value){
            utilityService.setTextLimit(value, 150, function (newValue) {
                $scope.$ctrl.bpMeasurementToView.note = newValue;
            });

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