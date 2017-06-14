'use strict';
(function () {

    angular
        .module('app.component.module')
        .component('patientReviewLogList', {
            templateUrl: 'components/patient-review-log-list/patient-review-log-list.component.html',
            bindings: {
                logListId : '=',
                isManual : '=',
                logFilters : '=',
                totalTimeSpent : '=',
                enableDateRange: '=',
                physicianInfo : '<', 
                patientInfo : '<',
            },
            controller: Controller
        });

    Controller.$inject = [  
                            '$scope', '$routeParams', '$window', '$location', '$route', 
                            '$filter', '$mdToast', 
                            'mhpInhouseApiService', 'mhpApiService', 
                            'patientFileDataService', 
                            'timeService', 'utilityService', 'selectedLogFilterService',  
                            'pdfMakeService', 'logTierService', 
                            'physicianPatientDataService', 'patientReportContentToPDFService', 
                            'tableConfig', 'mhpDialog' ];
    function Controller(    
                            $scope, $routeParams, $window, $location, $route, 
                            $filter, $mdToast, 
                            mhpInhouseApiService, mhpApiService, 
                            patientFileDataService, 
                            timeService, utilityService, selectedLogFilterService,
                            pdfMakeService, logTierService, 
                            physicianPatientDataService, patientReportContentToPDFService, 
                            tableConfig, mhpDialog  ) {
        var vm = this;

        vm.data = {};
        vm.tableConfig = tableConfig;
        vm.post_patient_logs;
        vm.start_date = "";
        vm.end_date = "";
        vm.logValue = {};
        vm.userId;
        vm.show_details = false;
        // vm.logValue.PageReviewed = {id: 4, value: "Others"};
        vm.pageReviewedList = [ {id: 0, name: "Notifications" },
                                {id: 1, name: "Patient Drugs" },
                                {id: 2, name: "BP Measurements" },
                                {id: 3, name: "Recommendations" }
                              ];
                        
        vm.getLogsByPatientId = getLogsByPatientId;
        vm.onClickPrev = onClickPrev;
        vm.onAddTimeLog = onAddTimeLog;
        vm.is_manual = vm.isManual;
        vm.totalTimeSpent = "";
        vm.enableDateRange = false;
        vm.logFiltersList = [   {id: 0, name: "Day" },
                                {id: 1, name: "Week" },
                                {id: 2, name: "Month" },
                                {id: 3, name: "DateRange" },
                                {id: 4, name: "All" }];
        vm.getSelectedOnChange = getSelectedOnChange;                                
        vm.selectedLogFilter = selectedLogFilterService;
        vm.getPrevLogs = getPrevLogs;
        vm.getNextLogs = getNextLogs;
        vm.delete_patient_log;
        vm.deleteTimeLog = deleteTimeLog
        vm.onEnterKeyPress = onEnterKeyPress;
        vm.time_logs_to_view = {};
        vm.time_logs_to_view_copy = {};
        vm.focus = false;
        vm.logs_length = 0;
        vm.showEdit = showEdit;

        vm.processing_getLogsByPatientId = true;
        vm.processing_download_report = false;        
        vm.processing_upload_report = false;

        //export PDF
        vm.exportPDF = exportPDF;

        vm.patient_id = $routeParams.patientId;
        vm.patient_total_logs;
        vm.patient_total_logs_duration_in_seconds;
        vm.isCurrentSelected = false;
        vm.isPrevSelected = false;
        vm.isNextSelected = false;


        //watch
        $scope.$watch('$ctrl.logFilters', function(){
            vm.getSelectedOnChange();
            // vm.getLogsByPatientId();
        }, true);

        activate();

        ///////

        function activate() {

            vm.query = {
                order: '-latestDateTimeReviewed',
                limit: tableConfig.defaultRowCount,
                page: 1,
            }

            onShow();
            getUserId();
        }

        function onEnterKeyPress(keyEvent){
            if (keyEvent.which === 13){
                dateRangeInit();
            }
        }

        function onShow(){
            $scope.$watch('$ctrl.show_details',function (showDetails, oldVal) {
                if(!showDetails){
                    getLogsByPatientId();
                }
            });
        }

        function initializeDateRangePicker(startDate, endDate){

            // default Date
            var _startDate = moment();
            var _endDate = moment();

            // for Filter 'this week' and 'this month'
             if(startDate && endDate){
                vm.selectedLogFilter.rangeDate = {
                    startDate: startDate,
                    endDate  : endDate
                };

             }else {
                vm.selectedLogFilter.rangeDate = {
                    startDate: _startDate,
                    endDate  : _endDate
                };
             }
            vm.dateRangeOptions = {
                locale:{format:'YYYY-MM-DD'},
                ranges: {
                    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                    'Last 30 Days': [moment().subtract(29, 'days'), moment()]
                }
            }

            dateRangeInit();
        }

        // listen to dateRangePicker changes, the user type or selection inside date picker.
        function dateRangeInit(){

            vm.dateRangeRegex = /[/\d/]{4}[-][/\d/]{2}[-][/\d/]{2}[/\s/][-][/\s/][/\d/]{4}[-][/\d/]{2}[-][/\d/]{2}$/;
            vm.dateRegex = /[/\d/]{4}[/][/\d/]{2}[/][/\d/]{2}/;
            var regex = new RegExp(vm.dateRegex);

            if (vm.datePickerListener){
                vm.datePickerListener(); // unwatch to avoid memory leak
            }

            vm.datePickerListener =  $scope.$watch('$ctrl.selectedLogFilter.rangeDate', function (newVal, oldVal) {
                if (newVal){

                    // if user type or select on date picker
                    if (moment.isMoment(newVal.endDate) && moment.isMoment(newVal.endDate )){
                        vm.selectedLogFilter.start_date = moment(new Date(newVal.startDate._d)).format('l');
                        vm.selectedLogFilter.end_date  = moment(new Date(newVal.endDate._d)).format('l');
                    }
                    else {
                        if (regex.test(newVal.startDate) && regex.test(newVal.endDate)){
                            vm.selectedLogFilter.start_date = newVal.startDate;
                            vm.selectedLogFilter.end_date = newVal.endDate;
                       }
                    }
                    getLogsByPatientId();
                }
            });
        }

      
       

        function getSelectedOnChange() {
            vm.isCurrentSelected = true;
            vm.isPrevSelected = false;
            vm.isNextSelected = false;
            var curr = new Date();

            switch (vm.logFilters) {
                    case 0:
                        vm.enableDateRange = false;
                        vm.selectedLogFilter.start_date = moment(curr).format('l');;
                        vm.selectedLogFilter.end_date =   moment(curr).format('l');;
                        initializeDateRangePicker(  vm.selectedLogFilter.start_date, vm.selectedLogFilter.end_date);
                            
                        break;     

                    case 1:
                        vm.enableDateRange = false;
                        var first = curr.getDate() - curr.getDay();
                        var last = first + 6;

                        var firstday =  new Date( curr.setDate( first ) ) ;
                        var lastday =  new Date( curr.setDate( last ) ) ;

                        firstday.setHours(0,0,0,0);
                        lastday.setHours(23,59,59,999);

                        vm.selectedLogFilter.start_date = firstday;
                        vm.selectedLogFilter.end_date  = lastday;
                        initializeDateRangePicker(  vm.selectedLogFilter.start_date, vm.selectedLogFilter.end_date);

                        break;

                   case 2:
                        vm.enableDateRange = false;
                        var firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1);
                        var lastDay = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);

                        var firstDayDayWithSlashes = moment(firstDay).format('l');
                        var lastDayWithSlashes = moment(lastDay).format('l');

                        vm.selectedLogFilter.start_date = firstDayDayWithSlashes;
                        vm.selectedLogFilter.end_date  = lastDayWithSlashes;
                        initializeDateRangePicker(  vm.selectedLogFilter.start_date, vm.selectedLogFilter.end_date);
                        
                        break;

                    case 3:
                        vm.enableDateRange = true;
                        initializeDateRangePicker( null, null );                       
                        break;
                        
                    case 4:
                        vm.enableDateRange = false;
                        vm.selectedLogFilter.start_date = "2001/01/01"
                        vm.selectedLogFilter.end_date = "2051/01/01"
                        initializeDateRangePicker(  vm.selectedLogFilter.start_date, vm.selectedLogFilter.end_date);
                        
                        break;
                    default:
                        vm.enableDateRange = false;
                        var firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1);
                        var lastDay =  new Date(curr.getFullYear(), curr.getMonth() + 1, 0);

                        var firstDayDayWithSlashes = moment(firstDay).format('l');
                        var lastDayWithSlashes = moment(lastDay).format('l');

                        vm.selectedLogFilter.start_date = firstDayDayWithSlashes;
                        vm.selectedLogFilter.end_date  = lastDayWithSlashes;
                        initializeDateRangePicker(  vm.selectedLogFilter.start_date, vm.selectedLogFilter.end_date);
                        
                    break;
                }

        }

        function getLogsByPatientId(){

            vm.data = {
                "PatientUserId": $routeParams.patientId,
                "StartDate": vm.selectedLogFilter.start_date,
                "EndDate": vm.selectedLogFilter.end_date
            };

            vm.processing_getLogsByPatientId = true;

            vm.patients = [];
            vm.totalTimeSpent = "";
            
            vm.post_patient_logs = mhpInhouseApiService
                                    .post('/api/PatientLogs', vm.data)
                                        .then(function(result) {

                var patient_total_logs = result.message;

                vm.patients = [];
                vm.totalTimeSpent = "";
                vm.patient_total_logs = [];  
                vm.patient_total_logs_duration_in_seconds = 0;
                //empty
                if ( typeof patient_total_logs == 'string' ){
                    vm.totalTimeSpent = "0";
                    vm.processing_getLogsByPatientId = false;
                    return;
                }
                
                vm.totalTimeSpent = result.message[0].GrandTotalDuration;   
                
                /* - PROCESS additional fields - */
                _.each(patient_total_logs, function(_log){
                    
                    var _duration_in_seconds = _log.Seconds;

                    _log.formatted_total_duration_in_minutes    = logTierService.getFormattedTotalDurationInMinutes(_duration_in_seconds);
                    _log.total_duration_in_seconds              =  _duration_in_seconds;                       
                    _log.latestDateTimeReviewed_in_millis       = new Date(_log.latestDateTimeReviewed).getTime();
                    _log.created_date_in_millis                 = new Date(_log.created_date).getTime();

                    //values used on pdf report
                    vm.patient_total_logs_duration_in_seconds += _duration_in_seconds;
                    vm.patient_total_logs.push(_log);                        
                });
                /* - END - */                
                
                filterManualAuto(patient_total_logs, function(filteredLogged) {
                    if ( vm.isManual ) {
                        vm.patients = filteredLogged;
                    } else {
                        getLatestLogged(filteredLogged, function(latestLogged) {
                            vm.patients = latestLogged;
                        })
                    }

                });

                sortByDescDate(); 

                /**  convert vm.patient.latestDateTimeReviewed to Local time */
                timeService.toLocalDateUtc( vm.patients, ['latestDateTimeReviewed'], false, vm.isManual);
                vm.processing_getLogsByPatientId = false;

            }, function(err) {
                console.log('err', err);
                vm.processing_getLogsByPatientId = false;
            });
            
        }

        /** new item will on top regardless of date, will be back on default descending order date
         once refresh or cancel on adding new item
         */
        function sortByDescDate() {
            if (vm.logs_length == 0){
                vm.logs_length  = vm.patients.length;
            }else{
                var sortByCreateDate = utilityService.isNewElementInArray( vm.patients,  vm.logs_length);

                if (sortByCreateDate){
                    vm.patients = utilityService.sortByNewItemOnTop(vm.patients, '-latestDateTimeReviewed', '-created_date_in_millis'); // new item will on top regardless of date
                    vm.logs_length  = vm.patients.length;
                    vm.query.order = undefined;
                }else{
                    vm.query.order = '-latestDateTimeReviewed';
                }
            }
        }

        function filterManualAuto(logs, callback){
            var _filteredLogged = [];
            _.each(logs, function(log, i) {
                if (vm.isManual && (!log.Note || log.Note.indexOf('[auto-log]') === -1)) {
                    _filteredLogged.push(log);

                } else if (!vm.isManual && (log.Note && log.Note.indexOf('[auto-log]') !== -1)) {
                    _filteredLogged.push(log);
                }
            });

            callback(_filteredLogged);
        }

        function getLatestLogged(logs, callback){
            var _latestNotifications = [];
            var _latestPatientDrugs = [];
            var _latestBpMeasurements = [];
            var _recommendations = [];
            var _others = [];
            var _latestLogged = [];

            // filter by page
            _latestNotifications = _.where(logs, {pageReviewed : 'Notifications'});
            _latestPatientDrugs = _.where(logs, {pageReviewed : 'Patient Drugs'});
            _latestBpMeasurements = _.where(logs, {pageReviewed : 'BP Measurements'});
            _recommendations = _.where(logs, {pageReviewed : 'Recommendations'});

            // // get latest for each page
            // if (_latestNotifications.length > 0) {
            //     _latestLogged.push(getDuration(_latestNotifications));
            // }

            // if (_latestPatientDrugs.length > 0) {
            //     _latestLogged.push(getDuration(_latestPatientDrugs));
            // }

            // if (_latestBpMeasurements.length > 0) {
            //     _latestLogged.push(getDuration(_latestBpMeasurements));
            // }

            // if (_recommendations.length > 0) {
            //     _latestLogged.push(getDuration(_recommendations));
            // }

            // if (_others.length > 0) {                 
            //     _latestLogged.push(getDurationAll(_others));
             
            // }



            if (_latestNotifications.length > 0) {
                for (var i=0; i<_latestNotifications.length; i++) {
                 _latestLogged.push(_latestNotifications[i]);
                }
            }

            if (_latestPatientDrugs.length > 0) {
                for (var i=0; i<_latestPatientDrugs.length; i++) {
                 _latestLogged.push(_latestPatientDrugs[i]);
                }
            }

            if (_latestBpMeasurements.length > 0) {
                for (var i=0; i<_latestBpMeasurements.length; i++) {
                 _latestLogged.push(_latestBpMeasurements[i]);
                }
            }

            if (_recommendations.length > 0) {
                 for (var i=0; i<_recommendations.length; i++) {
                 _latestLogged.push(_recommendations[i]);
                }
            }

            if (_others.length > 0) {                 
                 for (var i=0; i<_others.length; i++) {
                 _latestLogged.push(_others[i]);
                }
             
            }

            callback(_latestLogged);
        }

        function getDuration(logs){
            var _log = {};
            var _seconds = [];
            
            logs.map(function(log) { 
                _log = log; 
            }).sort().reverse()[0];

            return _log;
        }

        function getDurationAll(logs){
            var _log = {};
            var _seconds = [];
            
            logs.map(function(log) { 
                _log = log; 
            }).sort();

            return _log;
        }

        function getUserId(){
            mhpApiService.getUserId().then(function(result){
                vm.userId = result;
            }, function(err){
                    console.log('getUserId issue', err);
            });
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
                        initializeDateRangePicker(vm.selectedLogFilter.start_date,vm.selectedLogFilter.end_date);

                        // getLogsByPatientId();                                 
                        break;     

                    case 1:    
                        var prevFirst = new Date(start);
                        prevFirst.setDate(start.getDate() - 7);

                        var prevLast = new Date(end);
                        prevLast.setDate(end.getDate() - 7);

                        vm.selectedLogFilter.start_date = moment(prevFirst).format('l');
                        vm.selectedLogFilter.end_date  = moment(prevLast).format('l');
                          initializeDateRangePicker(vm.selectedLogFilter.start_date,vm.selectedLogFilter.end_date);

                        // getLogsByPatientId();                                       
                        break;

                   default :
                        var firstDay = new Date(start.getFullYear(), ( start.getMonth() - 1 ), 1);
                        var lastDay = new Date(start.getFullYear(), ( start.getMonth() - 1) + 1, 0);

                       vm.selectedLogFilter.start_date = moment(firstDay).format('l');
                       vm.selectedLogFilter.end_date = moment(lastDay).format('l');
                        initializeDateRangePicker(vm.selectedLogFilter.start_date,vm.selectedLogFilter.end_date);

                        // getLogsByPatientId();
                        break; 
                              

                }
                checkIfCurrent(vm.selectedLogFilter.start_date,vm.logFilters);

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
                        initializeDateRangePicker(vm.selectedLogFilter.start_date,vm.selectedLogFilter.end_date);

                        // getLogsByPatientId();                                 
                        break;     

                    case 1:    
                        var nextFirst = new Date(start);
                        nextFirst.setDate(start.getDate() + 7);

                        var nextLast = new Date(end);
                        nextLast.setDate(end.getDate() + 7);

                        vm.selectedLogFilter.start_date = moment(nextFirst).format('l');
                        vm.selectedLogFilter.end_date  = moment(nextLast).format('l');
                          initializeDateRangePicker(vm.selectedLogFilter.start_date,vm.selectedLogFilter.end_date);

                        // getLogsByPatientId();                                       
                        break;

                   default :
                        var firstDay = new Date(start.getFullYear(), ( start.getMonth() + 1 ), 1);
                        var lastDay = new Date(start.getFullYear(), ( start.getMonth() + 1 ) + 1, 0);

                        vm.selectedLogFilter.start_date  = moment(firstDay).format('l');
                        vm.selectedLogFilter.end_date = moment(lastDay).format('l');
                        initializeDateRangePicker(vm.selectedLogFilter.start_date,vm.selectedLogFilter.end_date);

                        // getLogsByPatientId();
                        break; 
                              

                }
                checkIfCurrent(vm.selectedLogFilter.start_date,vm.logFilters);

        }
        
        function deleteTimeLog(logId, pageReviewed, $event){

            mhpDialog.showConfirmDialog('',
                'Delete log "' + pageReviewed +'"',
                $event,
                'Delete',
                'Cancel',
                function (confirm) {
                    if (confirm){
                        deleteLog(logId);
                        getLogsByPatientId();
                    }
                });

        }

        function deleteLog(logId) {
            var deleteData = {
                "LogId": logId
            }
            vm.delete_patient_log = mhpInhouseApiService.post('/api/DeleteTimeLog', deleteData ).then(function(result) {
                console.log("result", result.message);
            }, function(err) {
                console.log('err', err);
            });
        }

        /**
         * ================================================================================
         */

        function onClickPrev() {
            vm.route = "#!/review-logs";
            $window.location.href = vm.route;
        }

        function onAddTimeLog(keyEvent) {
            vm.time_logs_to_view_copy = {};

            if (keyEvent.which === 13){
                console.log('return');
                return;
            }
            var _logValue = {
                Duration : 5,
                Note : null,
                ReviewedDate : new Date(Date.now()),
                PageReviewed : "Others",
                Status : '1',
                PatientUserId : $routeParams.patientId,
                UserId : vm.userId,
            }

            angular.copy(_logValue, vm.logValue);
            vm.show_details = true;
        }

        function onSubmit(){ 
            mhpInhouseApiService.post('/api/LogTime',vm.logValue).then(function(result){
                alert('Time Logged Successfully!');
                 $route.reload();
            }, function(error){
                console.log('/api/LogTime Error', error);                  
            });  
        }

        function showEdit(patientId){
            if (vm.is_manual){
                vm.time_logs_to_view_copy = _.findWhere(vm.patients, {id: patientId});
                vm.show_details = true;
            }
        }


        /********************
         * Format PDF Report
         * refer to : http://pdfmake.org/#/gettingstarted 
         * when new to formatting via pdfmake
         ********************/
        function exportPDF(download, _debug){

            if ( vm.processing_download_report || vm.processing_upload_report )
                return;

            if ( download )
                vm.processing_download_report = true;
            else
                vm.processing_upload_report = true;

            var _filters = {
                    bNotification : true,
                    bRecommendation : true,
                    bDrug : true,
                    range : {
                        start : vm.selectedLogFilter.start_date,
                        end : vm.selectedLogFilter.end_date
                    }
            };

            
            physicianPatientDataService
                .getMePhysicianPatient($routeParams.patientId, _filters)
                .then(function(patientReports){

                    var _patientDrugs = patientReports.patientDrugs;
                    var _recommendations = patientReports.recommendations;
                    var _notification_bases = patientReports.notificationBases;

                    //Populate contents
                    pdfMakeService.getBaseDocDefinition().then(function(baseDocDefinition){
                        var pdf_DocDefinition = baseDocDefinition;

                        var _date_created = baseDocDefinition.date_created;
                        var _title_text =  PDFBuilder_title();
                        var _patient_logs_table = PDFBuilder_patient_log_reports();                

                        pdf_DocDefinition.content = [   
                            //Patient Info
                            PDFBuilder_patient_info(_date_created),
                            {
                                text : _title_text,
                                margin : [10,20,10,10]
                            },  
                            {
                                table : _patient_logs_table
                            }
                            // ,
                            //  pdfMakeService.createTableTitle('Medication And Notes'),
                            // {
                            //     table : patientReportContentToPDFService.convertMedicationsToTable(_patientDrugs),
                            // },
                            // pdfMakeService.createTableTitle('Recommendations'), 
                            // {
                            //     table : patientReportContentToPDFService.convertRecommendationsToTable(_recommendations),
                            // }, 
                            // pdfMakeService.createTableTitle('Notifications'),
                            // {
                            //     table : patientReportContentToPDFService.convertNotificationsBasesToTable(_notification_bases),
                            // }
                                             
                        ];

                        //create name
                        var _pdf_file_name = getPDFFileName();

                        if ( _debug ){
                            vm.processing_download_report = false;     
                            vm.processing_upload_report = false;      
                            return pdfMake.createPdf(pdf_DocDefinition).open();               
                        }

                        if ( download ) {
                            pdfMake.createPdf(pdf_DocDefinition).download(_pdf_file_name);
                            return vm.processing_download_report = false;                        
                        } else {                
                            console.log('Uploading ' + _pdf_file_name + '....');
                            return pdfMake
                                .createPdf(pdf_DocDefinition)
                                .getDataUrl(function(dataURL){

                                    var _blob = pdfMakeService.convertDataUrlToBlob(dataURL, _pdf_file_name);
                                    var _category = 'Uploaded Reports';                                                                        
                                    patientFileDataService
                                        .uploadPhysicianPatientDocument(_blob, vm.patient_id, _category)
                                        .then(function(result){
                                            vm.processing_upload_report = false;        
                                            onReportUpload('Successfully Uploaded Review Logs to Patient Records');          
                                        }, function(err){
                                            vm.processing_upload_report = false;                       
                                            onReportUpload('Failed to Upload Review Logs to Patient Records, please check console for cause (dev)', true);
                                            console.log('upload error', err);
                                        });
                            })                            
                        }
                    });

                }, function(err){
                    console.log('fail', err);
                }
            );
          
        }

        /**
         * Show toast after upload
         *  - message ( string )
         *  - fail ( boolean ) 
         *      * do something when fail, like add css or something..
         */
        function onReportUpload(message, fail){
            $mdToast.show(
                $mdToast.simple()
                    .textContent(message)
                    .position('top right')
                    .hideDelay(3000)
            );            
        }

        /**********************************
         * Will provide the following
         * 
         * 
         ***********************************/
        function PDFBuilder_patient_info(date_created){

            //PREPARE content
            var _patient_full_name = vm.patientInfo.user.fName + ' ' + vm.patientInfo.user.lName;
            var _physician_full_name =  vm.physicianInfo.fName + ' ' + vm.physicianInfo.lName;
            
            var _range = vm.selectedLogFilter.start_date + ' to ' + vm.selectedLogFilter.end_date;
            var _dob =   moment(vm.patientInfo.dob).format('L');

            var _conditions = [];
             _.each(vm.patientInfo.conditions, function(condition, _index){
                 if ( condition.conditionName && condition.conditionName.toString() != '' )
                    _conditions.push(condition.conditionName);
             });
            var _other_conditions = vm.patientInfo.otherConditions;


            if (vm.logFilters == 4)//all
                _range = "All";

            var _total_logs_in_minutes = logTierService.getFormattedTotalDurationInMinutes(vm.patient_total_logs_duration_in_seconds);
            var _billing_code = logTierService.getTierBillingCode(vm.patient_total_logs_duration_in_seconds);

            //BUILD
            var first_column = pdfMakeService.createHeaderInformationColumnObject();
                first_column.addContent("Patient",_patient_full_name);
                first_column.addContent("Physician",_physician_full_name);
                first_column.addContent("Billing Code",_billing_code);                
                first_column.addContent("Conditions",_conditions.join(', '));
                

            var second_column = pdfMakeService.createHeaderInformationColumnObject('40%');
                second_column.addContent("Date of Birth",_dob);
                second_column.addContent("Range", _range);
                second_column.addContent("Total Time", _total_logs_in_minutes);
                second_column.addContent("Generated on", date_created);
                second_column.addContent("Other Conditions", _other_conditions);

            return pdfMakeService.createHeaderInformationContainer(first_column, second_column);

        }

        /**
         * Build title
         */
        function PDFBuilder_title(){
            var _patient_name =  vm.patientInfo.user.fName + ' ' + vm.patientInfo.user.lName;
            return pdfMakeService.createTitle('Review Logs for ' + _patient_name);            
        }

        /**
         * Will provide patient logs, along with sorted content
         */
        function PDFBuilder_patient_log_reports(){
        
           var _headers = ['#','Time Spent','Date/Time Logged','Section','Comment','Auto'];
           var _widths = ['auto','18%','27%','auto','*','auto'];
           var _patient_log_reports =  pdfMakeService.createTable(_headers, _widths);

            var _patients = $filter('orderBy')(vm.patient_total_logs, vm.query.order);
            
            //process body
            _.each(_patients, function(patient, _index){

                var _count              = _index + 1;
                var _duration           = patient.formatted_total_duration_in_minutes;
                var _date_time_logged   = $filter('date')(patient.latestDateTimeReviewed, 'yyyy-MM-dd hh:mm a');
                var _section            = patient.pageReviewed;
                var _comment            = patient.Note;                
                var _auto_logged        = "cached_x_icon";

                var _is_auto_logged     = (_comment == '[auto-log]');
                if ( _is_auto_logged )
                    _comment = "";

                var _p_count              = pdfMakeService.createTableField(_count);
                var _p_duration           = pdfMakeService.createTableField(_duration);
                var _p_date_time          = pdfMakeService.createTableField(_date_time_logged);
                var _p_section            = pdfMakeService.createTableField(_section);
                var _p_comment            = pdfMakeService.createTableField(_comment);
                var _p_auto_logged        = pdfMakeService.createTableField("");
                if ( _is_auto_logged )
                    _p_auto_logged = pdfMakeService.createTableFieldForIcon("cached_check_icon");

                //customize
                _p_count.alignment = 'center';
                _p_duration.alignment = 'right';
                _p_date_time.alignment = 'center';
                _p_count._p_auto_logged = 'center';

                _patient_log_reports.body.push([ 
                                                    _p_count, 
                                                    _p_duration, 
                                                    _p_date_time, 
                                                    _p_section, 
                                                    _p_comment, 
                                                    _p_auto_logged 
                                                ]);
            });

            //end

            return _patient_log_reports;
        }

        /**
         * Get PDF File Name
         */
        function getPDFFileName(){
            var _range = vm.selectedLogFilter.start_date + ' to ' + vm.selectedLogFilter.end_date
            if (vm.logFilters == 4)//all
                _range = "All";            
            var _pdf_file_name = [
                                    vm.patientInfo.user.fName,
                                    vm.patientInfo.user.lName,
                                    _range,
                                    'timelog-per-patient',
                                    new Date().getTime() + '.pdf'
                                ].join('-');
            
            return _pdf_file_name
                        .replace(' ', '')
                        .replace(/\s+/g, '-')
                        .replace(/\//g, '');
        }
        
       
       /**
        * Get Month Range based on Month ( 1 - 12 )
        */
        function getMonthDateRange(year, month) {
            var startDate = moment([year, month - 1]);
            var endDate = moment(startDate).endOf('month');
            return { start: startDate, end: endDate };
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

                // console.log('vm.logFilters',vm.logFilters )
                // console.log('startDate',startDate )
                // console.log('currentStartDate',currentStartDate )

            if (startDate == currentStartDate){
                vm.isCurrentSelected = true;
            }

        }
    }

})();