'use strict';
(function(){

angular.module('app.factory.module')
    .factory('timeService', Service);

    Service.$inject = [];
    function Service(){

        var timeService = {
            toLocalDate: toLocalDate,
            dateToUnix: dateToUnix,
            toLocalDateUtc: toLocalDateUtc

        };

        return timeService;

        // date to unix date
        function dateToUnix(date) {
            return new Date(date).getTime();
        }

        function toLocalDate(dateObj, keys, log) {
            _.each(dateObj, function (obj, index)
            {
                if (Object(obj) && keys.indexOf(index) !== -1){
                    if(log){
                        console.log("object :" + index + " " +obj);
                    }
                    toLocalDate(obj, keys, log);
                }else {
                    _.each(obj, function (value, key) {
                        if (keys.indexOf(key) !== -1){
                            if( obj[key]   ){
                                //console.log(key, obj[key]);
                                obj[key] = new Date(value);
                                if(log){
                                console.log("-----------break---------------");
                                console.log(value + " - " +obj[key]); }
                            }
                        }
                    });
                }
            });
        }

        /** exclusive for converting list time with 'Date/Time' column in patient review Log */
        function toLocalDateUtc(dateObj, keys, showLog, isManual) {
            _.each(dateObj, function (obj, index)
            {
                if (Object(obj) && keys.indexOf(index) !== -1){
                    if(showLog){
                        console.log("object :" + index + " " +obj);
                    }
                    toLocalDate(obj, keys, showLog);
                }else {
                    _.each(obj, function (value, key) {

                        if (keys.indexOf(key) !== -1){
                            if( obj[key]   ){
                                var utc = new Date(value).toUTCString();
                                if (!isManual){
                                    obj[key] = convertUTCDateToLocalDate(new Date(utc));
                                }else{
                                    obj[key] = moment(utc).format('YYYY-MM-DD hh:mm:ss A');
                                }
                                if(showLog){
                                    console.log("-----------break---------------");
                                    console.log(value +' : ' + utc + " - " +obj[key]); }
                            }
                        }
                    });
                }
            });
        }

        function convertUTCDateToLocalDate(date) {
            var newDate = new Date(date);
            newDate.setMinutes(date.getMinutes() - date.getTimezoneOffset());
           return newDate;
        }
    } // end of service function
})();