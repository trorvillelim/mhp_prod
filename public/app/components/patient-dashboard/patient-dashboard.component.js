'use strict';
(function () {

    angular
        .module('app.component.module')
        .component('patientDashboard', {
            templateUrl: 'components/patient-dashboard/patient-dashboard.component.html',
            controller: Controller
        })
        ;

    Controller.$inject = ['$scope',
                        '$routeParams',
                        'mhpInhouseApiService',
                        'selectedLogFilterService', 'logTierService'];

    function Controller( $scope,
                         $routeParams,
                         mhpInhouseApiService,
                         selectedLogFilterService, logTierService) {
        var vm = this;
       
        vm.userId = $routeParams.patientId;        
        vm.systolic = [];
        vm.diastolic = [];
        vm.heart_rate = [];
        vm.measure_date = [];
        vm.bpMeasurementData = {};

        vm.duration = [];
        vm.reviewed_date = [];
        vm.page_reviewed = [];
        vm.reviewLogData = {};
        vm.isRunning = false;
        vm.data = {};
        vm.totalTimeSpent = "";
        vm.enableDateRange = false;
        vm.logFiltersList = [   {id: 0, name: "Day" },
                                {id: 1, name: "Week" },
                                {id: 2, name: "Month" },
                                {id: 3, name: "DateRange" },
                                {id: 4, name: "All" }];
                                
        vm.getSelectedOnChange = getSelectedOnChange;    
        vm.onEnterKeyPress = onEnterKeyPress;

        vm.selectedLogFilter = selectedLogFilterService;
        vm.getPrevLogs = getPrevLogs;
        vm.getNextLogs = getNextLogs;

        vm.isCurrentSelected = false;
        vm.isPrevSelected = false;
        vm.isNextSelected = false;

        //watch
        $scope.$watch('$ctrl.logFilters', function(){
            vm.getSelectedOnChange()
        }, true);
        activate();

        ///////

        function activate() {           
        }

        function onEnterKeyPress(keyEvent){
            if (keyEvent.which === 13){
                dateRangeInit();
            }
        }

        function initializeDateRangePicker(startDate, endDate ){
            var _startDate = moment();
            var _endDate = moment();

            // for Filter 'this week' and 'this month'
            if (startDate && endDate){
                vm.selectedLogFilter.rangeDate = {          // default date is set, so we need to get date from moment object '_d' key
                    startDate: startDate,
                    endDate  : endDate
                };
            }else {
                vm.selectedLogFilter.rangeDate = {
                    startDate: _startDate,
                    endDate  : _endDate
                };
                console.log('default');
            }

            vm.dateRangeOptions = {
                locale:{format:'YYYY-MM-DD'},
                ranges: {
                    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                    'Last 30 Days': [moment().subtract(29, 'days'), moment()]
                }
            };
            dateRangeInit();

        }

        // listen to dateRangePicker changes, user type or selection inside date picker.
        function dateRangeInit(){
            vm.dateRangeRegex = /[/\d/]{4}[-][/\d/]{2}[-][/\d/]{2}[/\s/][-][/\s/][/\d/]{4}[-][/\d/]{2}[-][/\d/]{2}$/;
            vm.dateRegex = /[/\d/]{4}[/][/\d/]{2}[/][/\d/]{2}/;
            var regex = new RegExp(vm.dateRegex);

            if (vm.datePickerListener){
                vm.datePickerListener(); // unwatch to avoid memory leak
            }

              vm.datePickerListener =  $scope.$watch('$ctrl.selectedLogFilter.rangeDate', function (newVal, oldVal) {
                if (newVal){
                    if (moment.isMoment(newVal.endDate) && moment.isMoment(newVal.endDate )){
                        vm.selectedLogFilter.start_date = moment(new Date(newVal.startDate._d)).format('l');
                        vm.selectedLogFilter.end_date  = moment(new Date(newVal.endDate._d)).format('l');
                    }

                    if (regex.test(newVal.startDate) && regex.test(newVal.endDate) ){
                        vm.selectedLogFilter.start_date = newVal.startDate;
                        vm.selectedLogFilter.end_date = newVal.endDate;
                    }
                }
            });
            vm.isRunning = true;
            getPatientReviewLogData()
        }

        function reInitializePRLChart(){
            vm.duration = [];
            vm.reviewed_date = [];
            vm.page_reviewed = [];

            vm.reviewLogData = {
            labels: vm.page_reviewed,
            data: vm.duration,
            options: {
                    tooltips: {
                        enabled: true,
                        mode: 'single',
                        callbacks: {
                            label: function(tooltipItems, data) { 
                                return tooltipItems.yLabel + ' Minutes';
                            }
                        }
                    },
                     scales: {
                     yAxes: [{
                        ticks: {
                        beginAtZero: true  // minimum value will be 0.,
                        }
                     }]
                    }
                }  
            }
        }

             
        function getSelectedOnChange() {
            
            vm.isCurrentSelected = true;
            vm.isPrevSelected = false;
            vm.isNextSelected = false;
            var curr = new Date();
            switch (vm.logFilters) {
                    case 0:                
                        vm.enableDateRange = false;
                        vm.selectedLogFilter.start_date = moment(curr).format('l');
                        vm.selectedLogFilter.end_date = moment(curr).format('l'); 
                        // initializeDateRangePicker(  vm.selectedLogFilter.start_date, vm.selectedLogFilter.end_date);
                        break;

                    case 1:
                        vm.enableDateRange = false;
                        var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
                        var last = first + 6; // last day is the first day + 6

                        var firstday =  new Date( curr.setDate( first ) ) ;
                        var lastday =  new Date( curr.setDate( last ) ) ;

                        firstday.setHours(0,0,0,0);
                        lastday.setHours(23,59,59,999);

                        vm.selectedLogFilter.start_date = firstday;
                        vm.selectedLogFilter.end_date  = lastday;

                        // initializeDateRangePicker(vm.selectedLogFilter.start_date, vm.selectedLogFilter.end_date );

                        break;

                   case 2:
                        vm.enableDateRange = false;
                        var firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1);
                        var lastDay = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);

                        var firstDayDayWithSlashes = moment(firstDay).format('l');
                        var lastDayWithSlashes = moment(lastDay).format('l');

                        vm.selectedLogFilter.start_date = firstDayDayWithSlashes;
                        vm.selectedLogFilter.end_date  = lastDayWithSlashes;
                        // initializeDateRangePicker(vm.selectedLogFilter.start_date, vm.selectedLogFilter.end_date );
                       break;

                    case 3:
                        vm.enableDateRange = true;
                        vm.selectedLogFilter.start_date = moment(curr).format('l');
                        vm.selectedLogFilter.end_date = moment(curr).format('l');
                        // initializeDateRangePicker(   vm.selectedLogFilter.start_date,   vm.selectedLogFilter.end_date  );
                        break;
                        
                    case 4:
                        vm.enableDateRange = false;
                        vm.selectedLogFilter.start_date = "2001/01/01"
                        vm.selectedLogFilter.end_date = "2051/01/01"
                        // initializeDateRangePicker(vm.selectedLogFilter.start_date, vm.selectedLogFilter.end_date );
                        break;
                    default:
                        vm.enableDateRange = false;
                        var firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1);
                        var lastDay = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);

                        var firstDayDayWithSlashes = moment(firstDay).format('l');
                        var lastDayWithSlashes = moment(lastDay).format('l');

                        vm.selectedLogFilter.start_date = firstDayDayWithSlashes;
                        vm.selectedLogFilter.end_date  = lastDayWithSlashes;
                    break;
                }
                        initializeDateRangePicker(vm.selectedLogFilter.start_date, vm.selectedLogFilter.end_date );
                
        }

        function getPatientReviewLogData(){
           reInitializePRLChart()
            vm.data = {
                "PatientUserId": $routeParams.patientId,
                "StartDate": vm.selectedLogFilter.start_date,
                "EndDate": vm.selectedLogFilter.end_date
            };

            mhpInhouseApiService
            .post('/api/PatientLogsAll', vm.data, true)
            .then(function(result){                    
                var totalSeconds = 0;
                var _logs = result.message;

                _logs.forEach(function(_log){

                    var _minutes = logTierService.convertToDecimal(_log.Seconds / 60, 2);
                    vm.duration.push(_minutes);
                    vm.page_reviewed.push(_log.pageReviewed);
                    vm.reviewed_date.push( _log.latestDateTimeReviewed);
                    totalSeconds += (_log.Seconds);              

                });
                vm.page_reviewed[1] = 'Medications'; // Overwrite the 'Medication' to 'Medications'
                vm.isRunning = false

            }, function(result){
                console.log('mhpInhouseApiService error', result);
            })


            mhpInhouseApiService
            .post('/api/PatientLogs', vm.data, true)
            .then(function(result){                 
                vm.totalTimeSpent = result.message[0].GrandTotalDuration; 
                 
            }, function(result){
                console.log('mhpInhouseApiService error', result);
            })
        }

        function getPrevLogs(){
            vm.isCurrentSelected = false;
            vm.isPrevSelected = true;
            vm.isNextSelected = false;
            var start = new Date(vm.selectedLogFilter.start_date);      
            var end = new Date(vm.selectedLogFilter.end_date );      

            switch (vm.logFilters) {
                    case 0: 
                        var previousDay = new Date(start);
                        previousDay.setDate(start.getDate()-1);
                        vm.selectedLogFilter.start_date = moment(previousDay).format('l');
                        vm.selectedLogFilter.end_date  = moment(previousDay).format('l');
                        break;

                    case 1:    
                        var prevFirst = new Date(start);
                        prevFirst.setDate(start.getDate() - 7);

                        var prevLast = new Date(end);
                        prevLast.setDate(end.getDate() - 7);

                        vm.selectedLogFilter.start_date = moment(prevFirst).format('l');
                        vm.selectedLogFilter.end_date  = moment(prevLast).format('l');
                        break;

                   default :
                        var firstDay = new Date(start.getFullYear(), ( start.getMonth() - 1 ), 1);
                        var lastDay = new Date(start.getFullYear(), ( start.getMonth() - 1) + 1, 0);

                        vm.selectedLogFilter.start_date = moment(firstDay).format('l');
                        vm.selectedLogFilter.end_date = moment(lastDay).format('l');
                        break;
                }
                initializeDateRangePicker(vm.selectedLogFilter.start_date,vm.selectedLogFilter.end_date);
                
        }

        function getNextLogs(){
            vm.isCurrentSelected = false;
            vm.isPrevSelected = false;
            vm.isNextSelected = true;
            var start = new Date(vm.selectedLogFilter.start_date);      
            var end = new Date(vm.selectedLogFilter.end_date );     

            switch (vm.logFilters) {
                    case 0: 
                        var nextDay = new Date(start);
                        nextDay.setDate(start.getDate()+1);
                        vm.selectedLogFilter.start_date = moment(nextDay).format('l');
                        vm.selectedLogFilter.end_date  = moment(nextDay).format('l');
                        break;

                    case 1:    
                        var nextFirst = new Date(start);
                        nextFirst.setDate(start.getDate() + 7);

                        var nextLast = new Date(end);
                        nextLast.setDate(end.getDate() + 7);

                        vm.selectedLogFilter.start_date = moment(nextFirst).format('l');
                        vm.selectedLogFilter.end_date  = moment(nextLast).format('l');
                        break;

                   default :
                        var firstDay = new Date(start.getFullYear(), ( start.getMonth() + 1 ), 1);
                        var lastDay = new Date(start.getFullYear(), ( start.getMonth() + 1 ) + 1, 0);

                        vm.selectedLogFilter.start_date  = moment(firstDay).format('l');
                        vm.selectedLogFilter.end_date = moment(lastDay).format('l');
                        break;
                              

                }
                initializeDateRangePicker(vm.selectedLogFilter.start_date,vm.selectedLogFilter.end_date);
                checkIfCurrent(vm.selectedLogFilter.start_date,vm.logFilters);
                
        }

        function checkIfCurrent(startDate, logFilterSelected){

            var curr = new Date();
            var currentStartDate;
             switch (logFilterSelected) {
                    case 0:               
                        currentStartDate = moment(curr).format('l');                        
                        break;
                    case 1:                      
                        var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
                        var firstday =  new Date( curr.setDate( first ) ) ;
                        firstday.setHours(0,0,0,0);
                        currentStartDate = moment(firstday).format('l');
                        break;

                   default:                       
                        var firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1);
                        var firstDayDayWithSlashes = moment(firstDay).format('l');
                        currentStartDate = firstDayDayWithSlashes;
                       break;
                }

            if (startDate == currentStartDate){
                vm.isCurrentSelected = true;
            }
        }
    }
})();