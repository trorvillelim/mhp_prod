'use strict';
/********************************************
 * 
 *********************************************/
(function(){
    
    angular
        .module('app.service.module')
        .factory('patientReportContentToPDFService', Service);

    Service.$inject = [ 
                        '$q', 
                        'pdfMakeService'];
    function Service(
                        $q, 
                        pdfMakeService){

        var _utils = {            
        }

        var _services = {
            convertMedicationsToTable : convertMedicationsToTable,
            convertRecommendationsToTable : convertRecommendationsToTable,
            convertNotificationsBasesToTable : convertNotificationsBasesToTable
        }

        return _services;

        ////////

        /**
         * 
         */
        function convertMedicationsToTable(_medications){

           var _headers = ['#','Date','Medications and Notes'];
           var _widths = ['auto','25%', '*'];
           var _table =  pdfMakeService.createTable(_headers, _widths);
            
            _.each(_medications, function(_item, _index){

                var _count          = _index + 1;
                var _date           = _item.effectiveDate_formatted;
                var _instruction    = _item.usageInstruction;

                var _td_count        = pdfMakeService.createTableField(_count);
                var _td_date         = pdfMakeService.createTableField(_date);
                var _td_instruction  = pdfMakeService.createTableField(_instruction);

                //customize
                _td_count.alignment = 'center';

                _table.body.push([ _td_count, _td_date, _td_instruction ]);
            });

            return _table;

        }

        /**
         * 
         */
        function convertRecommendationsToTable(_recommendations){

           var _headers = ['#','Recommendation','Date'];
           var _widths = ['auto', '*', '25%'];
           var _table =  pdfMakeService.createTable(_headers, _widths);
            
            _.each(_recommendations, function(_item, _index){

                var _count  = _index + 1;
                var _text   = _item.recText;
                var _date   = _item.recDate_formatted;                

                var _td_count    = pdfMakeService.createTableField(_count);
                var _td_text     = pdfMakeService.createTableField(_text);                
                var _td_date     = pdfMakeService.createTableField(_date);

                //customize
                _td_count.alignment = 'center';

                _table.body.push([ _td_count, _td_text, _td_date ]);
            });

            return _table;

        }

        /**
         * 
         */
        function convertNotificationsBasesToTable(_notification_bases){

          var _td_seperator = ' \n - - - \n ';

           var _headers = [ 
                            '#','Subject','Description', 'Start Date '+_td_seperator+' End Date', 
                            'How to End', 'Occurrences '+_td_seperator+' Hrs Interval', 'Day of Week '+_td_seperator+' From', 'Status'
                          ];
           var _widths = [
                            'auto', 'auto', 'auto', 'auto', 
                            'auto', 'auto', 'auto', 'auto'
                         ];
           var _table =  pdfMakeService.createTable(_headers, _widths);
            
            _.each(_notification_bases, function(_item, _index){

                var _count          = _index + 1;
                var _subject        = _item.subject;
                var _description    = _item.description;
                var _start_end_date = _item.startDate_formatted + _td_seperator + _item.endDate_formatted;  
                var _how_to_end                = _item.howToEnd_value;           
                var _occurrences_hours_int     = _item.endAfterNumberOfOccurrencies + _td_seperator + _item.hoursInterval;              
                var _day_of_week_from          = _item.dayOfWeek_value + _td_seperator + _item.from;  
                var _status                    = _item.status_value;  

                var _td_count           = pdfMakeService.createTableField(_count);
                var _td_subject         = pdfMakeService.createTableField(_subject);                
                var _td_description     = pdfMakeService.createTableField(_description);                
                var _td_start_end_date  = pdfMakeService.createTableField(_start_end_date);
                var _td_how_to_end            = pdfMakeService.createTableField(_how_to_end);
                var _td_occurrences_hours_int = pdfMakeService.createTableField(_occurrences_hours_int);
                var _td_day_of_week_from      = pdfMakeService.createTableField(_day_of_week_from);
                var _td_status                = pdfMakeService.createTableField(_status);
                

                //customize
                _td_count.alignment = 'center';
                _td_start_end_date.alignment = 'center';
                _td_occurrences_hours_int.alignment = 'center';
                _td_day_of_week_from.alignment = 'center';

                _table.body.push([  
                                    _td_count, _td_subject, _td_description, _td_start_end_date, 
                                    _td_how_to_end, _td_occurrences_hours_int, _td_day_of_week_from, _td_status
                                  ]);
            });

            return _table;            

        }

        
    }

})();