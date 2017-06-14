'use strict';
(function(){

    angular.module('app.factory.module')
        .factory('utilityService', Service);

    Service.$inject = ['$filter'];
    function Service($filter){

        var utilityService = {
            sortByDescDate: sortByDescDate,
            containsObject: containsObject,
            getBrowserScrWidth: getBrowserScrWidth,
            setTextLimit : setTextLimit,
            isNewElementInArray : isNewElementInArray,
            sortByNewItemOnTop : sortByNewItemOnTop
        };
        return utilityService;

        // will sort array by Date, when there is new item added will put on the first index.
       function sortByDescDate(length, array_object, sortName, ifDefault, isLog ){

           var log = "no change detected";
           // check if there's is a new added element
           var isSorted = false;
               if (length !== array_object.length){
                   if (length === 0){
                       length = array_object.length;
                       array_object = $filter('orderBy')( array_object, -sortName, '$index');
                       log = "initial sort"

                   }else {
                       var lastElement = array_object[array_object.length -1];
                       if($.inArray(lastElement, array_object) !== -1){
                           array_object = sort(array_object, -sortName);
                           log = "initial sort new item added and sorted";
                           isSorted = true;
                       }else{
                           array_object = $filter('orderBy')( array_object, -sortName, '$index');// if they delete element on list
                           log = "default sorting";
                       }
                       length = array_object.length;
                   }
               }else{
                   log = "default"
                   array_object = $filter('orderBy')( array_object, -sortName, '$index');
               }

               if(isLog){
                   console.log(log)

                   console.log(array_object)
               }

               var obj = {array_object: array_object,
                   array_length: length,
                   lastElement: lastElement,
                   isSorted : isSorted
               }
               return obj;
       }


       function sort(array_object, sortName){
           var lastElement = array_object[array_object.length -1];
           array_object.pop();
           array_object = $filter('orderBy')( array_object, -sortName, '$index');
           array_object.unshift(lastElement); // add the last element to first just after sorting

           return array_object;
       }


       /** NEW WAY FOF SORTING LIST
        *
        * array - array tobe sorted,  array must contain date as milliseconds
        * date - will used to sort the array by datye
        * id -- or creation date, identify element by id to be added on the top of array after sorting
        *
        * */
       function sortByNewItemOnTop(array, date, id){

           // sort by by id and get the new element
           array = $filter('orderBy')(array, id);
           var newItem = array[0];
           array.splice(0,1);

           // sort by descending date and put new item on top of the list
           array = $filter('orderBy')( array, date);
           array.unshift(newItem);

           return array;
       }


        function isNewElementInArray(array, length) {
            if(length == 0){
                return false;
            }
            else {
                if( array.length != length ){
                    return true;
                }else{
                    return false;
                }
            }
        }

       /** track object within the array
        *  if found will return index,
        *  if NOT will return -1
        * */
        function containsObject(obj, list) {
            var i;
            for (i = 0; i < list.length ; i++) {
                if ( list[i].id === obj.id   ) {
                    return i;
                }
            }
            return -1;
        }

        function getBrowserScrWidth(callback){
            var screenWidth = window.innerWidth;
            window.onresize = function(event){
                 screenWidth = window.innerWidth;
                 callback(screenWidth) ;
            };
            callback(screenWidth);
        }

        function setTextLimit(value, limit, callback){
            if(!value){
                value = '';
            }
            if(value.length > limit){
                value = value.substr(0,limit);
                callback(value)
            }else {
                callback(value);
            }
        }

    } // end of service function
})();