(function() {

    angular
        .module('app.component.module')
        .component('patientFileContainer', {
            templateUrl : 'components/patient-file-container/patient-file-container.html',
            transclude: true,
            controller : Controller
        });

    Controller.$inject = ['$scope', '$routeParams'];
    function Controller($scope, $routeParams){
        vm = this;
        vm.onSelectTab = onSelectTab;
        vm.patient_id = $routeParams.patientId;

        active();
        
        function active() {
        }

        function onSelectTab(isDownloadShow){
            vm.isDownload = isDownloadShow;
        }

    }

})();