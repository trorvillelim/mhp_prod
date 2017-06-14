'use strict';
(function(){
    
    angular
        .module('app.factory.module')
        .factory('patientApiService', Service);

    Service.$inject = [
                        '$http', '$q', 
                        'mhpApiService', 
                        'defaultParam'];
    function Service(
                        $http, $q, 
                        mhpApiService, 
                        defaultParam){

        var _urls = {
            getPatientInformation : '/api/GetMePhysicianPatientV2'
        }                            

        var services = {
            getPatientInformation : getPatientInformation
        }
        
        return services;
        
        //////////

        function getPatientInformation(patient_id){

            var _url = _urls.getPatientInformation;

            var _request_param = '?patientUserId=' + patient_id + 
                            '&startDate=' + defaultParam.startDate +
                            '&endDate=' + defaultParam.endDate +
                            '&bCondition=true' + 
                            '&bBpm=false' + 
                            '&bNotification=false' + 
                            '&bRecommendation=false' + 
                            '&bDrug=false' + 
                            '&bPhysician=false' +
                            '&bRA=false'+
                            '&bReviewLog=false';

            return mhpApiService.get(_url + _request_param, {}, true);
        }    

    }

})();