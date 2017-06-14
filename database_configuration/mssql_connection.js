var mssql = require("mssql");
var con = require('config.json')('./conf.json');

var _already_connected;
var request;
 
/* Live MHP DB server */
var config = {
	user: con.config.user,
	password: con.config.password,
	server: con.config.server, 
	database: con.config.database,
	options: {
		useUTC:false
	}
};

exports.config = config;
exports.mssql = mssql;
exports.connect = connect;

function connect(callback){
	mssql.connect(config, function(err){
		if (err) {
			console.log(err);
			return callback(err);
		}
		request = new mssql.Request();
		return callback(null, mssql);
	});

    mssql.on('error', function(err) {
		console.log("ERROR on MSSQL", err);
    });
}