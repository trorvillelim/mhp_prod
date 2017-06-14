var SNS = require('sns-mobile'),
    EVENTS = SNS.EVENTS;

var con = require('config.json')('./conf.json');
// var logger = require("../includes/_logging.js");
var AWS = require('aws-sdk');

var credentials;
AWS.config.region = con.keys.REGION;
var sns = new AWS.SNS();

if(con.keys.profile)
{
    credentials = new AWS.SharedIniFileCredentials({profile: con.keys.profile});
    AWS.config.credentials = credentials;

    var APP_ARN = con.keys.APP_ARN,
    REGION = con.keys.REGION,
    SNS_KEY_ID = AWS.config.credentials.accessKeyId,
    SNS_ACCESS_KEY = AWS.config.credentials.secretAccessKey;  
}else{
    var APP_ARN = con.keys.APP_ARN,
    REGION = con.keys.REGION,
    SNS_KEY_ID = "",
    SNS_ACCESS_KEY = "";  
}

 var iOsApp = new SNS({
        platform: SNS.SUPPORTED_PLATFORMS.IOS,
        region: REGION,
        accessKeyId:  SNS_KEY_ID,
        secretAccessKey: SNS_ACCESS_KEY,
        platformApplicationArn: APP_ARN
        //, sandbox: true 
});

var attributes = { Enabled: 'true' };  

function sendNotifications(DeviceToken,Username,NotificationId,Description,NotificationBaseId){
    var payload = {
        default: Description,      
        aps: {
            alert: Description,
            sound: 'default',
            badge: 1,
            category: 'MHP_CATEGORY'
        }, notificationId: NotificationId, notificationBaseId: NotificationBaseId };


    // Add a user, the endpointArn is their unique id 
    // endpointArn is required to send messages to the device 
    iOsApp.addUser(DeviceToken,JSON.stringify({userId: Username}), function(err, endpointArn) {
        if(err) { console.log("ERROR addUser DeviceToken : "+DeviceToken , err); }

        //Set endpointArn Enabled to true
        iOsApp.setAttributes(endpointArn, attributes,function(err,endpointArn) {
            if(err) { console.log("ERROR setAttributes DeviceToken : "+DeviceToken+' - '+  err); }
        });
        
        //Send notifications to Device      
        iOsApp.sendMessage(endpointArn, payload, function(err, messageId) {
            if(err) {
                if(err.code != "EndpointDisabled"){
                   console.log("ERROR with DeviceToken : "+DeviceToken+' - '+  err);      
                }
            }else{
                console.log('NOTIFICATION SENT FOR '+DeviceToken+', notificationId :'+NotificationId+' , messageId was: ' + messageId);
            }
            deleteEndpoint(sns,endpointArn);            
        });
    });    
}

function sendRecommendations(DeviceToken,Username,RecommendationId,RecommendationText,PhysicianId){
    var payload = {  
        default: RecommendationText,      
        aps: {
            alert: RecommendationText,
            sound: 'default',
            badge: 1
            // ,            // category: 'MHP_CATEGORY'
        },  recomId: RecommendationId, physicianId : PhysicianId };


    // Add a user, the endpointArn is their unique id 
    // endpointArn is required to send messages to the device 
    iOsApp.addUser(DeviceToken,JSON.stringify({userId: Username}), function(err, endpointArn) {
        if(err) { console.log("ERROR addUser DeviceToken : "+DeviceToken , err); }

        //Set endpointArn Enabled to true
        iOsApp.setAttributes(endpointArn, attributes,function(err,endpointArn) {
            if(err) {
                console.log("ERROR setAttributes DeviceToken : "+DeviceToken+' - '+  err);   
            }
        });
        
        //Send notifications to Device      
        iOsApp.sendMessage(endpointArn, payload, function(err, messageId) {
            if(err) {               
                if(err.code != "EndpointDisabled"){
                  console.log("ERROR with DeviceToken : "+DeviceToken +' - '+  err);      
                }
            }else{
                console.log('RECOMMENDATION SENT FOR '+DeviceToken+', RecommendationId :'+RecommendationId+' , messageId was: ' + messageId);
            }
            deleteEndpoint(sns,endpointArn);            
        });
    });    
}

function sendQuickNotifications(DeviceToken,Username,NotificationId,Description,NotificationBaseId, callback){
    var payload = {
        default: Description,      
        aps: {
            alert: Description,
            sound: 'default',
            badge: 1,
            category: 'MHP_CATEGORY'
        }, notificationId: NotificationId, notificationBaseId: NotificationBaseId };



    // Add a user, the endpointArn is their unique id 
    // endpointArn is required to send messages to the device 
    iOsApp.addUser(DeviceToken,JSON.stringify({userId: Username}), function(err, endpointArn) {
        var statusMessage = null;
        if(err) { 
            statusMessage = "ERROR addUser DeviceToken : "+ DeviceToken +' - '+ err;
            // console.log(statusMessage); 
            callback(false, statusMessage)
            
        }

        //Set endpointArn Enabled to true
        iOsApp.setAttributes(endpointArn, attributes,function(err,endpointArn) {

            if(err) {
                statusMessage = "ERROR setAttributes DeviceToken : "+DeviceToken +' - '+ err;
                // console.log(statusMessage); 
                callback(false, statusMessage)

            }
        });
        
        //Send notifications to Device      
        iOsApp.sendMessage(endpointArn, payload, function(err, messageId) {
            if(err) {
                if(err.code != "EndpointDisabled"){
                    statusMessage = "ERROR with DeviceToken : "+DeviceToken +" - "+  err;
                    // console.log(statusMessage);      
                    callback(false, statusMessage)
                   
                }
            }else{
                statusMessage = 'NOTIFICATION SENT FOR '+DeviceToken+', notificationId :'+NotificationId+' , messageId was: ' + messageId;
                // console.log(statusMessage);
                callback(true, statusMessage)
            }
            deleteEndpoint(sns,endpointArn);            
        });
    });    
}

function getEndpoint(sns,endpointArn){
    var paramsGet = {
        EndpointArn: endpointArn /* required */
    };
    
    sns.getEndpointAttributes(paramsGet, function(err, data) {
        // if (err) console.log(err, err.stack); // an error occurred
        // else     console.log(data);           // successful response
    });
}

function deleteEndpoint(sns,endpointArn){
    var paramsToDelete = {
        EndpointArn: endpointArn /* required */
    };
    sns.deleteEndpoint(paramsToDelete, function(err, data) {
        if (err){
            // console.log("deleteEndpoint error",err, err.stack); // an error occurred                        
        }
        else {
            // console.log("deleteEndpoint successful",data);           // successful response
        }
    });
}

exports.sendQuickNotifications  =  sendQuickNotifications;
exports.sendNotifications  =  sendNotifications;
exports.sendRecommendations  =  sendRecommendations;