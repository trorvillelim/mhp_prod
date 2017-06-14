exports.handleServicePromise = handleServicePromise;


//////

/**
 * Handle Service Promise
 */
function handleServicePromise(service_promise, req, res, next, show_response){

    service_promise
        .then(successResponse, errorResponse)
        .catch(errorResponse);

    ///////

    var _url = req.url;
    function successResponse(response){
        
        if ( show_response )
            console.log(_url + ' called. Response  : ', JSON.stringify(response));
        else
            console.log(_url + ' called.');
        return res.json(response);            
    }

    function errorResponse(err){
        console.error(_url + ' called. Error = ' + JSON.stringify(err));
        return res.status(500).json(err);
    }

};