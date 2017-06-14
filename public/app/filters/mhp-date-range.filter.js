'use strict';
(function(){

    angular
        .module('app.filter.module')
        .filter('mhpDateRangeFilter', mhpDateRangeFilter);


        mhpDateRangeFilter.$inject = [];
        function mhpDateRangeFilter(){

            /**
             * 
             * _items_params
             * _do - (boolean) | required : will be used to push through the filtering 
             * _start_date_params - (date, millis, string) | required
             * _end_date_params - (date, millis, string) | required
             * _target_item_field = (target_field_name) | required
             */
            return function filter(_items_params, _do, _start_date_params, _end_date_params, _target_item_field){   

                //validation
                if ( !_target_item_field )
                    throw '_target_item_field is required';

                if ( _do !== true ) //if not do, then will not apply filtering
                    return _items_params;

                var start_date = new Date(_start_date_params);
                var end_date = new Date(_end_date_params);

                if ( start_date.toString() == 'Invalid Date' )
                    return [];

                if ( end_date.toString() == 'Invalid Date' )
                    return [];

                //get millis value
                start_date = start_date.getTime();
                end_date = end_date.getTime();

                var _filtered_items = _items_params;
                if ( _items_params instanceof Array){
                    _filtered_items = [];
                    _items_params.forEach(function(_item){
                        var _item_date = _item[_target_item_field];
                        _item_date = new Date(_item_date);
                        if ( _item_date && _item_date.toString() !== 'Invalid Date'){
                            _item_date = _item_date.getTime(); //to millis
                            if ( _item_date >= start_date && _item_date <= end_date )
                                _filtered_items.push(_item);
                        }
                    });
                }

                return _filtered_items;                             
            }

        }

})(); 