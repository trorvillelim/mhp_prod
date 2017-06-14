const _u = require('underscore');


const _redirect_to_https_url_exemptions = [
                                        '/health-check.html', 'health-check.html', 
                                        'api', '/api', 
                                        'external', '/external'
                                       ];
const _etag_time = new Date().getTime();


//exports 

exports.redirectToHttps = redirectToHttps;
exports.handleCaching = handleCaching;

////

return;                                  

/**
 * Auto Redirect To HTTPS
 */
function redirectToHttps(req, res, next){
    var _url =  req.url;
    var _host = req.headers['host'] + _url;
    var _x_forwarded_proto = req.headers['x-forwarded-proto'];

    if ( !startsWith(_redirect_to_https_url_exemptions, _url) && _x_forwarded_proto != 'https' )
        return res.redirect('https://' + _host);
    return next();
}


function startsWith(_items, str){
    var _starts = false;
    _items.forEach(function(_item){
        if ( str.indexOf(_item) == 0 ){
            _starts = true
            return true; //break
        }
            
    });
    return _starts;
}

/************
 * Set ETAG
 ************/
function handleCaching(req, res, next){
    // console.log("**********************************")
    // console.log("URL", req.url);
    // console.log(req.headers);
    res.header('Cache-Control', 'no-cache');
    
    // var _etag = req.headers['if-none-match'];

    // res.header('ETag', _etag_time);

    // if ( _etag !=  _etag_time)
    //     res.header('Last-Modified', new Date());

    // console.log("**********************************")
    next();
}