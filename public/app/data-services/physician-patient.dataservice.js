'use strict';
/********************************************
 * 
 *********************************************/
(function(){
    
    angular
        .module('app.dataservice.module')
        .factory('physicianPatientDataService', Service);

    Service.$inject = [ 
                        '$q', '$filter', 
                        'mhpApiService', 
                        'defaultParam'
                        ];
    function Service(   
                        $q, $filter, 
                        mhpApiService, 
                        defaultParam
                    ){

        var _urls = {
            getMePhysicianPatient : '/api/GetMePhysicianPatientV2'
        };
        
        var _utils = {
            validateParameters : validateParameters,
            convertToDateRange : convertToDateRange,
            convertToBooleanValue : convertToBooleanValue,
            processNotifications : processNotifications,
            processRecommendations : processRecommendations, 
            processPatientDrugs : processPatientDrugs,
            isDateWithinRange : isDateWithinRange
        }

        var _formats = {
            date_time : 'yyyy-MM-dd hh:mm a',
            date : 'yyyy-MM-dd',
        }

        var _services = {
            getMePhysicianPatient : getMePhysicianPatient,
            getPatientInformation : getPatientInformation,                        
            formats : _formats
        }

        return _services;

        ////////


        /**
         * 
         * filter (object) :
         * 
         *  - bCondition ( boolean )        - 
         *  - bBpm ( boolean )              - 
         *  - bNotification ( boolean )     - notifications
         *  - bRecommendation ( boolean )   - alert
         *  - bDrug ( boolean )             - medication and notes
         *  - bPhysician ( boolean )        - 
         *  - bRA ( boolean )               - 
         *  - bReviewLog ( boolean )        - 
         * 
         *  - range (object) :
         *      ** start (date | string | millis ) 
         *      ** end (date | string | millis )
         */
        function getMePhysicianPatient(patientUserId, filter){
            var _deferred = $q.defer();

            try {

                _utils.validateParameters(patientUserId, filter);

                var _url = _urls.getMePhysicianPatient;

                var _request_params = [];
                    _request_params.push('?patientUserId=' + patientUserId);
                    _request_params.push('startDate=' + _utils.convertToDateRange(filter.range.start));
                    _request_params.push('endDate=' + _utils.convertToDateRange(filter.range.end));
                    _request_params.push('bCondition=' + _utils.convertToBooleanValue(filter.bCondition));
                    _request_params.push('bBpm=' + _utils.convertToBooleanValue(filter.bBpm));
                    _request_params.push('bNotification=' + _utils.convertToBooleanValue(filter.bNotification));
                    _request_params.push('bRecommendation=' +_utils.convertToBooleanValue(filter.bRecommendation));
                    _request_params.push('bDrug=' + _utils.convertToBooleanValue(filter.bDrug));
                    _request_params.push('bPhysician=' + _utils.convertToBooleanValue(filter.bPhysician));
                    _request_params.push('bRA=' + _utils.convertToBooleanValue(filter.bRA));
                    _request_params.push('bReviewLog=' + _utils.convertToBooleanValue(filter.bReviewLog));

                var _request_url = _url + (_request_params.join('&'));

                mhpApiService
                    .get(_request_url, {}, true)
                    .then(function(result){

                        //process
                        result.patientDrugs = _utils.processPatientDrugs(result.patientDrugs, filter);
                        result.recommendations = _utils.processRecommendations(result.recommendations, filter);
                        result.notificationBases = _utils.processNotifications(result.notificationBases, filter);
                        //notification

                        return _deferred.resolve(result);
                    }, 
                    function(err){
                        return _deferred.reject(err);
                    })
                    .catch(function(err){
                        return _deferred.reject(err);
                    });                
            } catch ( err ){
                _deferred.reject(err);
            }
            return _deferred.promise;
        }

        /**
         * 
         */
         function getPatientInformation(patient_user_id){

            var _filter = {
                bBpm : true,
                range : {
                    start : defaultParam.startDate, 
                    end : defaultParam.endDate
                },
                bCondition: true
            };

            return getMePhysicianPatient(patient_user_id, _filter);
         }

        /****************************************
         *  UTILITIES
         *****************************************/

         /**
          * Will 'throw' exception if validation failed
          */
         function validateParameters(patientUserId, filter){
            if ( !patientUserId )
                throw 'patient userid is required';
            if ( !filter )
                throw 'filter is required';
            if ( !filter.range )
                throw 'filter.range is required';     
         }

        /**
         * 
         * convert to "mm/dd/yyyy"
         */
        function convertToDateRange(dateRange){
            var _format = "MM/DD/YYYY";
            var _converted_date = moment(dateRange).format(_format);
            if ( _converted_date.toLowerCase().indexOf('invalid') > -1 )
                throw "Invalid Date Range " + dateRange;
            return _converted_date;
        }

        /**
         * 
         */
        function convertToBooleanValue(value){
            if ( !value )
                return false;
            return (value == true || ( value.toString().toLowerCase().replace(/\s/g, '') == 'true' ))
        }

        /**
         * 
         */
        function processPatientDrugs(_list, filter){
            var _order_by_field = '-effectiveDate_in_millis';
            var _processed = [];
            if ( !_list )
                return _processed;

            //process, add custom fields
            _list.forEach(function(_item){

                if ( !_utils.isDateWithinRange(filter.range.start, filter.range.end, _item.effectiveDate) )
                    return; //continue                

                _item.effectiveDate_formatted = $filter('date')(_item.effectiveDate, _formats.date_time);
                _item.effectiveDate_in_millis = new Date(_item.effectiveDate).getTime();
                _processed.push(_item);
            });

            return $filter('orderBy')(_processed, _order_by_field);
        }  

        /**
         * 
         */
        function processNotifications(_list, filter){
            var _order_by_field = 'startDate_in_millis';
            var _processed = [];
            if ( !_list )
                return _processed;

            //process, add custom fields
            _list.forEach(function(_item){  

                if ( !_utils.isDateWithinRange(filter.range.start, filter.range.end, _item.startDate) )
                    return; //continue      

                _item.startDate_formatted   = $filter('date')(_item.startDate, _formats.date);
                _item.endDate_formatted     = $filter('date')(_item.endDate, _formats.date);

                _item.startDate_in_millis   = new Date(_item.startDate).getTime();
                _item.endDate_in_millis     = new Date(_item.endDate).getTime();

                //get value from enum filters
                _item.howToEnd_value    = $filter('howToEndEnum')(_item.howToEnd);
                _item.dayOfWeek_value   = $filter('dayOfWeekEnum')(_item.dayOfWeek);
                _item.status_value   = $filter('status')(_item.status);
                
                _processed.push(_item);
            });

            return $filter('orderBy')(_processed, _order_by_field);    
        }

        /**
         * 
         */
        function processRecommendations(_list, filter){
            var _order_by_field = '-recDate_in_millis';
            var _processed = [];
            if ( !_list )
                return _processed;

            //process, add custom fields
            _list.forEach(function(_item){

                if ( !_utils.isDateWithinRange(filter.range.start, filter.range.end, _item.recDate) )
                    return; //continue

                _item.recDate_formatted = $filter('date')(_item.recDate, _formats.date_time);
                _item.recDate_in_millis = new Date(_item.recDate).getTime();
                _processed.push(_item);
            });

            return $filter('orderBy')(_processed, _order_by_field);    
        }      

        function isDateWithinRange(start, end, date_to_test){
            var _start_date_in_millis = new Date(start).getTime();
            var _end_date_in_millis = new Date(end).getTime();
            var _date_to_test = new Date(date_to_test).getTime();
            return _date_to_test >= _start_date_in_millis && _date_to_test <= _end_date_in_millis;
        }
        
    }

})();