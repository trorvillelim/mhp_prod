'use strict';
(function(){
    
    /*
        User Info
    */
    angular
        .module('app.dataservice.module')
        .factory('patientFileDataService', Service);
 
    Service.$inject = [
                        '$q', '$filter', 
                        'Upload', 
                        'config', 
                        'mhpApiService', 'debugService', 
                        'apiUrlBuilderService', 
                       ];
    function Service(   
                        $q, $filter,
                        Upload, 
                        config,
                        mhpApiService, debugService, 
                        apiUrlBuilderService
                    ){

        var _version_prefix_id = '-file_version-';
        var _file_upload_base_url = config.mhp_api_file_url;

        //public services
        var services = {
            uploadPhysicianPatientDocument: uploadPhysicianPatientDocument,
            getMePhysicianPatientDocList : getMePhysicianPatientDocList,
            getMePhysicianPatientDocListGrouped : getMePhysicianPatientDocListGrouped,
            deleteMePhysicianPatientDocument : deleteMePhysicianPatientDocument
        }
        
        return services;
        
        //////////

        /**
         * 
         * category - String : set to FMETA_category
         * custom_data - (object) : used for setting meta, tags etc., 
         *  - FMETA_? - meta fields 
         *  - FTAG_? - tag fields
         */
        function uploadPhysicianPatientDocument(file, patientUserId, category, custom_data){


            //validations
            if ( !patientUserId )
                throw 'patientId is required';
            if ( !category )            
                throw 'category is required';

            var _url = _file_upload_base_url;                   
                _url += '/api/UploadMePhysicianPatientDocument';

            //UPDATE file info            
            var _form_data = {};            
            if ( custom_data && custom_data != null && typeof custom_data == 'object' )
                _form_data = custom_data;            

            var _file_original_name = file.name;
            //versionize filename
            _form_data.filename =  addVersionToFileName(_file_original_name);
            _form_data.patientUserId = patientUserId;
            _form_data.FMETA_category = category;
            _form_data.FMETA_file_original_name = _file_original_name;

            return uploadFile(_url, file, _form_data);

        }

        /**
         * 
         */
        function deleteMePhysicianPatientDocument(patient_user_id, file_doc_name){
            var _url = '/api/DeleteMePhysicianPatientDocument?patientUserId='+patient_user_id+'&fileName='+file_doc_name;
            return mhpApiService.post(_url, {}, null, true);           
        }

        /**
         * patient_user_id (string)
         * options (object)
         *  - FilePrefix (string)
         *  - bMetadata (boolean)
         *  - bTags (boolean)
         *  - bGenerateUrl (boolean)
         *  - Duration ( int ) : in seconds
         */
        function getMePhysicianPatientDocList(patient_user_id, options){
            options = (options && typeof options == 'object')?options : {};

            var _url = '/api/GetMePhysicianPatientDocList';
            var _url_builder = apiUrlBuilderService.getBuilder(_url);            
                _url_builder.addParam('patientUserId', patient_user_id);
                _url_builder.addParam('FilePrefix', options.FilePrefix);
                _url_builder.addBooleanParam('bMetadata', options.bMetadata, true);
                _url_builder.addBooleanParam('bTags', options.bTags, true);
                _url_builder.addBooleanParam('bGenerateUrl', options.bGenerateUrl, true);
                _url_builder.addParam('Duration', options.Duration);

            return mhpApiService
                    .get(_url_builder.build(), null, true)
                    .then(function(_files){
                        _.each(_files, function(_file){
                            //add new fields

                            //get info on meta data
                            var _meta = _file.metDict;
                            var _category = '';
                            var _original_file_name = getOriginalFileName(_file.docName);
                            if ( _meta ) {
                                _category = _meta.fmeta_category;
                                _original_file_name = (_meta.fmeta_file_original_name)?_meta.fmeta_file_original_name:_original_file_name;
                            }

                            _file.name = _file.docName;
                            _file.original_file_name = _original_file_name;
                            _file.category = _category;
                            _file.formatted_file_size = formatSize(_file.size);
                            _file.formatted_lastModifiedDate = $filter('date')(_file.lastModifiedDate, 'yyyy-MM-dd');
                            _file.lastModifiedDate_in_millis = new Date(_file.lastModifiedDate).getTime();
                        });                      
                        return _files;
                    });            
        }

        /**
         * patient_user_id (string)
         * options (object)
         *  - FilePrefix (string)
         *  - bMetadata (boolean)
         *  - bTags (boolean)
         *  - bGenerateUrl (boolean)
         *  - Duration ( int ) : in seconds
         */
        function getMePhysicianPatientDocListGrouped(patient_user_id, options){
            return getMePhysicianPatientDocList(patient_user_id, options)
                        .then(function(_files){
                            //group
                            var _grouped_files = [];

                            _files = $filter('orderBy')(_files, '-lastModifiedDate_in_millis');

                            _.each(_files, function(_file, index){
                                var _group_name = getOriginalFileName(_file.docName)
                                var _group = _.findWhere(_grouped_files, {name : _group_name});
                                if ( !_group ){ //initialize
                                    var _id = _group_name.replace(/ /g,"-").toLowerCase();
                                    _group = {
                                        id : _id,
                                        name : _group_name,
                                        latest_lastModifiedDate : _file.lastModifiedDate,
                                        latest_lastModifiedDate_in_millis : _file.lastModifiedDate_in_millis,
                                        total_file_size : 0,
                                        formatted_total_file_size : '',
                                        files : []
                                    };
                                    _grouped_files.push(_group);
                                }
                                _group.total_file_size += _file.size;
                                _group.formatted_total_file_size = formatSize(_group.total_file_size);
                                _group.files.push(_file);
                            });

                            return _grouped_files;
                        });
        }


        /**
         * 
         */
        function uploadFile(url, file, data){

            var _deferred = $q.defer();
            mhpApiService
                .getAccessToken()
                .then(function(token){      

                    if ( !data || typeof data != 'object' )
                        data = {};
                    
                    //add file to data
                    data.file = file;
                    Upload.upload({
                        url : url, 
                        data : data,
                        headers : {
                            'Authorization' : 'Bearer ' + token
                        }
                    })
                    .then(_deferred.resolve, _deferred.reject)
                    .catch(_deferred.reject);

                }, function(err){
                    console.log('uploadPhysicianPatientDocument', 'unable to get access token', err);
                    _deferred.reject(err);
                }
            );                    
            return _deferred.promise;

        }

        /************
         * UTILS
         ************/
        
        /**
         * 
         */
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

        /**
         * 
         */
        function getOriginalFileName(filename){
            var _extension = extractFileExtenstion(filename);
            var _original_file_name = removeFileExtension(filename);
                _original_file_name = _original_file_name.split(_version_prefix_id)[0];
            return _original_file_name + _extension;

        }

        /**
         * 
         */
        function addVersionToFileName(filename){
            var _extension = extractFileExtenstion(filename);
            var _file_name_wo_ext = removeFileExtension(filename);
            var _version = _version_prefix_id + new Date().getTime() + '-' + Math.floor(Math.random() * 10000);
            return _file_name_wo_ext + _version + _extension;
        }

        /**
         * 
         * returns .xml, .jpg or empty string ('') if
         *          no extension found
         */
        function extractFileExtenstion(filename){
            return (/[.]/.exec(filename)) ? '.' + (/[^.]+$/.exec(filename)[0]) : "";
        }

        /**
         * removes file extension
         *  'hello.jpg' = 'hello'
         */
        function removeFileExtension(filename){
            return filename.replace(/\.[^/.]+$/, "");
        }
    }

})();