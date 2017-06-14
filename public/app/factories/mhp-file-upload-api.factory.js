'use strict';
(function(){
    
    /*
        User Info
    */
    angular
        .module('app.factory.module')
        .factory('mhpFileUploadAPIService', Service);
 
    Service.$inject = [
                        '$q', 
                        'Upload', 
                        'config', 
                        'mhpApiService', 'debugService'
                       ];
    function Service(   
                        $q, 
                        Upload, 
                        config,
                        mhpApiService, debugService
                    ){

        var _base_url = config.mhp_api_file_url;

        //public services
        var services = {
            convertDataUrlToBlob : convertDataUrlToBlob,
            uploadPhysicianPatientDocument: uploadPhysicianPatientDocument
        }
        
        return services;
        
        //////////

        /**
         * 
         * Used on PDF report, specifically
         * from pdfmake //pdfMake.createPdf(dd).getDataUrl()
         */
        function convertDataUrlToBlob(dataURL, filename){
            var _blob = Upload.dataUrltoBlob(dataURL, filename); 
            _blob.name = filename;
            _blob.lastModifiedDate = new Date();         
            return _blob;   
        }

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

            var _url = _base_url;
            if ( debugService.isDirectAPIAccess() )
                _url = config.mhp_api_url_direct;            
            _url += '/api/UploadMePhysicianPatientDocument';

            //subject for change, specially when clarifications 
            //were made interms of using the APIs ( tags, meta, etc..)
            var _form_data = {};            
            if ( custom_data && custom_data != null && typeof custom_data == 'object' )
                _form_data = custom_data;            

            _form_data.patientUserId = patientUserId;
            _form_data.FMETA_category = category;


            return uploadFile(_url, file, _form_data);

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
    }

})();