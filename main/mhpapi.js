var request = require('request');

function GetMeUserId(urlHost,authorizationToken, callback)
{
	var userId;
	request({
		uri: urlHost + "/api/GetMeUserId/" ,
		method: "GET",
		headers: {'Content-Type' : 'application/json',
				  'Authorization': authorizationToken},
	}, function(error, response, body) {
		userId = JSON.parse(body);
		// console.log("getUserIDx: " , userId);
		return callback(userId);	
	});
}

exports.GetMeUserId=GetMeUserId;
