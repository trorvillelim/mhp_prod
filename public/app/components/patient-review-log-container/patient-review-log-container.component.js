'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('patientReviewLogContainer', {
            templateUrl : 'components/patient-review-log-container/patient-review-log-container.component.html',
            controller : Controller
    });

    Controller.$inject = [
                            '$routeParams', 
                            'mhpApiService', 'physicianPatientDataService'];
    function Controller(
                            $routeParams, 
                            mhpApiService, physicianPatientDataService){
        var vm = this;
            vm.initLogFilters = "";
            vm.automatic_logged_list_id = "";
            vm.manual_logged_list_id = "";

            vm.update_automatic_logged_list_id = update_automatic_logged_list_id;
            vm.update_manual_logged_list_id = update_manual_logged_list_id;

            vm.physician_info;
            vm.patient_info;

        activate();

        ///////

        function activate(){
            getPhysicianInfo(function(){});//prefetch
            getPatientInfo(function(){});//prefetch
        }

        function getPhysicianInfo(callback){
            if ( vm.physician_info )
                return callback(null, vm.physician_info);

            mhpApiService.getLoggedUserInfo().then(
                function(loggedUserInfo){
                    vm.physician_info = loggedUserInfo.user;
                    return callback(null, vm.physician_info);
                }, 
                function(err){
                    console.log(err);
                    return callback(err);
                }
            )            
        }

        function getPatientInfo(callback){
            if ( vm.patient_info )
                return callback(null, vm.patient_info);

            physicianPatientDataService
                .getPatientInformation($routeParams.patientId)                
                .then(function(patientInfo){
                    vm.patient_info = patientInfo;
                    return callback(null, vm.patient_info);
                });
        }        

        function update_automatic_logged_list_id(){
            vm.automatic_logged_list_id = new Date().getTime();
        }

        function update_manual_logged_list_id(){
            vm.manual_logged_list_id = new Date().getTime();
        }

    }

})();