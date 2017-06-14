'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('patientBpMeasurementChart', {
            templateUrl : 'components/patient-bp-measurement-chart/patient-bp-measurement-chart.component.html',
            bindings:{
                'bpList' : '='
            },
            controller : Controller
    });

    Controller.$inject = [
                            '$scope', '$timeout', '$routeParams', '$filter', 
                            '$mdToast', 
                            'mhpInhouseApiService','mhpApiService', 'mockApiService', 'bpListFilterService', 
                            'physicianPatientDataService', 'patientReportContentToPDFService', 
                            'pdfMakeService', 'patientFileDataService'];
    function Controller( 
                            $scope, $timeout, $routeParams, $filter, 
                            $mdToast, 
                            mhpInhouseApiService, mhpApiService, mockApiService, bpListFilterService, 
                            physicianPatientDataService, patientReportContentToPDFService,  
                            pdfMakeService, patientFileDataService) {
        var vm = this;
       
        vm.userId = $routeParams.patientId;        
        vm.patient_id = $routeParams.patientId;        
        vm.bpMeasurementData = {};
        vm.data = {};
        vm.bpmListComponent = vm.bpList; // component for bp measurement list

        vm.systolic = [];
        vm.diastolic = [];
        vm.heart_rate = [];
        vm.measure_date = [];

        vm.physicianTargetDBP = 0;
        vm.physicianTargetSBP = 0;

        var startDate, endDate;
        vm.bpMeasurements = {}
        vm.timeFilter = [   {id: 0, name: "Day" },
                            {id: 1, name: "Week" },
                            {id: 2, name: "Month" },
                            {id: 3, name: "Year" } ];

        vm.getSelectedOnChange =  getSelectedOnChange
        vm.getPreviousBP = getPreviousBP
        vm.getNextBP = getNextBP
        vm.showDates = false;
        vm.bpMeasurementsList = bpListFilterService;

        vm.processing_get_patient_bp_measurement = true;
        vm.processing_download_report = false;        
        vm.processing_upload_report = false;

        //pdf reports
        vm.openPDFReport = openPDFReport;
        vm.physician_info;
        vm.patient_info;

        vm.isRunning = false;
        vm.isCurrentSelected = false;
        vm.isPrevSelected = false;
        vm.isNextSelected = false;

         $scope.$watch('$ctrl.bpList.show_details', onBpListCreate);

        //watch
        $scope.$watch('$ctrl.bpFilter', function(){
            vm.getSelectedOnChange();
            // vm.getLogsByPatientId();
        }, true);
     
        activate();

        ///////

        function activate(){     
             vm.query = {
                order: '-measurementDate_in_millis',
                page: 1
            }
      
            getPatientBpMeasurementData();
            getPhysicianInfo(function(){});//prefetch
            getPatientInfo(function(){});//prefetch

        }

        function getPhysicianInfo(callback){
            if ( vm.physician_info )
                return callback(null, vm.physician_info);

            mhpApiService.getLoggedUserInfo().then(
                function(loggedUserInfo){
                    vm.physician_info = loggedUserInfo.user;
                    return callback(null, vm.physician_info);
                }, 
                function(err){
                    console.log(err);
                    return callback(err);
                }
            )            
        }

        function getPatientInfo(callback){
            if ( vm.patient_info )
                return callback(null, vm.patient_info);

            physicianPatientDataService
                .getPatientInformation($routeParams.patientId)                
                .then(function(patientInfo){
                    vm.patient_info = patientInfo;
                    return callback(null, vm.patient_info);
                });
        } 

        function onBpListCreate(newValue){
            if (!newValue){
                getPatientBpMeasurementData();
            }
        }

        function reInitializeBPChart(){
            vm.systolic = []
            vm.diastolic = []
            vm.heart_rate = []
            vm.measure_date = []

            var green = '#047201';
            var blue = '#0A43F1';
            var red = '#FA3119';

            var systolicColorSet = new colorSet(green);
            var diastolicColorSet = new colorSet(blue);
            var heartRateColorSet = new colorSet(red);

            vm.bpMeasurementData = {
                labels: vm.measure_date,
                series : ['Systolic', 'Diastolic', 'Heart Rate'],
                data: [ vm.systolic,
                        vm.diastolic,
                        vm.heart_rate
                ],
                datasets: [systolicColorSet, diastolicColorSet, heartRateColorSet],
                options:{
                    legend: { display: true },
                    scales: {
                        xAxes: [{
                            type: 'time',
                            time:{
                                displayFormats:{
                                    'millisecond': 'MMM DD',
                                    'second': 'MMM DD',
                                    'minute': 'MMM DD',
                                    'hour': 'MMM DD',
                                    'day': 'MMM DD',
                                    'week': 'MMM DD',
                                    'month': 'MMM DD',
                                    'quarter': 'MMM DD',
                                    'year': 'MMM DD',
                                }
                            },
                            ticks:
                            {
                                autoSkip: true,
                                display: true,
                                autoSkipPadding: 15,
                                maxRotation: 0
                            },
                        }], 
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                }
            }
        }
        //http://www.chartjs.org/docs/#chart-configuration-colors
        function colorSet(color) {
            this.fill = false,
                this.borderWidth = 3,
                this.pointBackgroundColor = '#fff',
                this.pointBorderColor = color,
                this.backgroundColor = color,
                this.borderColor = color,
                this.pointHoverBackgroundColor = '#fff',
                this.pointHoverBorderColor = color,
                this.pointRadius = 4;
                this.pointHoverRadius = 5;
        }
           

         function getPatientBpMeasurementData(){
             vm.bpmListComponent.get_bp_measurements =  mhpApiService  // vm.bpmListComponent.get_bp_measurements : variable to show md-progress on bpm list
            .get('/api/GetMePhysicianPatientV2?patientUserId='+ vm.userId
            +'&startDate=01/01/2001&endDate=01/01/2020&' +
                'bCondition=false&' +
                'bBpm=true&' +
                'bNotification=false&' +
                'bRecommendation=false&' +
                'bDrug=false&' +
                'bPhysician=false&' +
                'bRA=false', {}, true)
            .then(function(result){
                result.bpMeasurements = _.sortBy(result.bpMeasurements,'measureDate');
                vm.bpMeasurements = result.bpMeasurements;
                vm.physicianTargetDBP = result.physicianTargetDBP;
                vm.physicianTargetSBP = result.physicianTargetSBP;

                getSelectedOnChange();
            }, function(result){
                console.log('GetMePhysicianPatientV2 error', result);
            })
        }

        function plotData(startDate, endDate){
            vm.processing_get_patient_bp_measurement = true;
            var bpList = [];
            for (var key in vm.bpMeasurements ){
                if (vm.bpMeasurements[key].id != null){
                    var measureDate = moment(vm.bpMeasurements[key].measureDate);
                    var check = new Date(measureDate);
                    if ( (check.getTime() <= endDate.getTime() && check.getTime() >= startDate.getTime()) ){

                        var _bpMeasurement = vm.bpMeasurements[key];

                        _bpMeasurement.measurementDate_in_millis = new Date(_bpMeasurement.measureDate).getTime();

                        bpList.push(_bpMeasurement);
                        vm.systolic.push(_bpMeasurement.systolic);
                        vm.diastolic.push(_bpMeasurement.diastolic);
                        vm.heart_rate.push(_bpMeasurement.heartRate);
                        vm.measure_date.push( $filter('date')(measureDate, "EEE MM/dd/yyyy HH:mm:ss a Z")._d );

                    }
                }
            }

            vm.bpMeasurementsList.addToBpServiceList(bpList);
            vm.bpmListComponent.setBpData( bpList ); // send bpList to bpmComponent
            vm.processing_get_patient_bp_measurement = false;

        }

        function getSelectedOnChange(){
            vm.isCurrentSelected = true;
            vm.isPrevSelected = false;
            vm.isNextSelected = false;
            reInitializeBPChart();
            // console.log("CASE ", vm.bpFilter);
            switch (vm.bpFilter) {
                    
                    case 0:                    
                        startDate = new Date();
                        endDate = new Date();
                        startDate.setHours(0,0,0,0);
                        endDate.setHours(23,59,59,999);  

                        vm.startDate = startDate;
                        vm.endDate = endDate;
                        plotData(startDate, endDate)
                        break;

                    case 1:
                        var curr = new Date(); // get current date
                        var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
                        var last = first + 6; // last day is the first day + 6

                        startDate =  new Date( curr.setDate( first ) ) ;
                        endDate =  new Date( curr.setDate( last ) ) ;

                        startDate.setHours(0,0,0,0);
                        endDate.setHours(23,59,59,999);
            
                        vm.startDate = startDate;
                        vm.endDate = endDate;
                        plotData(startDate, endDate)
                        break;

                   case 2:
                        var curr = new Date();
                        var firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1);
                        var lastDay = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);

                        startDate = firstDay;
                        endDate = lastDay;

                        startDate.setHours(0,0,0,0);
                        endDate.setHours(23,59,59,999);
                        
                        vm.startDate = startDate;
                        vm.endDate = endDate;
                        plotData(startDate, endDate)
                       break;

                    case 3:
                        var curr = new Date();
                        var startDate =  new Date(new Date().getFullYear(), 0, 1) ;
                        var endDate =  new Date(new Date().getFullYear(), 11, 31) ; 

                        startDate.setHours(0,0,0,0);
                        endDate.setHours(23,59,59,999);
                        
                        vm.startDate = startDate;
                        vm.endDate = endDate;
                        plotData(startDate, endDate)
                        break;
                        
                   default:
                        var curr = new Date();
                        var firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1);
                        var lastDay = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);

                        startDate = firstDay;
                        endDate = lastDay;

                        startDate.setHours(0,0,0,0);
                        endDate.setHours(23,59,59,999);

                        vm.startDate = startDate;
                        vm.endDate = endDate;
                        plotData(startDate, endDate)
                        break;
                }
        }

        function getPreviousBP(){
            vm.showDates = true;
            vm.isCurrentSelected = false;
            vm.isPrevSelected = true;
            vm.isNextSelected = false;

            reInitializeBPChart();
            var start = new Date(vm.startDate);
            var end = new Date(vm.endDate);
            switch (vm.bpFilter) {
                    
                    case 0:               
                        var previousDay = new Date(start);
                        previousDay.setDate(start.getDate()-1);     

                        var previousDayEnd = new Date(start);
                        previousDayEnd.setDate(start.getDate()-1);   

                        startDate = previousDay;
                        endDate = previousDayEnd;
                        startDate.setHours(0,0,0,0);
                        endDate.setHours(23,59,59,999);  

                        vm.startDate = startDate;
                        vm.endDate = endDate;
                        plotData(vm.startDate, vm.endDate)
                        break;

                    case 1:
                        var prevFirst = new Date(start);
                        prevFirst.setDate(start.getDate() - 7);

                        var prevLast = new Date(end);
                        prevLast.setDate(end.getDate() - 7);

                        startDate =  prevFirst;
                        endDate =  prevLast;

                        startDate.setHours(0,0,0,0);
                        endDate.setHours(23,59,59,999);
            
                        vm.startDate = startDate;
                        vm.endDate = endDate;
                        plotData(vm.startDate, vm.endDate)
                        break;

                   case 2:

                        var firstDay = new Date(start.getFullYear(), ( start.getMonth() - 1 ), 1);
                        var lastDay = new Date(start.getFullYear(), ( start.getMonth() - 1) + 1, 0);

                        startDate = firstDay;
                        endDate = lastDay;

                        startDate.setHours(0,0,0,0);
                        endDate.setHours(23,59,59,999);
                        
                        vm.startDate = startDate;
                        vm.endDate = endDate;
                        plotData(vm.startDate, vm.endDate)
                       break;

                    case 3:
                        var startDate =  new Date(start.getFullYear()-1, 0, 1) ;
                        var endDate =  new Date(end.getFullYear()-1, 11, 31) ; 

                        startDate.setHours(0,0,0,0);
                        endDate.setHours(23,59,59,999);
                        
                        vm.startDate = startDate;
                        vm.endDate = endDate;
                        plotData(vm.startDate, vm.endDate)
                        

                        break;
                        
                   default:
                        var curr = new Date();
                        var firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1);
                        var lastDay = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);

                        startDate = firstDay;
                        endDate = lastDay;

                        startDate.setHours(0,0,0,0);
                        endDate.setHours(23,59,59,999);

                        vm.startDate = startDate;
                        vm.endDate = endDate;
                        plotData(vm.startDate, vm.endDate)
                        break;
                }

        }

        function getNextBP(){
            vm.showDates = true;
            vm.isCurrentSelected = false;
            vm.isPrevSelected = false;
            vm.isNextSelected = true;

            reInitializeBPChart();
            var start = new Date(vm.startDate);
            var end = new Date(vm.endDate);
            switch (vm.bpFilter) {
                    
                    case 0:               
                        var nextDay = new Date(start);
                        nextDay.setDate(start.getDate()+1);     

                        var nextDayEnd = new Date(start);
                        nextDayEnd.setDate(start.getDate()+1);   

                        startDate = nextDay;
                        endDate = nextDayEnd;
                        startDate.setHours(0,0,0,0);
                        endDate.setHours(23,59,59,999);  

                        vm.startDate = startDate;
                        vm.endDate = endDate;
                        plotData(vm.startDate, vm.endDate)
                        break;

                    case 1:
                        var nextFirst = new Date(start);
                        nextFirst.setDate(start.getDate() + 7);

                        var nextLast = new Date(end);
                        nextLast.setDate(end.getDate() + 7);

                        startDate =  nextFirst;
                        endDate =  nextLast;

                        startDate.setHours(0,0,0,0);
                        endDate.setHours(23,59,59,999);
            
                        vm.startDate = startDate;
                        vm.endDate = endDate;
                        plotData(vm.startDate, vm.endDate)
                        
                        break;

                   case 2:

                        var firstDay = new Date(start.getFullYear(), ( start.getMonth() + 1 ), 1);
                        var lastDay = new Date(start.getFullYear(), ( start.getMonth() + 1) + 1, 0);

                        startDate = firstDay;
                        endDate = lastDay;

                        startDate.setHours(0,0,0,0);
                        endDate.setHours(23,59,59,999);
                        
                        vm.startDate = startDate;
                        vm.endDate = endDate;
                        plotData(vm.startDate, vm.endDate)
                       break;

                    case 3:
                        var startDate =  new Date(start.getFullYear()+1, 0, 1) ;
                        var endDate =  new Date(end.getFullYear()+1, 11, 31) ; 

                        startDate.setHours(0,0,0,0);
                        endDate.setHours(23,59,59,999);
                        
                        vm.startDate = startDate;
                        vm.endDate = endDate;
                        plotData(vm.startDate, vm.endDate)
                        

                        break;
                        
                   default:
                        var curr = new Date();
                        var firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1);
                        var lastDay = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);

                        startDate = firstDay;
                        endDate = lastDay;

                        startDate.setHours(0,0,0,0);
                        endDate.setHours(23,59,59,999);

                        vm.startDate = startDate;
                        vm.endDate = endDate;
                        plotData(vm.startDate, vm.endDate)
                        break;
                }
                console.log("vm.startDate next",vm.startDate)
                checkIfCurrent(vm.startDate,vm.bpFilter);

        }

        /**
         * GENERATE PDF
         * Format PDF Report
         * refer to : http://pdfmake.org/#/gettingstarted 
         * when new to formatting via pdfmake
         ********************/
        function openPDFReport(download, _debug){
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
                        start : vm.startDate,
                        end : vm.endDate
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
                        var _date_created = baseDocDefinition.date_created;
                        var pdf_DocDefinition = baseDocDefinition;
                        var _patient_basic_info = PDFBuilder_patient_info(_date_created);
                        var _title_text =  PDFBuilder_title();
                        var _patient_bp_table = PDFBuilder_patient_bp_measurements();                

                        var _chart_image = document.getElementById("bpMeasurementChart").toDataURL();
                        pdf_DocDefinition.content = [
                            _patient_basic_info,   
                            {
                                text : _title_text,
                                margin : [10,20,10,10]
                            },
                            {
                                image : _chart_image,
                                fit : [500,500],
                                margin : 10,
                                alignment : 'center'
                            },  
                            {
                                table : _patient_bp_table,
                                margin : [2,15,2,0]
                            },
                            pdfMakeService.createTableTitle('Medication And Notes'),
                            {
                                table : patientReportContentToPDFService.convertMedicationsToTable(_patientDrugs),
                            },
                            pdfMakeService.createTableTitle('Recommendations'), 
                            {
                                table : patientReportContentToPDFService.convertRecommendationsToTable(_recommendations),
                            },
                            pdfMakeService.createTableTitle('Notifications'),
                            {
                                table : patientReportContentToPDFService.convertNotificationsBasesToTable(_notification_bases),
                            }
                        ];

                        //create name
                        var _pdf_file_name = getPDFFileName();

                        if ( _debug ){
                            vm.processing_download_report = false;     
                            vm.processing_upload_report = false;      
                            return pdfMake.createPdf(pdf_DocDefinition).open();               
                        }

                        if ( download ) {
                            vm.processing_download_report = false;                        
                            return pdfMake.createPdf(pdf_DocDefinition).download(_pdf_file_name);
                        } else {                
                            return pdfMake
                                .createPdf(pdf_DocDefinition)
                                .getDataUrl(function(dataURL){

                                    var _blob = pdfMakeService.convertDataUrlToBlob(dataURL, _pdf_file_name);
                                    var _category = 'Uploaded Reports';                                                                        
                                    patientFileDataService
                                        .uploadPhysicianPatientDocument(_blob, vm.patient_id, _category)
                                        .then(function(result){
                                            vm.processing_upload_report = false;        
                                            onReportUpload('Successfully Uploaded BP Measurement Charts to Patient Records');     
                                        }, function(err){
                                            vm.processing_upload_report = false;  
                                            onReportUpload('Failed to Upload BP Measurement Charts to Patient Records, please check console for cause (dev)', true);                      
                                            console.log('upload error', err);
                                        });
                            })                            
                        }
                    });                       

                }, function(err){
                    console.log('getPatientReport', err);
                });         
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
         ***********************************/
        function PDFBuilder_patient_info(date_created){

            //PREPARE content
            var _patient_full_name = vm.patient_info.user.fName + ' ' + vm.patient_info.user.lName;
            var _physician_full_name =  vm.physician_info.fName + ' ' + vm.physician_info.lName;
            var _target_SBP_DBP =   vm.physicianTargetSBP + '/' + vm.physicianTargetDBP;

            var _dob =   moment(vm.patient_info.dob).format('L');

            var startDate = moment(vm.startDate).format('L');
            var endDate = moment(vm.endDate).format('L');
            var _range = startDate + ' to ' + endDate;
            
            var _conditions = [];
            _.each(vm.patient_info.conditions, function(condition, _index){
                _conditions.push(condition.conditionName);
             })

            var _other_conditions = vm.patient_info.otherConditions;

            //BUILD
            var first_column = pdfMakeService.createHeaderInformationColumnObject();
                first_column.addContent("Patient",_patient_full_name);
                first_column.addContent("Date of Birth", _dob);                
                first_column.addContent("Target SBP/DBP",_target_SBP_DBP);
                first_column.addContent("Conditions", _conditions.join(', '));
                

            var second_column = pdfMakeService.createHeaderInformationColumnObject('40%');
                second_column.addContent("Physician",_physician_full_name);
                second_column.addContent("Range", _range);
                second_column.addContent("Generated on", date_created);
                second_column.addContent("Other Conditions", _other_conditions);
                

            return pdfMakeService.createHeaderInformationContainer(first_column, second_column);
        }

         /**
         * Build title
         */
        function PDFBuilder_title(){
            var _patient_name =  vm.patient_info.user.fName + ' ' + vm.patient_info.user.lName;
            return pdfMakeService.createTitle('BP Measurements for ' + _patient_name);            
        }

        /**
         * Will provide patient bp measurements, along with sorted content
         */
        function PDFBuilder_patient_bp_measurements(){
        
            var _headers = ['#','Date','Location','Systolic','Diastolic','Heart','Device', 'Note', 'Status'];
            var _widths = ['auto','24%','auto','auto','auto','auto','auto','23%','auto'];
            var _patient_bp_measurements =  pdfMakeService.createTable(_headers, _widths);
            var _patients = $filter('orderBy')(vm.bpmListComponent.bp_measurements, vm.query.order);
            
            //process body
            _.each(_patients, function(patient, _index){

                var _count              = _index + 1;
                var _measureDate        = $filter('date')(patient.measureDate, 'yyyy-MM-dd hh:mm a');
                var _location           = $filter('location')(patient.location);
                var _systolic           = patient.systolic;
                var _diastolic          = patient.diastolic;
                var _heart              = patient.heartRate;
                var _device             = patient.device;
                var _note               = patient.note;
                var _status             = $filter('MeasurementStatusDTO')(patient.measurementStatusId);



                var _p_count            = pdfMakeService.createTableField(_count);
                var _p_measureDate      = pdfMakeService.createTableField(_measureDate);
                var _p_location         = pdfMakeService.createTableField(_location);
                var _p_systolic         = pdfMakeService.createTableField(_systolic);
                var _p_diastolic        = pdfMakeService.createTableField(_diastolic);
                var _p_heart            = pdfMakeService.createTableField(_heart);
                var _p_device           = pdfMakeService.createTableField(_device);
                var _p_note             = pdfMakeService.createTableField(_note);
                var _p_status           = pdfMakeService.createTableField(_status);

                _patient_bp_measurements.body.push([ 
                                                    _p_count, 
                                                    _p_measureDate, 
                                                    _p_location, 
                                                    _p_systolic, 
                                                    _p_diastolic, 
                                                    _p_heart
                                                    , 
                                                    _p_device, 
                                                    _p_note, 
                                                    _p_status 
                                                ]);
            });
            //end
            return _patient_bp_measurements;
        }

         /**
         * Get PDF File Name
         */
        function getPDFFileName(){
            var startDate = moment(vm.startDate).format('L');
            var endDate = moment(vm.endDate).format('L');
            var _range = startDate + '-to-' + endDate;

            var _pdf_file_name = [
                                    vm.patient_info.user.fName,
                                    vm.patient_info.user.lName,
                                    _range,
                                    'bp-per-patient',
                                    new Date().getTime() + '.pdf'
                                ].join('-');
            
            return _pdf_file_name
                        .replace(' ', '')
                        .replace(/\s+/g, '-')
                        .replace(/\//g, '');
        }
        function checkIfCurrent(startDate, logFilterSelected){

            var currentStartDate;
             switch (logFilterSelected) {
                    case 0:                    
                        start = new Date();
                        start.setHours(0,0,0,0);
                        currentStartDate = moment(start).format('l');    
                        break;

                    case 1:
                        var curr = new Date(); // get current date
                        var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
                        start =  new Date( curr.setDate( first ) ) ;
                        start.setHours(0,0,0,0);      
                        currentStartDate = moment(start).format('l');    
                        break;

                   case 2:
                        var curr = new Date();
                        var firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1);
                        start = firstDay;
                        start.setHours(0,0,0,0);  
                        currentStartDate = moment(start).format('l');    
                       break;

                    case 3:
                        var curr = new Date();
                        var start =  new Date(new Date().getFullYear(), 0, 1) ;
                        start.setHours(0,0,0,0);           
                        currentStartDate = moment(start).format('l');    
                        break;
                        
                   default:
                        var curr = new Date();
                        var firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1);
                        start = firstDay;
                        start.setHours(0,0,0,0);
                        currentStartDate = moment(start).format('l');    
                        break;

                }

            startDate = moment(startDate).format('l');
            if (startDate == currentStartDate){
                vm.isCurrentSelected = true;
            }

        }
    }

})();