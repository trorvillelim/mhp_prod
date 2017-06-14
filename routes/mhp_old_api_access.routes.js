var request = require('request');
var mime    = require('mime-types')
var config   = require('config.json')('./conf.json');



exports.route = function(base, server){

    server.post(base + '/Token', processAuthentication);    
    server.get(base + '/DownloadFile/:patientUserId/:fileName', processDownloadFile);
    server.get(base + '/(*)', processGet);
    server.post(base + '/(*)', processPost);

    return;

    ///////

    function processDownloadFile(req, res, next){
        var _api = '/api/GetMePhysicianPatientDocument';
        var _headers = req.headers;
                
        //add fields
        var _patient_user_id = 'fa61cccf-ff69-4d3c-8313-04bdef5f8659';
        var _filename = 'Andress-Paulsen-212017to-2282017-timelog-per-patient-1487928224485.pdf';

        //build api request
        _api += '?' + ([
                            'patientUserId='+_patient_user_id, 
                            'fileName=' + _filename, 
                            'bData=true',
                            'bMetadata=true', 
                            'bGenerateUrl=false',
                            'bTags=false'
                        ].join('&'));


        //temp ( set auth header )
        _headers = {
            Authorization : 'Bearer dIGM57H1EgeYqfhSDwJ_vLQAXOckS_WDldZgUWV8BxD5A-OwKtphkqNXI9gN0OIeLnFrXsBWdbW9-GhZzjWX32MFDTUhlS-lzkfDjhJxQ7RH3D0IjUHiDZy5RGOQ1sKVGGtSYm_P9Ymjcmc-UiT2ed3-701CuIehKDq5vfVswX5vgHm0tEDy8kz1i4ooV1pnw_egoJsOMDQNtySK__Q2Fcq22peCxVfrnA3taaPqMksHGytVo1Dw9kSMzrv5hN-JVwpBj9dqmbXbTcu1B-0_H-12EeENGdeyaHKTnRaJ3tdHPXeg7a7KqNGHVRr3BONE84i_oxciWKflDSVK6K1XVdMIN7RX6B1OHMT4kCXOujGM2qFsR6Usqbj8A5UgInA1liMLla8-NTzGmCeJCD5mvHUuVQMnLBWokbWDekBR8oF16dO0n2e0CLacQaWvNv_wfAjIpQAq6QOb3F14y7QaFGDn1AOO60tQF7_CVNjWkLlTVdQO3SBYBUBYmHzGNAMHboJrWg'
        };
        
        return doRequest(_api, 'GET', _headers, {}, function(err, status_code, response_body){

            var _file_data = response_body.data;
            var _file_name = response_body.docName;
            var _file_size = response_body.size;
            var _file_mime = mime.lookup(_filename);

            res.setHeader('Content-Type', _file_mime);
            res.setHeader('Content-Length', _file_size);
            // res.setHeader('Content-Disposition', 'attachment; filename="'+_file_name+'"');//fileName);')
            res.send(_file_data);
            return res.end();            
            // return res.status(status_code).json(response_body);
        });
    }

    /**
     * Bridge GET Requests to mhp old apis
     */
    function processGet(req, res, next){
        const _api = req.url.replace(base, '');
        const _body = req.body;
        var _headers = req.headers;
        return doRequest(_api, 'GET', _headers, _body, function(err, status_code, response_body){
            return res.status(status_code).json(response_body);
        });

    }

    /**
     * Bridge POST authentication Requests to mhp old authenticate api 
     */
    function processAuthentication(req, res, next){

        const _api = req.url.replace(base, '');
        const _body = req.body.creds;
        var _headers = req.headers;

        //validate
        if ( !_body )
            return res.status(400).json({
                "info": "creds field is required, checkout example json object",
                "example" : {
                    "creds" : "grant_type=password&username=john.doe@test.com&password=Sample_password_1"
                }
            });

        return doRequest(_api, 'POST', _headers, _body, function(err, status_code, response_body){
            return res.status(status_code).json(response_body);
        });

    }

    /**
     * Bridge POST Requests to mhp old apis 
     */
    function processPost(req, res, next){
        const _api = req.url.replace(base, '');
        const _body = req.body;
        var _headers = req.headers;

        return doRequest(_api, 'POST', _headers, _body, function(err, status_code, response_body){
            return res.status(status_code).json(response_body);
        });

    }
    

    /**
     * Main Request
     */
    function doRequest(_api, _method, _headers, _body, callback){

        if ( _headers ){

             //remove unnecessary headers
            delete _headers['host'];
            delete _headers['connection'];
            delete _headers['content-length'];
            delete _headers['cache-control'];                        
            delete _headers['user-agent'];
            delete _headers['accept'];
            delete _headers['accept-encoding'];
            delete _headers['accept-language'];

            //overwrite 
             _headers['origin'] = 'internal-api';
        }

        if ( _body instanceof Object)
            _body = JSON.stringify(_body);

         var options = {
            method : _method,
            url: (config.mhpURL + _api),
            headers: _headers,
            body : _body
        };
        
        
        request(options, function(err, _response, _response_body){
            if ( err ) {        
                return callback(err, 500, _response_body)
            }

            var _response_object;
            try {
                var _response_headers = _response.headers;
                _response_object = JSON.parse(_response_body);
            } catch ( err ){
                _response_object = _response_body;
            }

            return callback(null, _response.statusCode, _response_object);
        });

    }


}