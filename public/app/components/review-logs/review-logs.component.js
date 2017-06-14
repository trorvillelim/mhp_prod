'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('reviewLogs', {
            templateUrl : 'components/review-logs/review-logs.component.html',
            controller : Controller
    });

    Controller.$inject = [ 
                            '$window','$routeParams', '$route', '$filter',  
                            'mhpInhouseApiService', 'mockApiService', 'mhpApiService', 'pdfMakeService', 
                            'tableConfig', 'logTierService', 'defaultParam'];
    function Controller( 
                            $window, $routeParams, $route, $filter, 
                            mhpInhouseApiService, mockApiService, mhpApiService , pdfMakeService, 
                            tableConfig, logTierService, defaultParam ){
        var vm = this;
        
        vm.query;

        vm.physician_id = null;
        vm.physician_information = {};

        vm.current_month = new Date().getMonth() + 1;
        vm.current_year = new Date().getFullYear();      
        vm.query_month_year_id;
        vm.query_month_year;

        vm.patient_logs = [];
        vm.chronic_conditions = [];
        vm.patientId;
        vm.patient_logs_total_duration_in_seconds = 0;   
        vm.process_patient_logs = true;

        vm.get_logs_promise;

        vm.patientClick = patientClick;
        vm.updatePatientLogs = updatePatientLogs;
        vm.getPhysicianId = getPhysicianId;
        vm.formatChronicConditions  = formatChronicConditions;
        vm.setTotalDurationforZeroPatient = setTotalDurationforZeroPatient;

        //logs
        vm.processLogsResults = processLogsResults;
        vm.getFormattedTotalDuration = getFormattedTotalDuration;

        //date navigation
        vm.onClickDateNavigations = onClickDateNavigations;
        vm.onChangeMonthYearDate = onChangeMonthYearDate;

        //pdf reports
        vm.pdf_create_date;
        vm.openPDFReport = openPDFReport;

        //date picker
        vm.year_limit = 1900;
        vm.select_month_list = [];
        vm.select_year_list = [];
        vm.select_month_year_list = [];
        
        activate();

        return;

        ///////

        function activate(){

            vm.query = {
                order : '-total_duration_count',
                limit: tableConfig.defaultRowCount,
                page: 1
            };
            
            updateDateSelection();            
            mhpApiService.getLoggedUserInfo().then(
                function(loggedUserInfo){
                    vm.physician_information = loggedUserInfo.user;
                    vm.patientId = loggedUserInfo.id;
                    updatePatientLogs();
                },
                function(err){
                    console.log(err);
                }
            );


        }

        function setTotalDurationforZeroPatient(patientLogs){
            _.each(patientLogs, function (log, index){
                var patient_id = log.patient_id;
                if(log.total_duration_count == null){
                    log.total_duration_count = 0;
                }
            });


        }



        function getPatientChronicCondition(patientLogs){
            var _url = '/api/GetMePhysicianPatientV2';
            _.each(patientLogs, function (log, index){
                var patient_id = log.patient_id;

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

                mhpApiService.get(_url + _request_param, {}, true).then(function (result) {
                    log.chronic_conditions =  formatChronicConditions(result.conditions)
                });

            });


        }

        /**
         * UPDATE logs list
         */
        function updatePatientLogs(){
            vm.process_patient_logs = true;
            vm.getPhysicianId(function(err, physician_id){
                if ( err )
                    return console.log('error', err);

                vm.query_month_year = _.findWhere(vm.select_month_year_list, {"id" : vm.query_month_year_id});

                var _request_body = {
                    physician_user_id : physician_id, 
                    month : vm.query_month_year.month,
                    year : vm.query_month_year.year
                };     

                vm.patient_logs = [];
                
                vm.get_logs_promise = mhpInhouseApiService
                    .post('/api/getPatientsTotalLogsByDoctor', _request_body)
                    .then(
                        function(result){
                            vm.patient_logs = vm.processLogsResults(result.message);

                            console.log(result);
                            getPatientChronicCondition(vm.patient_logs);

                            setTotalDurationforZeroPatient(vm.patient_logs);

                            vm.process_patient_logs = false;
                        },
                        function(err){
                            console.log('error', err);
                        }
                    );
            });
        }

        /**
         * 
         */
        function processLogsResults(_logs){
            var _processed_logs = [];   
            vm.patient_logs_total_duration_in_seconds = 0;
            _.each(_logs, function(_log){
                vm.patient_logs_total_duration_in_seconds += _log.total_duration_count;
                //get hrs, mins, seconds                        
                // _log.formatted_total_duration = vm.getFormattedTotalDuration(_log.total_duration_count);

                _log.formatted_total_duration_in_minutes = logTierService.getFormattedTotalDurationInMinutes(_log.total_duration_count);
                _log.current_tier_in_minutes = logTierService.getCurrentTierInMinutes(_log.total_duration_count);
                _log.next_tier_in_minutes = logTierService.getNextTierInMinutes(_log.total_duration_count);
                _log.formatted_tier_info = logTierService.getFormattedTierInfo(_log.total_duration_count);
                _log.tier_billing_code = logTierService.getTierBillingCode(_log.total_duration_count);
                
                _processed_logs.push(_log);
            });

            return _processed_logs;
        };

        /**
         * Format Duration
         */
        function getFormattedTotalDuration(duration_in_seconds){

            var _duration_in_millis = duration_in_seconds * 1000;
            var _duration = moment.duration(_duration_in_millis);
            var _hours = _duration.hours().toString();
            var _minutes = _duration.minutes().toString();
            var _seconds = _duration.seconds().toString();        

            if ( _hours.length == 1 )
                _hours = "0" + _hours;
            if ( _minutes.length == 1 )
                _minutes = "0" + _minutes;
            if ( _seconds.length == 1 )
                _seconds = "0" + _seconds;

            var _formatted_total_duration = [];                
            if ( _hours !== 0 && _hours != '00' )
                _formatted_total_duration.push(_hours + ' hr');
            if ( _minutes !== 0 && _minutes != '00' )
                _formatted_total_duration.push(_minutes + ' min');

            _formatted_total_duration.push(_seconds + " sec");

            return _formatted_total_duration.join(' ');                
            
        }
        
        function getPhysicianId(callback){
            if ( vm.physician_id )
                return callback(null, vm.physician_id);

            mhpApiService.getUserId().then(function(physician_id){
                vm.physician_id = physician_id;
                return callback(null, vm.physician_id);
            }, function(err){
                console.log('getUserId issue', err);
                return callback(err);
            });
        }

        function patientClick(patientUserId) {
            vm.route = "#!/patient/patient_review_log/" + patientUserId;
            $window.location.href = vm.route;   
        }
       
       /**
        * Create Year Month Selection
        * Format ( Year - Month )
        * Will also initialize selected date
        */
        function updateDateSelection(){
            if ( vm.select_month_year_list.length > 0 )
                return;

            updateYearOptions();
            updateMonths();

            var _months = vm.select_month_list.reverse();
            var _id = 1;
            var _position = 1;
            _.each(vm.select_year_list, function(_year){
                _.each(_months, function(_month_obj){

                    if (_year >= vm.current_year && _month_obj.value > vm.current_month )
                        return;

                    var _month_year = {
                        id : _id++,
                        position : _position++, 
                        name : (_year + ' - ' + _month_obj.name),
                        month : _month_obj.value,
                        month_name : _month_obj.name,
                        year : _year
                    };
                    vm.select_month_year_list.push(_month_year);
                });
            });

            //set first
            if ( !vm.query_month_year_id )
                vm.query_month_year_id = vm.select_month_year_list[0].id;
        }

        /**
         * Get all Years
         *  return "int" (year)
         */
       function updateYearOptions(){
           var _year_limit = vm.year_limit;
           if ( vm.select_year_list.length > 0 )
                return;
           for ( var i = vm.current_year; i >= _year_limit; i-- ){
             vm.select_year_list.push(i);
           }
       }
       
       /**
        * Get all Months
        *   return "Object"
        *               - id (int)
        *               - name (string)
        */
       function updateMonths(){
           if ( vm.select_month_list.length > 0 )
                return;

            var _months = moment.months();
            _.each(_months, function(_month, _index){
                vm.select_month_list.push({
                    id : (_index + 1),
                    value : (_index + 1),
                    name : _month
                });
            });
       }

       /**
        * Auto update, based on navigation
        */
        function onClickDateNavigations(monthYearId){

            if ( !_.findWhere(vm.select_month_year_list, {"id" : monthYearId}) ){
                return;
            }
            vm.query_month_year_id = monthYearId;
                
            vm.updatePatientLogs();
        }

        /**
         * auto update on month/year selection change
         */
        function onChangeMonthYearDate(){
            vm.updatePatientLogs();
        }


        /********************
         * Format PDF Report
         * refer to : http://pdfmake.org/#/gettingstarted 
         * when new to formatting via pdfmake
         ********************/
        function openPDFReport(download){

            //Populate contents
            pdfMakeService.getBaseDocDefinition().then(function(baseDocDefinition){

                var pdf_DocDefinition = baseDocDefinition;

                //prepare contents
                var _date_created = pdf_DocDefinition.date_created;
                var _table_patient_list = PDFBuilder_patient_log_reports();
                var _text_title =  PDFBuilder_title();
                var _obj_report_info = PDFBuilder_report_info(_date_created);
                var _pdf_file_name = getPDFFileName(_date_created);

                pdf_DocDefinition.content = [
                    //Doctors Details
                    _obj_report_info,                              
                    //title
                    {
                         text : _text_title,
                         margin : [10,20,10,10]
                    },
                    //logs
                    {
                        table :  _table_patient_list
                    }
                ];

                if ( download )
                    return pdfMake.createPdf(pdf_DocDefinition).download(_pdf_file_name);
                return  pdfMake.createPdf(pdf_DocDefinition).open();

            });            

        }

        /**
         * Get PDF File Name
         */
        function getPDFFileName(date_created){
            if (!date_created)  
                date_created = moment(date_created).format('YYYY-MM-DD hh:mm a');
            
            var _physician_name = (vm.physician_information.fName + '-'  + vm.physician_information.lName);
            var _month_year = vm.query_month_year.month + '-' + vm.query_month_year.year;

            var _pdf_file_name = _physician_name + '-' + _month_year + '-timelog-' + new Date().getTime() + '.pdf';
            return _pdf_file_name.replace(/\s+/g, '-');
        }

        /**********************************
         * Will provide the following
         * 
         * Doctors Name
         * Date Range
         * 
         ***********************************/
        function PDFBuilder_report_info(date_created){

            //physician info
            var _physician_fullname = vm.physician_information.fName + ' '  + vm.physician_information.lName;

            //date range info
            var _date_range = getMonthDateRange(vm.query_month_year.year, vm.query_month_year.month);
            var _format_tpl = "MM/DD/YYYY";
            var _date_range_start = _date_range.start.format(_format_tpl);
            var _date_range_end = _date_range.end.format(_format_tpl);

            //total log in minutes
            var _total_logs_in_minutes = logTierService.getFormattedTotalDurationInMinutes(vm.patient_logs_total_duration_in_seconds);

            //BUILD
            var first_column = pdfMakeService.createHeaderInformationColumnObject();
            first_column.addContent("Physician",_physician_fullname);
            first_column.addContent("Email", vm.physician_information.email);

            var second_column = pdfMakeService.createHeaderInformationColumnObject('40%');
            second_column.addContent("Range", _date_range_start + " to " + _date_range_end);
            second_column.addContent("Total Time", _total_logs_in_minutes);
            second_column.addContent("Generated on", date_created);

            return pdfMakeService.createHeaderInformationContainer(first_column, second_column);
            
        }

        /**
         * Build title
         */
        function PDFBuilder_title(){
            var _title = 'Patient Review Logs for ' + vm.query_month_year.month_name + ' ' + vm.query_month_year.year; 
            return pdfMakeService.createTitle(_title);
        }

        /**
         * Will provide patient logs, along with sorted content
         */
        function PDFBuilder_patient_log_reports(){
           // var _headers = ['#','Patient Name','Time spent','Billing Code', 'Chronic Conditions','Comments'];
           // var _widths =  ['auto','auto', '19%', '20%', 'auto', 'auto'];
            var _headers = ['Patient Name','Time spent','Billing Code', 'Chronic Conditions','Comments'];
            var _widths =  ['auto', '19%', '30%', 'auto', 'auto'];
            var _table_log_reports =  pdfMakeService.createTable(_headers, _widths);

            //sort table content
            var _patient_logs = $filter('orderBy')(vm.patient_logs, vm.query.order);


            //contents
            _.each(_patient_logs, function(_patient_log, i){

                // if total duration is more than 20 mins
                if (_patient_log.total_duration_count > 1200){

                    // set table cell values
                   // var _patient_number             = pdfMakeService.createTableField(i + 1);
                    var _patient_full_name          = pdfMakeService.createTableField(_patient_log.patient_lastname + ', ' + _patient_log.patient_firstname);
                    var _patient_total_duration     = pdfMakeService.createTableField(_patient_log.formatted_total_duration_in_minutes);
                    var _patient_chronic_conditions     = pdfMakeService.createTableField(_patient_log.chronic_conditions);
                    var _patient_billing_code       = pdfMakeService.createTableField(_patient_log.tier_billing_code);
                    var _reminder                   = pdfMakeService.createTableField(_patient_log.formatted_tier_info);

                    //customize
                    _patient_total_duration.alignment = 'right';
                    _reminder.bold = true;

                    _table_log_reports.body.push([
                       // _patient_number,
                        _patient_full_name,
                        _patient_total_duration,
                        _patient_billing_code,
                        _patient_chronic_conditions,
                        _reminder
                    ]);

                }
            });

            return _table_log_reports;
        }
       
       /**
        * Get Month Range based on Month ( 1 - 12 )
        */
        function getMonthDateRange(year, month) {
            var startDate = moment([year, month - 1]);
            var endDate = moment(startDate).endOf('month');
            return { start: startDate, end: endDate };
        }
        /**
         * format chronic conditions for viewing
         * */
        function formatChronicConditions (conditions){
            var chronics = '';
            _.each(conditions, function(condition, ctr){
                if (ctr == conditions.length - 1){
                    chronics +=  condition.conditionName
                }else{
                chronics +=  condition.conditionName  + ', ';
                }
            });

            return chronics;
        }

    }

})();