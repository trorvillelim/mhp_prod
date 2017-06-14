(function() {
    angular
        .module('app.component.module')
        .component('patientFileDownload', {
            templateUrl : 'components/patient-file-download/patient-file-download.component.html',
            bindings : {
                patientUserId : '<', 
                files : '=',
                filesQuery : '=',
                filesUpdateInProgress : '<', 
                filesUpdatePromise : '='
            },
            controller : Controller
        });

    Controller.$inject = [  
                            '$scope', '$timeout', '$http', '$filter', 
                            'mhpDialog', 'tableConfig', 
                            'mhpApiService', 'patientFileDataService'];
    function Controller(       
                            $scope, $timeout, $http, $filter, 
                            mhpDialog, tableConfig, 
                            mhpApiService, patientFileDataService ) {
        var vm = this;

        vm.categories = ['Insurance form', 'Test results', 'Treatment plan', 'Other'];
        vm.category_types = [];
        vm.tableConfig = tableConfig;
        vm.date_range_picker_options = {}
        vm.filter_by = ['All', 'Category', 'Date'];
        vm.filter_type = 'All';        
        vm.filter_category = '';
        vm.filter_date = $filter('date')(new Date(), 'yyyy-MM-dd');;
        vm.filter_options = [];
        vm.onClickDeleteFile = onClickDeleteFile;        
        vm.patient_user_id = vm.patientUserId;//bindings
        vm.selected_date_range_value = {startDate : new Date()};

        return activate();

        ////////
    
        /**
         * 
         */
        function activate() {
            vm.query = vm.filesQuery;

            vm.date_range_picker_options = {
                singleDatePicker:true, 
                locale:{
                        format:'YYYY-MM-DD'
                }, 
                eventHandlers : {
                    'apply.daterangepicker' : function(ev, picker){
                        if ( vm.selected_date_range_value ){
                            vm.filter_date = $filter('date')(new Date(vm.selected_date_range_value), 'yyyy-MM-dd');
                        }
                    }
                }
            }

            vm.category_types = getCategoryTypes();
        }

        /**
         * 
         */
        function onClickDeleteFile(file, $event){

            if ( vm.files.indexOf(file) <= -1 )
                return;//not on list

            mhpDialog.showConfirmDialog('Delete',
                'Are you sure you want to delete "' + file.docName + '"',
                $event,
                'Delete',
                'Cancel',
                function (confirm) {
                    if ( confirm )
                      return deleteFile(file);
            });            
        }

        function deleteFile(file){

            //delete from list
            var _index = vm.files.indexOf(file);
            vm.files.splice(_index, 1);

            //delete from API
            patientFileDataService
                .deleteMePhysicianPatientDocument(vm.patient_user_id, file.docName)
                .then(function(message){
                    console.log('deleted File');
                }, 
                function(err){
                    console.log('error on delete', err);
                });
        }

        function getCategoryTypes(){
            return [
                {
                    value : 'Insurance form', 
                    label : 'Insurance form'
                },
                {
                    value : 'Test results', 
                    label : 'Test results'
                },                 
                {
                    value : 'Treatment plan', 
                    label : 'Treatment plan'
                },                 
                {
                    value : 'Uploaded Reports',
                    label : 'Uploaded Reports'
                },                
                {
                    value : 'Other', 
                    label : 'Other'
                }, 

            ]; 
        }


    }

})();