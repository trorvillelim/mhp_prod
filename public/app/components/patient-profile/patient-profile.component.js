'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('patientProfile', {
            templateUrl : 'components/patient-profile/patient-profile.component.html',
            bindings : {
                patientDetails : '='
            },
            controller : Controller
    });

    Controller.$inject = ['mhpInhouseApiService',
                        'mhpApiService',
                        '$routeParams',
                        '$location',
                        'defaultParam',
                        'mhpDialog',
                        '$msg', '' +
                        '$scope',
                        'utilityService',
                        '$window', '$mdToast'];

    function Controller(mhpInhouseApiService,
                        mhpApiService,
                        $routeParams,
                        $location,
                        defaultParam,
                        mhpDialog,
                        $msg,
                        $scope,
                        utilityService,
                        $window,
                        $mdToast){


       var vm = this;
       var d = new Date();
       
       $scope.maxDate = d.getFullYear() + "/" + (d.getMonth()+1) + "/" + d.getDate();

        vm.emailRegex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
        vm.dobRegex = /[/\d/]{4}[-][/\d/]{2}[-][/\d/]{2}$/;
        vm.get_patient_details;
        vm.patientId = $routeParams.patientId;
        vm.loaded = false;
        vm.patientConditionOptions = [];
        vm.selectedConditions = [];

        vm.onSave = onSave;
        vm.onCancel = onCancel;
        vm.onSelect = onSelect;
        vm.setConditionFieldLimit = setConditionFieldLimit;
        vm.setAllergiesFieldLimit = setAllergiesFieldLimit;
        vm.maxDate = new Date();
        vm.minDate = new Date('1900-01-01');
        vm.formDataOld = [];

        activate();

        ///////

        function activate(){
            getPatientConditions();
            updatePatientDetails();
            vm.patientConditionOptions = [];
            
        }

        // initialize all value from users here.
        function initializeValue(){
            if (!vm.formData.conditions){
               // vm.formData.conditions = [];
            }
           vm.selectedConditions = vm.formData.conditions;
        }

        function setConditionFieldLimit(value) {
            utilityService.setTextLimit(value, 150, function (limitedValue) {
                vm.formData.otherConditions = limitedValue;
            });
        }

        function setAllergiesFieldLimit(value){
            utilityService.setTextLimit(value, 150, function (limitedValue) {
                vm.formData.current_allergies = limitedValue;
            });
        }

        function onSelect(item) {
            var index = vm.selectedConditions.indexOf(item);

            delete item.$$hashKey;

            if (index > -1){
                vm.selectedConditions.splice(index,1);
            }else{
                vm.selectedConditions.push(item);
            }
             vm.formData.conditions = vm.selectedConditions;
           //  vm.formData.conditions = vm.selectedConditions;
        }

        function updatePatientDetails() {
            var _url = '/api/GetMePhysicianPatientV2';
            var _request_param = '?patientUserId=' + vm.patientId + 
                            '&startDate=' + defaultParam.startDate +
                            '&endDate=' + defaultParam.endDate +
                            '&bCondition=true' +
                            '&bBpm=false' +
                            '&bNotification=false' + 
                            '&bRecommendation=false' + 
                            '&bDrug=false' + 
                            '&bPhysician=false' +
                            '&bRA=false'+
                            '&bReviewLog=false';

            vm.get_patient_details = mhpApiService.get(_url + _request_param, {}, true).then(function(result){
               // result.dob = new Date(result.dob);
                vm.formData = result;

                // check conditions
                _.each(vm.formData.conditions, function (condition, key) {
                    _.each(vm.patientConditionOptions, function (optionCondition, key) {

                        if (optionCondition.id == condition.id){
                            vm.selectedConditions.push(optionCondition)
                        }

                    });
                });
                vm.loaded = true; // initial value for DOB workaround
                angular.copy(vm.formData, vm.formDataOld);
            }, function(result){
                console.log('mhpApiService error', result);
            });
        }

        function updatePatientDetailsForReference(){
            var _url = '/api/GetMePhysicianPatientV2';
            var _request_param = '?patientUserId=' + vm.patientId + 
                            '&startDate=' + defaultParam.startDate +
                            '&endDate=' + defaultParam.endDate +
                            '&bCondition=true' +
                            '&bBpm=false' + 
                            '&bNotification=false' + 
                            '&bRecommendation=true' +
                            '&bDrug=false' + 
                            '&bPhysician=false' +
                            '&bRA=false'+
                            '&bReviewLog=false';

            mhpApiService.get(_url + _request_param, {}, true).then(function(result){
                var _patient_details = result.user;
                angular.copy(_patient_details, vm.patientDetails);
            }, function(result){
                console.log('mhpApiService error', result);
            });
        }        

        function onSave() {
            upsertMePhysicianPatientV2(function(success){
                if (success) {
                    updatePatientDetailsForReference();
                    showUpdateToast();
                   // mhpDialog.showDialog('Patient Profile', 'Patient details successfully updated.');
                } else {
                    mhpDialog.showDialog('Patient Profile', $msg.errorAPI);
                }
            })
        }

        function onCancel() {
            updatePatientDetails()
            vm.formData = vm.formDataOld;            
        }

        function upsertMePhysicianPatientV2(callback) {
            var _url = '/api/UpsertMePhysicianPatientV2';
            var _request_param = '?patientUserId=' + vm.patientId;

            vm.formData.dob = moment( vm.formData.dob._d).format('YYYY-MM-DD')
            delete vm.formData.recommendations;
            delete vm.formData.notificationBases;
            delete vm.formData.bpMeasurements;
            delete vm.formData.patientDrugs;
            delete vm.formData.reviewLogs;

            mhpApiService.post(_url + _request_param, vm.formData, {}, true).then(function(result){
                console.log('mhpApiService success', result);
                callback(true);
            }, function(result){
                console.log('mhpApiService error', result);
                callback(false);
            });
        }

        function getPatientConditions(){
            var _url = '/api/GetConditions';

            mhpApiService.get(_url, {}, true).then(function(result){
                var _conditions = result;
                angular.copy(_conditions, vm.patientConditionOptions);
            }, function(result){
                console.log('mhpApiService error', result);
            });
        }

        function showUpdateToast(){
            $mdToast.show(
                $mdToast.simple()
                    .textContent('Patient successfully updated')
                    .position('bottom center')
                    .hideDelay(3000)
            );
        }

        // remove empty array on data
        // function removeArrayEmpty(data) {
        //     _.each(data, function (value, index) {
        //         if (Array.isArray(value) && value.length == 0){
        //             delete data[index];
        //         }
        //     });
        //     return data;
        // }

    }
})();