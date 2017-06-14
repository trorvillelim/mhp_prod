const fs        = require('fs'),
      rest      = require('restler'),
      multer    = require('multer'),
      _u        = require('underscore');

var config = require('config.json')('./conf.json');

var storage = multer.diskStorage({});
var limits = { fileSize: 10 * 1024 * 1024};
var upload = multer({limits: limits, storage: storage});

////////

exports.route = function(base, server){

    server.post(base + '/(*)', upload.any(), processFileUpload);
 
    return;

    ///////

    /**
     * Process File Upload
     */
    function processFileUpload(req, res, next){
        const _api = req.url.replace(base, '');
        const _body = req.body;
        const _headers = req.headers;        

        if ( !req.files || req.files.length <= 0)
            return res.status(400).json('no file');

        const _file = req.files[0];    
        
        var _file_name = _file.originalname;
        if ( _body.filename )
            _file_name = _body.filename;

        //add file
        _body.file = rest.file(_file.path, _file_name, _file.size, _file.mimetype);

        if ( _headers ){
             //remove unnecessary headers
            delete _headers['host'];
            delete _headers['connection'];
            delete _headers['cache-control'];                        
            delete _headers['user-agent'];
            delete _headers['accept'];
            delete _headers['accept-encoding'];
            delete _headers['accept-language'];

            //overwrite 
            _headers['origin'] = 'internal-api';
        }

        var _options = {
            multipart : true, 
            data : _body,
            headers : _headers
        };

        // return res.status(500).json('test item');

        rest
            .post((config.mhpURL + _api), _options)
            .on('complete', function(result, response){
            if ( result instanceof Error )
                return res.status(500).json(result)
            return res.status(response.statusCode).json(result);
        });

    }

}