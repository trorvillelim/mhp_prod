'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('patientRecommendationDetails', {
            templateUrl : 'components/patient-recommendation-details/patient-recommendation-details.component.html',
            bindings : {
                recommendationToView : '=',
                recommendationToViewCopy : '<',
                recommendations : '=',
                showDetails : '='
            },
            controller : Controller
    });

    Controller.$inject = ['$scope', '$routeParams', 'mhpDialog', '$msg' , 'mhpApiService', 'defaultParam'];
    function Controller($scope, $routeParams, mhpDialog, $msg, mhpApiService, defaultParam){
        var vm = this;

        vm.submit = submit;
        vm.cancel = cancel;
        vm.patientId = $routeParams.patientId;
        vm.recDateRegex = /[/\d/]{4}[-][/\d/]{2}[-][/\d/]{2}[/\s/][/\d/]{2}[:][/\d/]{2}[/\s/](am|pm)$/;
        vm.currentDate = moment();

        activate();

        ///////

        function activate(){
           if (!vm.recommendationToView.recText){
               vm.recommendationToView.recDate =  new Date() ;
           }
        }

        function cancel(){
            vm.recommendationToView.text = vm.recommendationToViewCopy.text;
            vm.showDetails = false;        
            resetFormValidation();
        }


        function updateRecommendationList() {
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
                            
            vm.get_recommendation = mhpApiService.get(_url + _request_param, {}, true).then(function(result){
            vm.recommendations = result.recommendations;
            vm.patientDetails = result;

               // Temporary for displaying date
                _.each(result.recommendations, function(rec, i){
                    vm.recommendations[i].recDate = new Date(rec.recDate);
                })

            }, function(result){
                console.log('mhpApiService error', result);
            });
        }  

        function submit(){

            if ($scope.recommendationDetailsForm.$valid){

                var reccomDate = new Date(vm.recommendationToView.recDate);
                // vm.recommendationToView.recDate = moment(reccomDate).utc().format('YYYY-MM-DD[T]HH:mm');
                vm.recommendationToView.recDate = moment(reccomDate).format('YYYY-MM-DD[T]HH:mm');
                var obj = {"recommendations":[vm.recommendationToView]};

                upsertMePhysicianPatientV2(obj,function(success){

                    if (success) {
                        // mhpDialog.showDialog('Patient Recommendation', 'Recommendation Upsert Successful ');
                        updateRecommendationList();                        
                    } else {
                        mhpDialog.showDialog('Patient Recommendation', $msg.errorAPI);
                    }

                    vm.showDetails = false;
                    vm.recommendationToView = {};
                    resetFormValidation();
                })

            }
        }

        function resetFormValidation(){
            $scope.recommendationDetailsForm.$setPristine();
            $scope.recommendationDetailsForm.$setUntouched();     
            console.log("reset reset reset");
        }


        function upsertMePhysicianPatientV2(data,callback) {
            var _url = '/api/UpsertMePhysicianPatientV2';
            var _request_param = '?patientUserId=' + vm.patientId;

            mhpApiService.post(_url + _request_param, data, {}, true).then(function(result){
                console.log('mhpApiService success', result);               
                callback(true);
            }, function(result){
                console.log('mhpApiService error', result);
                callback(false);
            });
        }

        

    }

})();