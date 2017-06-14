'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('patientBpMeasurementList', {
            templateUrl : 'components/patient-bp-measurement-list/patient-bp-measurement-list.component.html',
            controller : Controller
    });

    Controller.$inject = ['tableConfig', 'mhpApiService', '$filter', '$location', 'defaultParam', '$routeParams', '$scope', 'timeService', 'utilityService','bpListFilterService'];
    function Controller(tableConfig, mhpApiService, $filter, $location, defaultParam, $routeParams, $scope, timeService, utilityService, bpListFilterService){
        var vm = this;

        vm.bp_measurements = [];
        vm.query = {};
        vm.get_bp_measurements;
        vm.tableConfig = tableConfig;
        vm.bp_measurement_to_view = {};
        vm.bp_measurement_to_view_copy = {};
        vm.show_details = false;
        vm.patientId = $routeParams.patientId;
        vm.bpMeasurements_length = 0;

        vm.startDate;
        vm.endDate;

        vm.createNewBpMeasurement = createNewBpMeasurement;
        vm.editBpMeasurement = editBpMeasurement;
        vm.deleteBpMeasurement = deleteBpMeasurement;
        vm.setBpData = setBpData;

        vm.parent = this;

        activate();

        ///////

        function activate(){
            vm.query = {
                order: '-measurementDate_in_millis',
                limit: tableConfig.defaultRowCount,
                page: 1
            }


        }

        function createNewBpMeasurement(){
            vm.bp_measurement_to_view = {
                "id" : 0,
            }
            vm.show_details = true; 
        }

        function editBpMeasurement(bpMeasurementId){
            // $location.path('/patient/recommendation_details/' + recommendationId);
            vm.bp_measurement_to_view = {};
            
            var _bp_measurement_to_view = _.findWhere(vm.bp_measurements, {id: bpMeasurementId});

            // Temporary fix for datepicker error passing string
            //_bp_measurement_to_view.measureDate = $filter('date')(new Date(_bp_measurement_to_view.measureDate),'yyyy-MM-dd hh:mm');
            //new Date(_bp_measurement_to_view.measureDate);

            vm.bp_measurement_to_view = _bp_measurement_to_view;
            vm.bp_measurement_to_view_copy = angular.copy(vm.bp_measurement_to_view);

            vm.show_details = true;
        }

        function deleteBpMeasurement(bpMeasurementId) {
            var _bp_measurement_to_view = _.findWhere(vm.bp_measurements, {id: bpMeasurementId});
            var _index = vm.bp_measurements.indexOf(_bp_measurement_to_view);
            vm.bp_measurements.splice(_index, 1);
        }


        // setting data to display coming from bpm chart
        function  setBpData(array) {

            vm.bp_measurements = array;

            if (vm.bpMeasurements_length == 0){
                vm.bpMeasurements_length =  vm.bp_measurements.length;
                vm.query.order = '-measurementDate_in_millis'
            }else{
                var shouldSortById =  utilityService.isNewElementInArray( vm.bp_measurements, vm.bpMeasurements_length);
                if (shouldSortById){
                    vm.bp_measurements =   utilityService.sortByNewItemOnTop(vm.bp_measurements, '-measurementDate_in_millis',  '-id');
                    vm.query.order = undefined;
                }else {
                    vm.query.order = '-measurementDate_in_millis'; // in-case there is a deletion of element will sort them by default
                }
            }

            vm.bpMeasurements_length = angular.copy( vm.bp_measurements.length );

        }

    }

})();