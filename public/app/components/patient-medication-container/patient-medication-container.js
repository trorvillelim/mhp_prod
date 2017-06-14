'use strict';
(function(){

    angular
        .module('app.component.module')
        .component('patientMedicationContainer', {
            templateUrl : 'components/patient-medication-container/patient-medication-container.html',
            controller : Controller,

        });

    Controller.$inject = ['localStorageService', '$routeParams', 'mhpApiService', 'defaultParam'];
    function Controller(localStorageService, $routeParams, mhpApiService, defaultParam) {
        var vm = this;
        vm.isHistory = false;
        // vm.medicationList = localStorageService.get(JSON.stringify($routeParams.patientId));
        vm.medicationList = [];
        // if(!vm.medicationList){
        //     vm.medicationList = [];
        // }
        
        vm.onSelectTab = onSelectTab;
        activate();

        function activate() {
            getPatientDrugs();
        }

        function onSelectTab(isHistory) {
            vm.isHistory = isHistory
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

            mhpApiService.get(_url + _request_param, {}, true).then(function (result) {
                vm.medicationList = result;
            });
        }
    }
})();

