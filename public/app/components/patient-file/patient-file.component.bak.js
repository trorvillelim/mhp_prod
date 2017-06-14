(function() {

    angular
        .module('app.component.module')
        .component('patientFile', {
            templateUrl : 'components/patient-file/patient-file.component.html',
            controller : Controller
        });

    Controller.$inject = ['$scope', '$timeout', '$http'];
    function Controller($scope, $timeout, $http){
        var vm = this;
        vm.categories= ['Treatment plan', 'Test results', 'Insurance form', 'Other'];
        vm.credential = {};
        vm.Files = [];
        vm.canUpload = false;

        vm.clearAll = clearAll;
        vm.setCategory = setCategory;
        vm.upload = upload;

        active();

        function active() {
            vm.query = {
                order : 'name',
                limit: '',
                page: 1
            };
            watchDropBox();
        }

        function watchDropBox() {
            $scope.$watch('$ctrl.Files', function (files) {
                if (files != null) {

                    /**by default file is an array of file*/
                    if(files.length > 5){
                        return;
                    }else{
                        _.each(files, function(f) {
                            f.formatedSize = formatSize( f.size );
                        });
                    }

                    // $timeout(function () {
                    //     vm.files.push(file);
                    // });
                    return;
                }
            });
        }

        function isValid() {
            var i = 0;
            _.each(vm.Files, function(f) {
                    if ('category' in f ){
                        i++;
                    }

                    if ( vm.Files.length  === i ){
                        vm.canUpload = true;
                    }
            });
        }

        function formatSize(bytes){
          var format = 'KB';

            if(bytes.toString().length >= 7){
                format = 'MB';
                bytes = (bytes/1000) / 1000;
            }else {
                format = 'KB';
                bytes = bytes/1000;
            }
            var formatedSize = parseFloat(bytes).toFixed(2) + " " + format;
            return formatedSize;
        }


        function clearAll() {
            vm.Files = [];
        }

        function setCategory(index, cat){
         vm.Files[index].category = cat;
            isValid();
        }

        function setUploadDate(){
            _.each(vm.Files, function(f) {
                f.uploadDate = moment().format("YYYY-MM-DD");
            });
        }

        function upload() {
            setUploadDate();
            vm.files = vm.Files
            vm.canUpload  = false;
        }

    }

})();
