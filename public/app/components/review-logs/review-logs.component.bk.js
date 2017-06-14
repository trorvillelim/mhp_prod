'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('reviewLogs', {
            templateUrl : 'components/review-logs/review-logs.component.html',
            controller : Controller
    });

    Controller.$inject = [  'mhpInhouseApiService', 'mockApiService', 'mhpApiService', '$window','$routeParams', 'tableConfig', '$route'];
    function Controller( mhpInhouseApiService, mockApiService, mhpApiService , $window, $routeParams, tableConfig, $route ){
        var vm = this;

        vm.patients = [];
        vm.getPatientsByPhysicianIdData = {};

        vm.tableConfig = tableConfig;
        vm.post_getPatientByPhysicianId;

        vm.patientClick = patientClick;

        activate();

        ///////

        function activate(){

            vm.query = {
                order : 'patientId',
                limit: tableConfig.defaultRowCount,
                page: 1,
            }
            
            getUserId()

            if(vm.startDate == "" && vm.endDate == ""){              
                vm.getPatientsByPhysicianIdData = {
                    "UserId":"",
                    "StartDate" : "2001/01/01 00:00:00",
                    "EndDate" : "2051/01/01 00:00:00"
                }
            }
            else{               
                vm.getPatientsByPhysicianIdData = {
                    "UserId":"",
                    "StartDate" : vm.startDate,
                    "EndDate" : vm.endDate
                }
            }
          
           
            getPatientsByPhysicianId();
               
        }

         function getUserId(){

            mhpApiService.getUserId().then(function(result){
                vm.getPatientsByPhysicianIdData.UserId = result;
            }, function(result){
                    console.log('getUserId issue', error);
            });
        }

        function getPatientsByPhysicianId(){

                vm.post_getPatientByPhysicianId = mhpInhouseApiService
                    .post('/api/DoctorLogs',vm.getPatientsByPhysicianIdData)
                    .then(
                            function(result){
                                console.log('patient list results', result);
                                vm.patients = result.message;
                                vm.patientsJSON = result.message;
                        }, function(result){
                            console.log('/api/DoctorLogs Error', error);
                    });   
        }

        function patientClick(patientUserId) {
            vm.route = "#!/patient/patient_review_log/" + patientUserId;
            $window.location.href = vm.route;   
           
        }
       

    }

})();