var request = require('request');
// var config = require('config');
var config = require('config.json')('./conf.json');

var async = require('async');

exports.route = function(base, server){

     server.get(base + '/healthcheck', healthcheck);

     return;
    //////////

    /**
     * Get Project Status
     */
    function healthcheck(req, res, next){

        var _health_status = {
            app : config.app,
            environment : config.env, 
            config : {
                server : config.config.server,
                db : config.config.database
            },

            keys : config.keys,
            port : config.port,
            duration : config.duration,
            mhpURL : config.mhpURL,

            mhp_api : {
                url : config.mhpURL
            }
        }

        //do waterfall processes here
        async.waterfall([ 

            //check mhp_api
            function(_waterfall_callback){
                request(_health_status.mhp_api.url + '/randomApiToMakeIt404', function (error, response, body) {
                    if (!error && response.statusCode == 404) {
                       _health_status.mhp_api.status = '1';
                    } else {
                        _health_status.mhp_api.status = '0';
                    }
                    _waterfall_callback();
                });
            }
        ], function(err){
            var status = 200;
            if ( err )  {
                mhp_api.error = {
                    message : "error on checking health",
                    detail : err
                }
            }
              //prettify
            res.setHeader('Content-Type', 'application/json');
            return res.status(status).send(JSON.stringify(_health_status, null, 3));
            
        })


    };


}