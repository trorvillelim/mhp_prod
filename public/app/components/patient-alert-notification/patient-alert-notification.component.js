'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('patientAlertNotification', {
            templateUrl : 'components/patient-alert-notification/patient-alert-notification.component.html',
            controller : Controller
    });

    Controller.$inject = [];
    function Controller(){
        var vm = this;

        activate();

        ///////

        function activate(){
        }
    }

})();