
var express         = require('express'),
    cors            = require('cors'),
    cookieParser    = require('cookie-parser'),
    bodyParser      = require('body-parser'), 
    moment          = require('moment');

var db_connection       = require("./database_configuration/mssql_connection.js");
var server_middleware   = require('./custom_modules/server_middleware.module.js');
var configuration       = require('config.json')('./conf.json');

var is_local    = process.env.MHP_DEV_ENV === 'local';
var is_dev      = process.env.NODE_ENV === 'development';

var app = express();

/************************
 * Configure Server
 ***********************/
app.use(cors());
app.use(bodyParser.json());  
app.use(cookieParser());

//Redirect to HTTPS middleware
if ( !is_local ){
    app.use(server_middleware.redirectToHttps);
}

/**
 * START APP
 */
//connect to db first
db_connection.connect(function(err, connection){

    /************************
     * Constants
     ***********************/
    const base_api_url = "/api", 
        old_mhp_api_base_url = "/external", 
        old_mhp_api_file_upload_base_url = "/external-file-upload";

    /************************
     * ROUTES
     ***********************/
    require('./routes/health_check.routes.js').route(base_api_url, app);
    require('./routes/mhp_old_api_access.routes.js').route(old_mhp_api_base_url, app);
    require('./routes/mhp_old_api_access_file_upload.routes.js').route(old_mhp_api_file_upload_base_url, app);

    /************************
     * Old Implementation
     ***********************/
    var timer = require("./main/timer.js");
    var mhpApi = require("./main/api.js");

    mhpApi.goToApi(app, connection);
    timer.goToTimer();

    /************************
     * Static Files
     ***********************/
    app.use('/', express.static('public/app'));

    /************************
     * Error Handlers
     ***********************/
    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        var _url = req.url;
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {

        if ( is_local || is_dev )
            console.error(err.message);

        if ( res.headersSent )
            return;

        res.status(err.status || 500)
            .send({ message: err.message, error: {} });
    });
    

    if ( err )
        console.log("ERROR on DB connection", err);

    app.listen(configuration.port, function (err) {
        if ( err ) {
            console.log(err);
            throw err;
        }
        console.log('MHP API app listening on port ' + configuration.port)
    });

    app.on('InternalServer', function (req, res, err, cb) {
        err.body = 'InternalServer Error :' + err;
        return cb();
    });

    app.on('uncaughtException',function(request, response, route, error){
        console.log(error.stack);
        response.send(error);
    });
});


