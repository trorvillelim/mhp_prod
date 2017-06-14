(function() {

    angular
        .module('app.component.module')
        .component('patientFileDownload', {
            templateUrl : 'components/patient-file-download/patient-file-download.component.html',
            bindings : {
                files : '=',
            },
            controller : Controller
        });

    Controller.$inject = ['$scope', '$timeout', '$http', 'mhpDialog'];
    function Controller($scope, $timeout, $http, mhpDialog) {
        var vm = this;
        vm.credential = {};

        vm.Files = vm.files;
        vm.filter_by = ['All', 'Category', 'Date'];
        vm.categories = ['Treatment plan', 'Test results', 'Insurance form', 'Other'];
        vm.filter_options = [];

        vm.calendarOn = false;

        vm.setFilterType = setFilterType;
        vm.resetFilter = resetFilter;
        vm.deleteFile = deleteFile

        active();

        function active() {
            vm.query = {
                order: '-uploadDate',
                limit: '',
                page: 1
            };

            $scope.$watch('$ctrl.files', function () {
                vm.Files = vm.files;
            });

            onDateChange();
        }

        function resetFilter(){
                vm.search_value = undefined;
                vm.date = undefined;
                vm.filter_option = undefined;
        }

        // date range picker dont update its model automatically, work around for filter
        function onDateChange() {
            $scope.$watch('$ctrl.date', function (newDate) {
                vm.date = moment(newDate).format('YYYY-MM-DD');
            });
        }


        function setFilterType(filter){
            resetFilter();

            switch(filter){
                case 'All':
                    vm.categ_option = false;
                    vm.calendarOn = false;
                    resetFilter();
                    break;
                case 'Category':
                    vm.filter_options = vm.categories;
                    vm.categ_option = true;
                    vm.calendarOn = false;
                    break;
                case 'Date':
                    vm.calendarOn = true;
                    vm.categ_option = false;

                    break;
            }
        }

        function deleteFile(index, $event){
            var file = vm.Files[index];

            mhpDialog.showConfirmDialog('Delete',
                'Are you sure you want to delete "' + file.name + '"',
                $event,
                'Delete',
                'Cancel',
                function (confirm) {
                    if(confirm){
                        vm.Files.splice(index, 1);
                    }
                });
        }
    }

})();
(function() {

    angular
        .module('app.component.module')
        .component('patientFileDownload', {
            templateUrl : 'components/patient-file-download/patient-file-download.component.html',
            bindings : {
                files : '=',
                filesUpdateInProgress : '<', 
                filesUpdatePromise : '<'
            },
            controller : Controller
        });

    Controller.$inject = ['$scope', '$timeout', '$http', 'mhpDialog'];
    function Controller($scope, $timeout, $http, mhpDialog) {
        var vm = this;
        vm.credential = {};

        vm.Files = vm.files;
        vm.filter_by = ['All', 'Category', 'Date'];
        vm.categories = ['Treatment plan', 'Test results', 'Insurance form', 'Other'];
        vm.filter_options = [];

        vm.calendarOn = false;

        vm.setFilterType = setFilterType;
        vm.resetFilter = resetFilter;
        vm.deleteFile = deleteFile

        active();

        function active() {
            vm.query = {
                order: '-uploadDate',
                limit: '',
                page: 1
            };

            $scope.$watch('$ctrl.files', function () {
                vm.Files = vm.files;
            });

            onDateChange();
        }

        function resetFilter(){
                vm.search_value = undefined;
                vm.date = undefined;
                vm.filter_option = undefined;
        }

        // date range picker dont update its model automatically, work around for filter
        function onDateChange() {
            $scope.$watch('$ctrl.date', function (newDate) {
                vm.date = moment(newDate).format('YYYY-MM-DD');
            });
        }


        function setFilterType(filter){
            resetFilter();

            switch(filter){
                case 'All':
                    vm.categ_option = false;
                    vm.calendarOn = false;
                    resetFilter();
                    break;
                case 'Category':
                    vm.filter_options = vm.categories;
                    vm.categ_option = true;
                    vm.calendarOn = false;
                    break;
                case 'Date':
                    vm.calendarOn = true;
                    vm.categ_option = false;

                    break;
            }
        }

        function deleteFile(index, $event){
            var file = vm.Files[index];

            mhpDialog.showConfirmDialog('Delete',
                'Are you sure you want to delete "' + file.name + '"',
                $event,
                'Delete',
                'Cancel',
                function (confirm) {
                    if(confirm){
                        vm.Files.splice(index, 1);
                    }
                });
        }
    }

})();