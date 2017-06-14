'use strict';
(function() {

    angular
        .module('app.component.module')
        .component('patientFile', {
            templateUrl : 'components/patient-file/patient-file.component.html',
            bindings : {
                patientUserId : '<'
            },
            controller : Controller
        });

    Controller.$inject = [ 
                            '$scope', '$timeout', '$http', '$q',
                            '$filter',  
                            'mhpApiService', 'patientFileDataService', 
                            'tableConfig'
                         ];
    function Controller(
                            $scope, $timeout, $http, $q, 
                            $filter, 
                            mhpApiService, patientFileDataService, 
                            tableConfig){
        var vm = this;

        vm.addFilesToUpload = addFilesToUpload;
        vm.canUpload    = false;
        vm.categories   = ['Treatment plan', 'Test results', 'Insurance form', 'Other'];
        vm.clearAll     = clearAll;
        vm.deleteFile   = deleteFile;
        vm.files_to_upload      = [];
        vm.files_to_upload_max  = 10;
        vm.getUploadedFilesList = getUploadedFilesList;              
        vm.patient_user_id      = vm.patientUserId; //bindings
        vm.processing_getUploadedFilesList = true;  
        vm.processing_upload            = false;
        vm.processing_upload_done       = false;
        vm.promise_getUploadedFilesList;        
        vm.query_grouped_files          = {};
        vm.upload                       = upload;
        vm.uploaded_files_grouped       = [];      

        //will be available to child components
        vm.patientFileGlobalFunctions = {
            removeEmptyGroupedFiles : removeEmptyGroupedFiles
        }
        
        activate();

        // return;
        /////////

        /**
         * 
         */
        function activate() {
            vm.getUploadedFilesList();
            vm.query = {
                order : 'name',
                limit: tableConfig.defaultRowCount,
                rowsPerPage : tableConfig.rowsPerPage, 
                page: 1
            };

            vm.query_grouped_files = {
                filter : '',
                order : '-latest_lastModifiedDate_in_millis',
                reset : function(){
                    var _this = this;
                    _this.filter = '';
                    _this.order = '-latest_lastModifiedDate_in_millis';
                }
            }

        }

        /**
         * 
         */
        function addFilesToUpload(files){

            if (files && files.length) { //has value

                if ( vm.processing_upload_done ){ //reset if after done upload
                    vm.files_to_upload = [];
                    vm.processing_upload_done = false;
                }                

                _.each(files, function(file){

                    //validate                    
                    if ( vm.files_to_upload.length >= vm.files_to_upload_max )
                        return;

                    //process
                    file.formatted_file_size = formatSize(file.size);
                    file.category = null;

                    vm.files_to_upload.push(file);
                });
            }
        }

        /**
         * 
         */
        function clearAll() {
            vm.files_to_upload = [];
            vm.processing_upload_done = false;
        }        

        /**
         * 
         */
        function deleteFile(file){
            var _index = vm.files_to_upload.indexOf(file);
            vm.files_to_upload.splice(_index, 1);
        }

        /**
         * 
         */
        function formatSize(bytes){
          var format = 'KB';

            if (bytes.toString().length >= 7){
                format = 'MB';
                bytes = (bytes/1000) / 1000;
            }else {
                format = 'KB';
                bytes = bytes/1000;
            }
            var formatedSize = parseFloat(bytes).toFixed(2) + " " + format;
            return formatedSize;
        }
        
        /**
         * 
         */
        function getUploadedFilesList(){

            vm.processing_getUploadedFilesList = true;
            vm.uploaded_files_grouped = [];

            var _options = {
                bMetadata : true,
                bGenerateUrl : true, 
                Duration : (60 * 30) /* 60 * 30 = 30 minutes */
            };

            vm.promise_getUploadedFilesList = patientFileDataService
                .getMePhysicianPatientDocListGrouped(vm.patient_user_id, _options)
                .then(function(_grouped_files){
                    vm.uploaded_files_grouped = _grouped_files;
                    vm.processing_getUploadedFilesList = false;
                });
        }
        
        /**
         * 
         */
        function upload() {            
            if ( vm.processing_upload )
                return;
            vm.processing_upload = true;
            vm.processing_upload_done = false;
            
            var _promises = [];
            _.each(vm.files_to_upload, function(file_to_upload){
                if ( file_to_upload.uploading )
                    return;
                file_to_upload.uploading = true;

                var _category = file_to_upload.category;
                var _promise = patientFileDataService
                                    .uploadPhysicianPatientDocument(file_to_upload, vm.patient_user_id, _category)
                                    .then(function(result){
                                        file_to_upload.uploading = false;
                                        file_to_upload.uploaded = true;
                                        return result;
                                    }, function(err){
                                        file_to_upload.uploading = false;
                                        file_to_upload.upload_failed = true;
                                        return err;                                        
                                    });
                                                   
                _promises.push(_promise);
            });

            //trigger when all files are uploaded
            $q.all(_promises)
                .then(function(results){
                    vm.processing_upload = false;
                    vm.processing_upload_done = true;
                    vm.query_grouped_files.reset();
                    vm.getUploadedFilesList();
            });
        }

        /**
         * 
         */
        function removeEmptyGroupedFiles(file){
            var _groups_to_remove = [];
            _.each(vm.uploaded_files_grouped, function(grouped_files){
                if ( grouped_files.files.length <= 0 )
                    _groups_to_remove.push(grouped_files);
            });

            _.each(_groups_to_remove, function(grouped_files){
                var _index = vm.uploaded_files_grouped.indexOf(grouped_files);
                if ( _index > -1 )
                    vm.uploaded_files_grouped.splice(_index, 1);
            });
        }     

    }

})();