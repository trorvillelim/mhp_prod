var logs_dao = require('./../dao/logs.dao.js');
var promise_util = require('./../utils/promise.util.js');
var Promise = require('promise');


exports.getPatientsTotalLogsByDoctor = getPatientsTotalLogsByDoctor;

//////
return;


/*****
 * Get Patients total logs
 *  - per month
 * 
 * Error 
 *  - {
 *          status : (int) statusCode
 *          reason : reason
 *   }
 */
function getPatientsTotalLogsByDoctor(_connection, _connection_request,  _physician_user_id, _month, _year){
    return new Promise(function(fullfill, reject){
        try {
            var _param_physician_user_id;
            var _param_month;
            var _param_year;

            //validation
            if ( !_physician_user_id ) 
                return reject(promise_util.error(400, "'physician_user_id' field is required"));

            _param_physician_user_id = _physician_user_id;
            if ( _month > 0 && _month <= 12 )
                _param_month = _month;
            
            if ( _year > 0)
                _param_year = _year

            //Do DAO
            logs_dao
                .getPatientsTotalLogsByDoctor(_connection, _connection_request, _param_physician_user_id, _param_month, _param_year)
                .then(function(resultSet){
                    return fullfill({status : 200, message : resultSet});
                }).catch(function(err){
                    console.log(err,'%s', 'MsSql Error');
                    throw err;
                });

        } catch (err) {
            return reject(promise_util.error(500, err));
        }
    });
}
   