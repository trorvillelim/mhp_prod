var NanoTimer = require('nanotimer');
var conn = require("../database_configuration/mssql_connection.js");
// var logger = require("../includes/_logging.js");
var moment = require('moment');


var count = 0;
var timer = new NanoTimer();

function goToTimer(){
    timer.setInterval(countDown, '', '50s');
}

function countDown(){
    // checkNotifications();
    // count++;

    conn.mssql.connect(conn.config,checkForSnsPush);
    count++;
}


function checkForSnsPush(err){   
    if (err) console.log(err)
    else{
        checkNotifications();
        checkRecommendations();
    }
    
}

function checkRecommendations(){
    var currrentTime = new Date();
    currrentTime = moment(currrentTime).format('LTS');

        var request = new conn.mssql.Request();
        var sql = [" SELECT RECOM.id as recomId, RECOM.recText,RECOM.recDate , ",
                    " CONVERT(VARCHAR(16),DATEADD(hh, -8, RECOM.recDate)) as UtcEventDate, ",
                    " CONVERT(VARCHAR(16), FORMAT(GETDATE(), 'yyyy-MM-dd HH:mm') ) as UtcCurrentDate, ",
                    " RECOM.physicianId, PATIENTS.id as patientId, PATIENTS.userId, USERDEVICES.DeviceToken  ",
                    " FROM recommendations as RECOM  ",
                    " INNER JOIN dbo.patients PATIENTS ON PATIENTS.id = RECOM.patientId  ",
                    " INNER JOIN dbo.userDevices USERDEVICES ON USERDEVICES.userId = PATIENTS.userId  ",
                    " WHERE  CONVERT(VARCHAR(16),DATEADD(hh, -8, RECOM.recDate))  >= FORMAT(GETDATE(), 'yyyy-MM-dd HH:mm')  ",
                    " AND USERDEVICES.status = '0' AND USERDEVICES.DeviceToken != ''  ",
                    " GROUP BY RECOM.id, RECOM.recText, RECOM.recDate , RECOM.physicianId, ",
                    " PATIENTS.id, PATIENTS.userId, USERDEVICES.DeviceToken"].join('\n');

        request.query(sql, function(err, recordset) {
            if(err){
                console.log(err,'%s', 'MsSql Error');
            }else{
                if (recordset.length > 0){
                    for (var item in recordset ){
                        if( recordset[item].DeviceToken.length == 71  ){
                            /**OLD IMPLEMENTATION */
                            // var currenttime = moment(new Date()).format('YYYY-MM-DD HH:mm'); // SERVER TIME
                            // var time = moment(new Date(recordset[item].recDate)).format('YYYY-MM-DD HH:mm');  //LOCAL TIME
                            // var utcTime = moment(new Date()).utc().format('YYYY-MM-DD HH:mm'); // EventDate in UTC

                            // console.log("FOR PUSH -> recomId : "+recordset[item].recomId+" | serverCurrentTime : "+currenttime+" | recDate : " + time + " | utcCurrentTime : " + utcTime);
                                              
                            // if (time == currenttime){   /** uses server time Uncomment upon deployment    */                 
                            // // if ( time == utcTime){   /** uses UTC datetime from recommendations for TEST in local machine  */                        

                            var currentTime = moment(new Date()).format('YYYY-MM-DD HH:mm'); // SERVER CURRENT TIME
                            
                            var recDate = moment(new Date(recordset[item].recDate)).format('YYYY-MM-DD HH:mm');  // RECOMMENDATIONDATE FROM API (IN LOCAL TIME FORMAT)
                            var utcEventDate = moment(new Date(recordset[item].UtcEventDate)).format('YYYY-MM-DD HH:mm'); // UTCEVENTDATE FROM API (IN UTC TIME FORMAT)
                            var utcServerCurrentDate = moment(new Date(recordset[item].UtcCurrentDate)).format('YYYY-MM-DD HH:mm'); // UTCCURRENTDATE FROM API (IN UTC TIME FORMAT)

                            console.log("RECOMMENDATION PUSH -> " + recordset[item].recomId + 
                                        " | recDate : " + recDate + 
                                        " | utcEventDate :" + utcEventDate + 
                                        " | utcServerCurrentDate : " + utcServerCurrentDate +
                                        " | currentTime : " + currentTime );    

                            if (utcEventDate == utcServerCurrentDate){ /** uses return time from API */    
                                try {
                                    // var util = require('util');
                                    var app = require('../includes/_sns.js');
                                    app.sendRecommendations(recordset[item].DeviceToken,recordset[item].userId,recordset[item].recomId,recordset[item].recText,recordset[item].physicianId,
                                    (function (err) {
                                        if (err) {
                                            console.log(err,'%s', 'Error sending message');
                                        }else{
                                            console.log('Message Sent')
                                        }
                                    }));
                                } catch (err) {console.log("Catch: ",err);}
                            }
                        }else{
                            console.log("Invalid Device Token : {" + recordset[item].DeviceToken + "}");
                        }
                    }/***END For Each */
                }else{console.log(  currrentTime + " | Recommendations result : ", recordset.length );}
            }
        });
}


function checkNotifications(){
        var currrentTime = new Date();
        currrentTime = moment(currrentTime).format('LTS');

        var request = new conn.mssql.Request();
        var sql = ["SELECT GETDATE() as datenow, ",
                    " NOTIF.notificationBaseId, NOTIF.id, CONVERT(VARCHAR(16),NOTIF.EventDate) as EventDate,  ",
                    " CONVERT(VARCHAR(16),DATEADD(hh, -8, NOTIF.EventDate)) as UtcEventDate, ",
                    " CONVERT(VARCHAR(16), FORMAT(GETDATE(), 'yyyy-MM-dd HH:mm') ) as UtcCurrentDate, ",
                    " NOTIF.deliverydDate, NOTIFBASE.description ,NOTIFBASE.patientId,PATIENTS.userId,USERDEVICES.DeviceToken ",
                    " FROM dbo.notifications as NOTIF ",
                    " INNER JOIN dbo.notificationBases NOTIFBASE ON NOTIFBASE.id = NOTIF.notificationBaseId ",
                    " INNER JOIN dbo.patients PATIENTS ON PATIENTS.id = NOTIFBASE.patientId ",
                    " INNER JOIN dbo.userDevices USERDEVICES ON USERDEVICES.userId = PATIENTS.userId ",
                    " WHERE  CONVERT(VARCHAR(16),DATEADD(hh, -8, NOTIF.EventDate)) >= FORMAT(GETDATE(), 'yyyy-MM-dd HH:mm') ",
                    " AND USERDEVICES.status = '0' AND USERDEVICES.DeviceToken != ''  ",
                    " GROUP BY USERDEVICES.DeviceToken,NOTIF.notificationBaseId, ",
                    " NOTIF.id,NOTIF.EventDate,NOTIF.deliverydDate, ",
                    " NOTIFBASE.description ,NOTIFBASE.patientId,PATIENTS.userId"].join('\n');

        request.query(sql, function(err, recordset) {
            if(err){
                console.log(err,'%s', 'MsSql Error');
            }else{
                if (recordset.length > 0){
                    for (var item in recordset ){
                        if( recordset[item].DeviceToken.length == 71  ){
                        /**OLD IMPLEMENTATION */
                        //     var currenttime = moment(new Date()).format('YYYY-MM-DD HH:mm');   // SERVER CURRENT TIME 
                        //     var time = moment(new Date(recordset[item].EventDate)).format('YYYY-MM-DD HH:mm'); // TIME FORMAT FROM API (IN LOCAL TIME)
                        //     var utcTime = moment(new Date(recordset[item].UtcEventDate)).format('YYYY-MM-DD HH:mm'); // EventDate in UTC
                            
                        //     console.log("FOR PUSH -> notificationId : "+recordset[item].id+" | currenttime : "+currenttime+" | eventDate : " + time + " | utcEventDate :" + utcTime);
                            
                       
                        // // if (time == currenttime){  /** TEST in local machine */                        
                        //     if (utcTime == currenttime){   /** uses server time */    

                            var currentTime = moment(new Date()).format('YYYY-MM-DD HH:mm');   // SERVER CURRENT TIME 
                            
                            var eventDate = moment(new Date(recordset[item].EventDate)).format('YYYY-MM-DD HH:mm'); // TIME FORMAT FROM API (IN LOCAL TIME)
                            var utcEventDate = moment(new Date(recordset[item].UtcEventDate)).format('YYYY-MM-DD HH:mm'); // UTCEVENTDATE FROM API (IN UTC TIME FORMAT)
                            var utcServerCurrentDate = moment(new Date(recordset[item].UtcCurrentDate)).format('YYYY-MM-DD HH:mm'); // UTCCURRENTDATE FROM API (IN UTC TIME FORMAT)
                            
                            console.log("NOTIFICATION PUSH -> " + recordset[item].id + 
                                        " | eventDate : " + eventDate + 
                                        " | utcEventDate :" + utcEventDate + 
                                        " | utcServerCurrentDate : " + utcServerCurrentDate +
                                        " | currentTime : " + currentTime );
                                             
                            if (utcEventDate == utcServerCurrentDate){   /** uses return time from API */                                 
                                try {
                                    // var util = require('util');
                                    var app = require('../includes/_sns.js');
                                    app.sendNotifications(recordset[item].DeviceToken,recordset[item].userId,recordset[item].id,recordset[item].description,recordset[item].notificationBaseId,
                                    (function (err) {
                                        if (err) {
                                            console.log(err,'%s', 'Error sending message');
                                        }else{
                                            request.input('itemId', conn.mssql.NVarChar(50), recordset[item].id);
                                            request.input('eventDate', conn.mssql.NVarChar(100), recordset[item].EventDate);

                                            var sqlUpdate ="UPDATE notifications SET deliverydDate = @eventDate where id = @itemId";
                                            request.query(sqlUpdate).then(function(err, rows) {
                                                if (err) {console.log(err,'%s', 'Error updating deliveryDate');
                                                }else{ console.log("Affected Rows :" + request.rowsAffected); }
                                            });
                                        }
                                    }));
                                } catch (err) {console.log("Catch: ",err);}
                            }
                        }else{
                            console.log("Invalid Device Token : {" + recordset[item].DeviceToken + "}");
                        }
                    }/***END For Each */
                }else{console.log( currrentTime + " | Notifications result : ", recordset.length );}
            }
        });
}









function checkNotificationsss(){ 
    conn.mssql.connect(conn.config, function (err) {
        // if (err)logger.log.error(err);
        if (err) console.log(err)
       
        // logger.log.info('Checking notifications as of ' + getDateTime());
        console.log('Checking notifications as of ' + getDateTime());
        var request = new conn.mssql.Request();
        var sql = ["SELECT GETDATE() as datenow,",
                    "NOTIF.notificationBaseId, NOTIF.id, CONVERT(VARCHAR(16),NOTIF.EventDate) as EventDate, ",
                    "CONVERT(VARCHAR(16),DATEADD(hh, -8, NOTIF.EventDate)) as UtcEventDate, NOTIF.deliverydDate,",
                    "NOTIFBASE.description ,NOTIFBASE.patientId,PATIENTS.userId,USERDEVICES.DeviceToken",
                    "FROM dbo.notifications as NOTIF",
                    "INNER JOIN dbo.notificationBases NOTIFBASE ON NOTIFBASE.id = NOTIF.notificationBaseId",
                    "INNER JOIN dbo.patients PATIENTS ON PATIENTS.id = NOTIFBASE.patientId",
                    "INNER JOIN dbo.userDevices USERDEVICES ON USERDEVICES.userId = PATIENTS.userId",
                    "WHERE  CONVERT(VARCHAR(16),DATEADD(hh, -8, NOTIF.EventDate))>= FORMAT(GETDATE(), 'yyyy-MM-dd HH:mm')",
                    "AND USERDEVICES.status = '0' AND USERDEVICES.DeviceToken != '' ",
                    "GROUP BY USERDEVICES.DeviceToken,NOTIF.notificationBaseId,",
                    "NOTIF.id,NOTIF.EventDate,NOTIF.deliverydDate,",
                    "NOTIFBASE.description ,NOTIFBASE.patientId,PATIENTS.userId "].join('\n');

        request.query(sql, function(err, recordset) {
            if(err){
                // logger.log.error(err,'%s', 'MsSql Error');
                console.log(err,'%s', 'MsSql Error');
            }else{
                if (recordset.length > 0){
                    for (var item in recordset ){
                        if( recordset[item].DeviceToken.length == 71  ){
                            var currenttime = getDateTimeOnly(new Date()); // SERVER UTC TIME
                            var time = getDateTimeOnly(recordset[item].EventDate); //LOCAL TIME
                            var utcTime = getDateTimeOnly(recordset[item].UtcEventDate); // EventDate in UTC
                            
                            // logger.log.info("FOR PUSH -> notificationId : "+recordset[item].id+" | currenttime : "+currenttime+" | eventDate : " + time + " | utcEventDate :" + utcTime);
                            console.log("FOR PUSH -> notificationId : "+recordset[item].id+" | currenttime : "+currenttime+" | eventDate : " + time + " | utcEventDate :" + utcTime);
                            
                                // logger.log.info("FOR PUSH -> notificationId : "+recordset[item].id+ " | DeviceToken : " + recordset[item].DeviceToken +" | utcEventDate :" + utcTime);
                       
                        if (time == currenttime){  /** TEST in local machine */                        
                            // if (utcTime == currenttime){   /** uses server time */                                 
                                try {
                                    //  logger.log.info("Time Comparison : " +currenttime +" == "+ time);
                                    //  console.log("Time Comparison : " +currenttime +" == "+ time);
                                     
                                    // var util = require('util');
                                    var app = require('../includes/_sns.js');
                                    app.sendNotifications(recordset[item].DeviceToken,recordset[item].userId,recordset[item].id,recordset[item].description,recordset[item].notificationBaseId,
                                    (function (err) {
                                        if (err) {
                                            // logger.log.error(err,'%s', 'Error sending message');
                                            console.log(err,'%s', 'Error sending message');
                                        }else{
                                            request.input('itemId', conn.mssql.NVarChar(50), recordset[item].id);
                                            request.input('eventDate', conn.mssql.NVarChar(100), recordset[item].EventDate);

                                            var sqlUpdate ="UPDATE notifications SET deliverydDate = @eventDate where id = @itemId";
                                            request.query(sqlUpdate).then(function(err, rows) {
                                                if (err) {
                                                    // logger.log.error(err,'%s', 'Error updating deliveryDate');
                                                    console.log(err,'%s', 'Error updating deliveryDate');
                                                }else{
                                                    // logger.log.info("Affected Rows :" + request.rowsAffected);
                                                    console.log("Affected Rows :" + request.rowsAffected);
                                                    
                                                }
                                            });
                                        }
                                    }));
                                } catch (err) {console.log("Catch: ",err);}
                            }
                        }else{
                            console.log("Invalid Device Token : {" + recordset[item].DeviceToken + "}");
                        }
                    }/***END For Each */
                }else{console.log( "checkNotifications result : ", recordset.length );}
            }
        });
    });
}





 function getDateTime() {
    var date = new Date();
    var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;
    var sec  = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
        day = (day < 10 ? "0" : "") + day;

    return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;
}
 function getDateTimeOnly(data) {
    var date = new Date(data);
    var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
        day = (day < 10 ? "0" : "") + day;

    return year + "-" + month + "-" + day + " " + hour + ":" + min;
}

exports.goToTimer = goToTimer;