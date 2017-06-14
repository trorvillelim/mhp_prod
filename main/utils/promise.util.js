exports.error = error;

////


/**
 * Create Error Object
 * 
 * {
 *  status (int)
 *  reason (any)
 * }
 */
function error (status, reason){
    if ( status > 200 )
        console.log("ERROR", reason);
    return {
        status : status,
        reason : reason
    }

}