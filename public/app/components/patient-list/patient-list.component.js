'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('patientList', {
            templateUrl : 'components/patient-list/patient-list.component.html',
            controller : Controller
        })
    ;

    Controller.$inject = ['$routeParams','mhpApiService', 'mhpInhouseApiService', '$rootScope',
        '$window', '$location', 'defaultParam', '$scope', 'tableConfig', '$filter', 'utilityService'];
    function Controller($routeParams, mhpApiService, mhpInhouseApiService, $rootScope,
                        $window, $location, defaultParam, $scope, tableConfig, $filter, utilityService){
        var vm = this;

        vm.patients = [];
        vm.query = {};
        vm.formData = {};
        vm.search_value = '';
        vm.get_patient_list;
        vm.alert_filters;
        vm.alertTypes = [
            { "id": 0, "name" : "bMonitored", "description": "Enrolled", "checked" : false },
            { "id": 1, "name" : "bRequireAttention", "description": "Requiring Attention", "checked" : false },
            { "id": 2, "name" : "bUnderControl", "description": "On Target", "checked" : false },
            { "id": 3, "name" : "notReviewed", "description": "Not Reviewed in 20+ Days", "checked" : false },
            { "id": 4, "name" : "bNotActive", "description": "No Data in 7 Days", "checked" : false }
        ]
        vm.tableConfig = tableConfig;
        vm.patients_length = 0;

        vm.getDescriptionById = getDescriptionById;
        vm.deletePatient = deletePatient;
        vm.updateAlertFilter = updateAlertFilter;
        vm.updateUserInfoOnNav = updateUserInfoOnNav;
        vm.patientRowClick = patientRowClick;
        vm.process_patientList = true;
        
        activate();

        ///////

        function activate(){
            updateFiltersBasedOnRoute();//get content from search
            
            vm.query = {
                order : 'fName',
                limit: 25,
                page: 1,
            }

            vm.formData = {
                alertType : null
            }
            
            vm.alert_filters = {
                "bMonitored": vm.alertTypes[0].checked,
                "bRequireAttention": vm.alertTypes[1].checked,
                "bUnderControl": vm.alertTypes[2].checked,
                "notReviewed" : vm.alertTypes[3].checked,
                "noDataForDays" : vm.alertTypes[4].checked
            }

            vm.process_patientList = true;
            updatePatientList(function(patients){
                getPatientNotReviewed(function(patientNoReviewed){
                    vm.patients = mergePatientsNotReviewed(patients, patientNoReviewed);
                    trimNames();
                    updateAlertFilter({});
                    vm.process_patientList = false;
                });
            });
        }

        function trimNames(){
            var index = 0;
            while (index <= vm.patients.length - 1){
                vm.patients[index].fName = vm.patients[index].fName.trim();
                index ++;
            }

        }

        function updatePatientList(callback){
            var _apiUrl = '/api/GetMePhysicianALVMPatients';
            var _request_params = '?startDate=' + defaultParam.startDate + '&endDate=' + defaultParam.endDate;

            vm.get_patient_list = mhpApiService.get(_apiUrl + _request_params, {}, true).then(function(result){
                callback(result);
            }, function(result){
                console.log('mhpApiService error', result);
            });
        }

        function getPatientNotReviewed(callback){
            mhpApiService.getUserId().then(function(userId){
                if ( userId ) {
                    mhpInhouseApiService.post('/api/GetPatientNotReviewed', {"PhysicianUserId" : userId}).then(function(result){
                        if (result && _.isArray(result.message)){
                            callback(result.message);
                        } else {
                            callback([]);
                        }
                    });
                }
            });
        }

        function mergePatientsNotReviewed(patients, patientNoReviewed) {
            _.each(patients, function(patient, i) {
                _.each(patientNoReviewed, function(reviewed, i) {

                    // add patient to list if not exist
                    if (!inPatient(patients, reviewed)) {

                        // add default attribute that is not available in PatientNotReviewed
                        reviewed.bMonitored = false;
                        reviewed.bRequireAttention = false;
                        reviewed.bUnderControl = false;

                        reviewed.notReviewed = true;
                        patients.push(reviewed);
                    }

                    // add notReviewed attribute if not monitored to existing patient
                    if (patients[i] && patient.userId === reviewed.userId) {
                        patients[i].notReviewed = true;
                        return false;
                    }
                });
            });

            return patients;
        }

        function inPatient(patients, patient) {
            var _exist = false;

            _.each(patients, function(_patient, i){
                if (_patient.userId == patient.userId) {
                    _exist = true;
                    return false; // terminate each
                }
            });

            return _exist;
        }

        function getDescriptionById(arrList, id) {
            var description = '';
            angular.forEach(arrList, function(item, i) {
                if (item.id == id) {
                    description = item.description;
                    return;
                }
            });

            return description;
        }

        function deletePatient(id) {
            console.log('delete patient id - ' + id)
        }

        function updateAlertFilter(alertType) {
            var _alertTypes = [];

            _.each(vm.alertTypes, function(item, i){
                if (item.checked) {
                    _alertTypes[item.name] = true;
                }
            })
            vm.alert_filters = _alertTypes;

        }

        function updateUserInfoOnNav(){
            $rootScope.$broadcast('app-nav-user-info.component.updateUserInfo');
        }

        function updateFiltersBasedOnRoute(){
             var _type = $routeParams.type;
             if ( !_type) {
                return;
             } else if ( _type.indexOf('search?q=') == 0 ){
                 vm.search_value = _type.split('?q=')[1];
             } else if ( _type.indexOf('monitored') == 0 ){
                 vm.alertTypes[0].checked = true;
             } else if ( _type.indexOf('attention') == 0 ){
                 vm.alertTypes[1].checked = true;
             } else if ( _type.indexOf('under_control') == 0 ){
                 vm.alertTypes[2].checked = true;
             } else if ( _type.indexOf('have_not_looked') == 0 ){
                 vm.alertTypes[3].checked = true;
             } else if ( _type.indexOf('no_data_for_days') == 0 ){
                 vm.alertTypes[4].checked = true;
             }
        }

        function patientRowClick(patientUserId) {
            // $location.url('/patient/dashboard?userId=' + patientUserId);
            $location.url('/patient/dashboard/' + patientUserId);
        }

    }

})();