angular
    .module('filterService',[])
    .service('selectedLogFilterService', 
    function(){
        
        function toYYMMdd(date){
            return date = date.getFullYear() + "/" +('0' + (date.getMonth() + 1)).slice(-2) + '/' + ('0' + date.getDate()).slice(-2)
        }

        var curr = new Date();
        var firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1);
        var lastDay = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);

        var firstDayDayWithSlashes = toYYMMdd(firstDay);
        var lastDayWithSlashes = toYYMMdd(lastDay);

        return {
                start_date : firstDayDayWithSlashes,
                end_date : lastDayWithSlashes
        }

    });