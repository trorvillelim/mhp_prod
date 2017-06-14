'use strict';
(function(){

    angular
        .module('app.component.module')
        .component('patientMedicationComponent', {
            templateUrl : 'components/patient-medication/patient-medication.component.html',
            bindings : {
                history: '=',
                medicationList: '='
            },
            controller : Controller
        });

    Controller.$inject = ['$scope', 'utilityService', '$routeParams', 'mhpApiService', 'timeService', 'defaultParam', 'tableConfig'];
    function Controller( $scope, utilityService, $routeParams, mhpApiService, timeService,  defaultParam , tableConfig) {
        var vm = this;
        vm.ishistory = vm.history;
        vm.medication_list_length = 0;
        vm.buttonName = "Create New";
        vm.get_patiendDrugs;
        vm.tableConfig = tableConfig;

        vm.addMedication = addMedication;
        vm.edit = edit
        vm.cancelText = cancelText;
        vm.deleteMedication = deleteMedication;
        vm.deleteUsageInstruction = "*[Deleted Medication]*";

        activate();

        function activate() {
            vm.query = {
                order : '-effectiveDate',
                limit: vm.tableConfig.defaultRowCount,
                page: 1,
            }

            $scope.$watch('$ctrl.history', function () {
                vm.ishistory = vm.history;
            });

            getPatientDrugs();

            $scope.$watch('$ctrl.usageInstruction', function () {
                if (vm.usageInstruction == ''){
                    vm.buttonName = "Create New";
                }
            });
        }

        function cancelText(){
            vm.usageInstruction = "";
        }

        function edit(medication){
            vm.medication = medication;
            vm.usageInstruction = medication.usageInstruction;
            vm.buttonName = "Update";
            vm.isUpdate = true;
        }

        /** sort descending date by default
         */
        function sortByDescDate(){

            _.each( vm.medication_list, function(medication, i){
                    // converted model to unix milliseconds for accurate sorting
                  vm.medication_list[i].measureDate = moment(medication.effectiveDate ).format('x');
            });

            if ( vm.medication_list_length == 0){
                vm.medication_list_length  = vm.medication_list.length;
            }else{
                var sortByCreateDate = utilityService.isNewElementInArray( vm.medication_list,  vm.medication_list_length);

                if (sortByCreateDate){
                    vm.medication_list = utilityService.sortByNewItemOnTop(vm.patients, '-effectiveDate', '-id'); //new item will on top of the list regardless of date
                    vm.medication_list_length  = vm.medication_list.length;
                    vm.query.order = undefined;
                }else{
                    vm.query.order = '-effectiveDate'; // default sorting
                }
            }
        }

        function addMedication() {

            if (vm.isUpdate){
                var medication_to_view = _.findWhere(vm.medication_list, { id: vm.medication.id });
                medication_to_view.usageInstruction = vm.usageInstruction;

                vm.medicationList.patientDrugs = vm.medication_list;
                console.log('updating', vm.medication_list)
            }else{
                var medication = {
                    drugName : 'Medication Entry',
                    usageInstruction : vm.usageInstruction,
                    dosage: 'dosage',
                    effectiveDate :  moment().utc()
                };

                var medication_list_copy = [];
                angular.copy(vm.medication_list, medication_list_copy);
                medication_list_copy.push(medication);
                vm.medicationList.patientDrugs = medication_list_copy;
            }

            upsertMePhysicianPatientV2(function(success){
                if (success) {
                    getPatientDrugs();
                    // mhpDialog.showDialog('Patient Medications', 'Patient medications successfully updated.');
                } else {
                    //mhpDialog.showDialog('Patient Profile', $msg.errorAPI);
                }
            })
        }

        function upsertMePhysicianPatientV2(callback) {
            var _url = '/api/UpsertMePhysicianPatientV2';
            var _request_param = '?patientUserId=' + $routeParams.patientId;

            delete vm.medicationList.recommendations;
            delete vm.medicationList.reviewLogs;
            delete vm.medicationList.notificationBases;
            delete vm.medicationList.bpMeasurements;

            console.log('vm.medicationList',vm.medicationList)

            mhpApiService.post(_url + _request_param, vm.medicationList, {}, true).then(function(result){
                console.log('mhpApiService success', result);
                callback(true);

            }, function(result){
                console.log('mhpApiService error', result);
                callback(false);
            });

            vm.usageInstruction = "";
            vm.isUpdate = false;
        }

        function getPatientDrugs() {
            var _url = '/api/GetMePhysicianPatientV2';
            var _request_param = '?patientUserId=' + $routeParams.patientId +
                '&startDate=' + defaultParam.startDate +
                '&endDate=' + defaultParam.endDate +
                '&bCondition=false' +
                '&bBpm=false' +
                '&bNotification=false' +
                '&bRecommendation=false' +
                '&bDrug=true' +
                '&bPhysician=false' +
                '&bRA=false'+
                '&bReviewLog=false';

        vm.get_patiendDrugs =  mhpApiService.get(_url + _request_param, {}, true).then(function (result) {
                vm.medication_list = result.patientDrugs;                

                removeByAttr(vm.medication_list, 'usageInstruction', vm.deleteUsageInstruction);
                
                timeService.toLocalDate(vm.medication_list, ['effectiveDate']);
                //  sortByDescDate();
            });

        }

        function deleteMedication(medication){

            var medication_to_view = _.findWhere(vm.medication_list, { id: medication.id });
            medication_to_view.usageInstruction = vm.deleteUsageInstruction;
            vm.medicationList.patientDrugs = vm.medication_list;

             upsertMePhysicianPatientV2(function(success){
                if(success) {
                    getPatientDrugs();
                } else {
                    console.log('error deleteMedication')
                }
            })
        }

        function removeByAttr (arr, attr, value){
            var i = arr.length;
            while(i--){
                if( arr[i] 
                && arr[i].hasOwnProperty(attr) 
                && (arguments.length > 2 && arr[i][attr] === value ) ){ 

                arr.splice(i,1);

                }
            }
            return arr;
        }
    }

})();