'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('patientFileGroupList', {
            templateUrl : 'components/patient-file-group-list/patient-file-group-list.component.html',
            bindings : {
                patientUserId : '<',     
                filesUpdateInProgress : '=',
                groupedFilesFilter : '=',
                groupedFiles : '=',
                queryGroupedFiles : '=', 
                patientFileGlobalFunctions : '='
            },
            controller : Controller
        })
    ;

    Controller.$inject = ['$mdExpansionPanel'];
    function Controller($mdExpansionPanel){
        var vm = this;

        vm.patient_user_id = vm.patientUserId;
        
        return activate();

        ///////

        function activate(){
        }

    }

})();