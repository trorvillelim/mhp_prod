'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('patientRecommendationList', {
            templateUrl : 'components/patient-recommendation-list/patient-recommendation-list.component.html',
            controller : Controller
    });

    Controller.$inject = ['mhpApiService', '$location', 'tableConfig', 'defaultParam',
        '$routeParams', '$scope', 'timeService', 'utilityService', '$filter'];
    function Controller(mhpApiService, $location, tableConfig, defaultParam,
        $routeParams, $scope, timeService, utilityService, $filter){
        var vm = this;

        vm.recommendations = [];
        vm.query = {};
        vm.search_value = '';
        vm.recommendation_to_view = {};
        vm.recommendation_to_view_copy = {};
        vm.show_details = false;
        vm.tableConfig = tableConfig;
        vm.get_recommendation;
        vm.patientId = $routeParams.patientId;

        vm.updateRecommendationList = updateRecommendationList;
        vm.editClick = editClick;
        vm.deleteClick = deleteClick;
        vm.createNew = createNew;
        vm.userInfo;
        vm.physicianId;
        vm.process_updateRecommendationList = true;

        vm.rec_list_length = 0;
        activate();
   
        ///////

        function activate(){
            vm.query = {
                order : '-unixRecDate',
                limit: vm.tableConfig.defaultRowCount,
                page: 1,
            }

            getUserInfo();
            getPhysicianID()
            onShow();
        }

        function getUserInfo(){
            mhpApiService.getLoggedUserInfo().then(function(result){
                 vm.userInfo = result.user;
            });
        }

        function getPhysicianID(){
            var _url = '/api/GetMePhysicianV1';            
                            
            mhpApiService.get(_url, {}, true).then(function(result){
            vm.physicianId = result.id;           

            }, function(result){
                console.log('mhpApiService error', result);
            });
        }

        function updateRecommendationList(callback) {
            var _url = '/api/GetMePhysicianPatientV2';
            var _request_param = '?patientUserId=' + vm.patientId + 
                            '&startDate=' + defaultParam.startDate +
                            '&endDate=' + defaultParam.endDate +
                            '&bCondition=false' + 
                            '&bBpm=false' + 
                            '&bNotification=false' + 
                            '&bRecommendation=true' + 
                            '&bDrug=false' + 
                            '&bPhysician=false' +
                            '&bRA=false'+
                            '&bReviewLog=false';
                            
            vm.process_updateRecommendationList = true;                            
            vm.get_recommendation = mhpApiService
                .get(_url + _request_param, {}, true)
                .then(function(result){
                    vm.recommendations = result.recommendations;
                    vm.patientDetails = result;

                    // Temporary for displaying date
                    _.each(result.recommendations, function(rec, i){
                        // var recomDate = new Date(rec.recDate);
                        // vm.recommendations[i].recDate = recomDate;

                        // var currentTime = new Date();

                        // if ( recomDate.getTime() >= currentTime.getTime() ){
                        //     vm.recommendations[i].isRecDateGreater = true;
                        // }

                        var recom_Date = moment(rec.recDate ).format('YYYY-MM-DD HH:mm');// local time
                        var current_Time =  moment( new Date() ).format('YYYY-MM-DD HH:mm');

                        var recomDateUnix = moment(rec.recDate).format('x');
                        var currentTimeUnix = moment(new Date()).format('x');

                        // converted model to unix milliseconds for accurate sorting
                        vm.recommendations[i].unixRecDate = moment(rec.recDate ).format('x');

                        if ( recomDateUnix >= currentTimeUnix ){
                            vm.recommendations[i].isRecDateGreater = true;
                        }

                    });

                    vm.process_updateRecommendationList = false;
                    callback()

                }, function(result){
                    console.log('mhpApiService error', result);
                }
            );

        }

        function editClick(recommendationId){
            // $location.path('/patient/recommendation_details/' + recommendationId);
            vm.recommendation_to_view = {};
            var _recommendation_to_view = _.findWhere(vm.recommendations, {id: recommendationId});
            // console.log('reco', _recommendation_to_view)

            vm.recommendation_to_view = _recommendation_to_view;
            vm.recommendation_to_view_copy = angular.copy(vm.recommendation_to_view);
            vm.show_details = true;            
        }

        function deleteClick(recommendationId){

            var _recommendation_to_view = _.findWhere(vm.recommendations, {id: recommendationId});
            var _index = vm.recommendations.indexOf(_recommendation_to_view);
            vm.recommendations.splice(_index, 1);
        }

        function createNew(){
            
            vm.recommendation_to_view = {};
            var _recommendation_to_view = {
                            "id" : 0,
                            "status" : 0,
                            "createdDate" : Date.now(),
                            "createdBy" : vm.userInfo.email,
                            "lastModifiedDate" : Date.now(),
                            "lastModifiedBy" : vm.userInfo.email,
                            "patientId" : vm.patientDetails.id,
                            "physicianId" : vm.physicianId,
                            "physician" :  vm.userInfo.lName
                        }

            // Temporary fix for datepicker error passing string
            _recommendation_to_view.date = new Date(_recommendation_to_view.date);

            vm.recommendation_to_view = _recommendation_to_view;
            vm.recommendation_to_view_copy = angular.copy(vm.recommendation_to_view);
            vm.show_details = true;      

            console.log("_recommendation_to_view",_recommendation_to_view);
           
        }        

        function onShow(){
            $scope.$watch('$ctrl.show_details', function(newVal){

                if (!newVal) { // detail is not shown

                    // refresh table
                    updateRecommendationList(function () {

                        if (vm.rec_list_length == 0){
                            vm.rec_list_length = vm.recommendations.length;
                            vm.query.order = '-unixRecDate';

                        }else{
                            var shouldSortById =  utilityService.isNewElementInArray(vm.recommendations, vm.rec_list_length);
                            if (shouldSortById){
                                vm.recommendations =  utilityService.sortByNewItemOnTop(vm.recommendations, '-unixRecDate',  '-id');
                                vm.query.order = 'undefined'
                            }else {
                                vm.query.order = '-unixRecDate'; // in-case there is a deletion of element will sort them by default
                            }
                        }
                        vm.rec_list_length = angular.copy( vm.recommendations.length );
                    });

                };

            });
        }

        function isNewElementInArray(array, length) {
            if (length == 0){
                return false;
            }
            else {
                if (array.length != length){
                    return true;
                }else{
                   return false;
                }
            }
        }
    }

})();