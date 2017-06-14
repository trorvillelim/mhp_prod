var moment = require('moment');
var conn = require("../database_configuration/mssql_connection.js");
var con = require('config.json')('./conf.json');
var port = con.port;

var logs_service = require('./service/logs.service.js');
var route_util = require('./utils/route.util.js');

var mhp = require("../main/mhpapi.js")

function goToApi(server, connection) {
    
    var request = new connection.Request();

    //apis
    server.post('/api/getPatientsTotalLogsByDoctor', getPatientsTotalLogsByDoctor);              
    server.post('/TestNodeServer', TestNodeServer);    
    server.post('/api/NotificationResponse', NotificationResponse);    
    server.post('/api/DoctorLogs', DoctorLogs);    
    server.post('/api/PatientLogs', PatientLogs);
    server.post('/api/PatientLogsAll', PatientLogsAll);
    server.post('/api/LogTime', newAPILogTime);     
    server.post('/api/DeleteTimeLog', DeleteTimeLog);     
    server.post('/api/UpdateLogTime', UpdateLogTime); 
    server.post('/api/getLogDetailsById', getLogDetailsById);    
    server.post('/api/getPatientIntId', getPatientIntId);    
    server.post('/api/GetPatientNotReviewed', GetPatientNotReviewed);    
    server.post('/api/CheckUserRole', CheckUserRole);    
    server.post('/api/PatientLogsTest', PatientLogsTest);    
    server.post('/api/GetNotificationPushDetails', GetNotificationPushDetails);    

    ///////////

    /**
     * 
     */
    function TestNodeServer(req, res, next) {
        var resp = {
            status: "200",
            message: "WORKING!",
            SERVER : con.config.server,
            DATABASE : con.config.database,
            APP_ARN: con.keys.APP_ARN,
            REGION: con.keys.REGION,
            PORT: con.port,
            DURATION : con.duration,
            URL : con.mhpURL
        }
        console.log("/TestNodeServer called. Response = "+ JSON.stringify(resp));
        return res.json(resp);
    }

    /**
     * 
     */
    function NotificationResponse(req, res, next) {
        var params = req.body;            
        request.input('AuthToken', conn.mssql.NVarChar(250), params.AuthToken);
        request.input('NotificationId', conn.mssql.NVarChar(50), params.NotificationId);
        request.input('ResponseType', conn.mssql.NVarChar(50), params.ResponseType);
        request.input('deliveryDate', conn.mssql.NVarChar(100), params.deliveryDate);
        request.input('confirmationDate', conn.mssql.NVarChar(100), params.confirmationDate);
        request.input('snoozeDateTime', conn.mssql.NVarChar(100), params.snoozeDateTime);

        var ResponseType =params.ResponseType;
        switch (ResponseType) {
            case "0":
                    var sqlUpdate = ["UPDATE dbo.notifications SET responseType =@ResponseType,confirmationDate=@confirmationDate",
                        "WHERE id=@NotificationId"].join('\n');
                break;
            case "1":
                    var sqlUpdate = ["UPDATE dbo.notifications SET responseType =@ResponseType,deliverydDate=@snoozeDateTime,eventDate=@snoozeDateTime",
                        "WHERE id=@NotificationId"].join('\n');
                break;
            default:
        }

        var resp;
        if(sqlUpdate){
            request.query(sqlUpdate).then(function(err, rows) {
                if (err) {
                    console.log(err,'%s', 'Error updating notifications table.');
                    resp = {status: "401", error: err}
                } else {
                    resp = { status: "200", message: "Affected Rows :" + request.rowsAffected }
                }
                console.log("/api/NotificationResponse called. Params = " + JSON.stringify(req.body)+ ". Response = " + JSON.stringify(resp));                    
                return res.json(resp);    
            }, function(err){
                console.error('error', err);
                return res.status(500).json(err);
            });
        } else {
            resp = {status: "401", error: "Invalid ResponseType!"}
            console.log("/api/NotificationResponse called. Params = " + JSON.stringify(req.body)+ ". Response = " + JSON.stringify(resp));
            return res.json(resp);
        }
    }

    /**
     * 
     */
    function DoctorLogs(req,res,next){
        var params = req.body;

        request.input('userId', conn.mssql.NVarChar(250),params.UserId);
        request.input('StartDate', conn.mssql.NVarChar(250),params.StartDate);
        request.input('EndDate', conn.mssql.NVarChar(250),params.EndDate);
        var sqlQuery = ["SELECT DISTINCT (patients.userId),",
                            " AspNetUsers.LName + ', ' +	AspNetUsers.FName as Name, ",
                            " CONVERT(VARCHAR(10), max(patientReviewLogs.reviewedDate), 101) + ' ' + ",
                            " LTRIM(RIGHT(CONVERT(CHAR(20), max(patientReviewLogs.reviewedDate), 22), 11)) as latestDateTimeReviewed,",
                            " patientReviewLogs.patientId,",
                            " RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration)  ) / 3600 AS VARCHAR),2) + ' hr ' +",
                            " RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration)   / 60) % 60 AS VARCHAR),2) + ' min ' +",
                            " RIGHT('0' + CAST( (SUM (patientReviewLogs.duration)  ) % 60 AS VARCHAR),2) + ' sec ' as duration,",
                            " SUM (patientReviewLogs.duration) as Seconds",
                        " FROM dbo.patientReviewLogs as patientReviewLogs",
                        " LEFT JOIN dbo.patients patients ON patients.id =  patientReviewLogs.patientId",
                        " LEFT JOIN dbo.AspNetUsers AspNetUsers ON AspNetUsers.Id = patients.userId",
                        " LEFT JOIN physicians ON physicians.id = patientReviewLogs.physicianId",
                        " INNER JOIN researchAssistantphysicians ON researchAssistantphysicians.physician_id = physicians.id",
                        " INNER JOIN researchAssistants ON researchAssistants.id = researchAssistantphysicians.researchAssistant_id",
                            " WHERE ( physicians.userId = @userId OR researchAssistants.userId = @userId ) ",
                            " AND patientReviewLogs.reviewedDate >= @StartDate and patientReviewLogs.reviewedDate <=  DATEADD(day,1,@EndDate) ",
                            " GROUP BY patients.userId, AspNetUsers.FName, AspNetUsers.LName, patientReviewLogs.patientId"].join('\n');

        var resp;
        request.query(sqlQuery, function(err, recordset){               
            if (err) {
                console.log(err,'%s', 'MsSql Error');
                resp = {status: "401", error: err}
            } else {
                resp = {status: "200", message: recordset}
            }
            console.log('/api/DoctorLogs called. Response = ' + JSON.stringify(resp));
            return res.json(resp);
        }, function(err){ 
            console.error('error', err);    
            return res.status(500).json(err);
        });
    }    

    /**
     * 
     */
    function PatientLogs(req,res,next){
        var params = req.body;
        var patientUserId = params.PatientUserId;           

        GetPatientIdbyUserId(patientUserId,function(patientId, isNotFound, message){
            
                if ( isNotFound )
                return res.status(500).json( message);

            request.input('PatientId', conn.mssql.NVarChar(250),patientId);
            request.input('StartDate', conn.mssql.NVarChar(250),params.StartDate);
            request.input('EndDate', conn.mssql.NVarChar(250),params.EndDate); 
            var sqlQuery = ["SELECT DISTINCT ",
                            // " (patientReviewLogs.pageReviewed), ",
                            " (patientReviewLogs.pageReviewed), patientReviewLogs.id, patientReviewLogs.Note, patientReviewLogs.CreatedDate created_date, ",
                            " AspNetUsers.LName + ', ' +	AspNetUsers.FName as Name,",
                            " RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration)  ) / 3600 AS VARCHAR),2) + ' hr ' +",
                            " RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration)   / 60) % 60 AS VARCHAR),2) + ' min ' +",
                            " RIGHT('0' + CAST( (SUM (patientReviewLogs.duration)  ) % 60 AS VARCHAR),2) + ' sec 'totalDuration,",
                                "CONVERT(VARCHAR(10), max(patientReviewLogs.reviewedDate), 101) + ' ' ",
                                "+ LTRIM(RIGHT(CONVERT(CHAR(20), max(patientReviewLogs.reviewedDate), 22), 11)) as latestDateTimeReviewed ,",
                            
                            " patientReviewLogs.patientId, ",
                            "SUM (patientReviewLogs.duration) as Seconds,",
                            "( (RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration)  ) / 3600 AS VARCHAR),2) * 60) +",
                            "RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration)   / 60) % 60 AS VARCHAR),2) ) as totalMinutes,",
                            "CAST (( (RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration)  ) / 3600 AS VARCHAR),2) * 60) ",
                            "+ RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration) / 60) % 60 AS VARCHAR),2) ) as nvarchar(800))  ",
                            "+ '.' + RIGHT('0' + CAST( (SUM (patientReviewLogs.duration)  ) % 60 AS VARCHAR),2)  as Minutes",

                            /*** for totalDuration
                             */
                            ", SUM (patientReviewLogs.duration) OVER () as GrandTotalSeconds,",
                            "RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration)  OVER () ) / 3600 AS VARCHAR),2) + ' hr ' +",
                            "RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration) OVER ()   / 60) % 60 AS VARCHAR),2) + ' min ' +",
                            "RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration) OVER ()  ) % 60 AS VARCHAR),2) + ' sec ' GrandTotalDuration",

                            " FROM dbo.patientReviewLogs as patientReviewLogs",
                            " LEFT JOIN dbo.patients patients ON patients.id =  patientReviewLogs.patientId",
                            " LEFT JOIN dbo.AspNetUsers AspNetUsers ON AspNetUsers.Id = patients.userId",
                            " WHERE patientReviewLogs.patientId = @PatientId",
                            " AND patientReviewLogs.reviewedDate >= @StartDate and patientReviewLogs.reviewedDate <=  DATEADD(day,1,@EndDate) ",
                            // " GROUP BY patientReviewLogs.pageReviewed, AspNetUsers.LName, AspNetUsers.FName, patientReviewLogs.patientId"].join('\n');
                            " GROUP BY patientReviewLogs.id, patientReviewLogs.CreatedDate, patientReviewLogs.Note, patientReviewLogs.pageReviewed, AspNetUsers.LName, AspNetUsers.FName, patientReviewLogs.patientId, patientReviewLogs.duration"].join('\n');

            var resp;
            request.query(sqlQuery, function(err, recordset){                 
                    if (err) {
                        console.log(err,'%s', 'MsSql Error');
                        resp = {status: "401", error: err}
                    } else {
                        if(recordset.length != 0){
                            resp = {status: "200", message: recordset}  
                        } else {
                            resp = {status: "204", message: "No Data Available!"}
                        }
                    }                 
                    console.log('/api/PatientLogs called. Response = ' + JSON.stringify(recordset.length));     
                    return res.json(resp);
            }, function(err){
                    // logger.log.error('error', err);
                    console.error('error', err);
                    return res.status(500).json(err);
            });                
            
        }); //END GetPatientIdbyUserId
        
    }

    /**
     * 
     */
    function PatientLogsAll(req,res,next){
        var params = req.body;
        var patientUserId = params.PatientUserId;           

        GetPatientIdbyUserId(patientUserId,function(patientId, isNotFound, message){
            
                if ( isNotFound )
                return res.status(500).json( message);

            request.input('PatientId', conn.mssql.NVarChar(250),patientId);
            request.input('StartDate', conn.mssql.NVarChar(250),params.StartDate);
            request.input('EndDate', conn.mssql.NVarChar(250),params.EndDate); 
            var sqlQuery = ["SELECT DISTINCT ",
                            " (patientReviewLogs.pageReviewed), ",
                            " AspNetUsers.LName + ', ' +	AspNetUsers.FName as Name,",
                            " RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration)  ) / 3600 AS VARCHAR),2) + ' hr ' +",
                            " RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration)   / 60) / 60 AS VARCHAR),2) + ' min ' +",
                            " RIGHT('0' + CAST( (SUM (patientReviewLogs.duration)  ) / 60 AS VARCHAR),2) + ' sec 'totalDuration,",
                                "CONVERT(VARCHAR(10), max(patientReviewLogs.reviewedDate), 101) + ' ' ",
                                "+ LTRIM(RIGHT(CONVERT(CHAR(20), max(patientReviewLogs.reviewedDate), 22), 11)) as latestDateTimeReviewed ,",
                            
                            " patientReviewLogs.patientId, ",
                            "SUM (patientReviewLogs.duration) as Seconds,",
                            "( (RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration)  ) / 3600 AS VARCHAR),2) * 60) +",
                            "RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration)   / 60) / 60 AS VARCHAR),2) ) as totalMinutes,",
                            "CAST (( (RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration)  ) / 3600 AS VARCHAR),2) * 60) ",
                            "+ RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration) / 60) / 60 AS VARCHAR),2) ) as nvarchar(800))  ",
                            "+ '.' + RIGHT('0' + CAST( (SUM (patientReviewLogs.duration)  ) / 60 AS VARCHAR),2)  as Minutes",

                            " FROM dbo.patientReviewLogs as patientReviewLogs",
                            " LEFT JOIN dbo.patients patients ON patients.id =  patientReviewLogs.patientId",
                            " LEFT JOIN dbo.AspNetUsers AspNetUsers ON AspNetUsers.Id = patients.userId",
                            " WHERE patientReviewLogs.patientId = @PatientId",
                            " AND patientReviewLogs.reviewedDate >= @StartDate and patientReviewLogs.reviewedDate <=  DATEADD(day,1,@EndDate) ",
                            " GROUP BY patientReviewLogs.pageReviewed, AspNetUsers.LName, AspNetUsers.FName, patientReviewLogs.patientId"].join('\n');
            var resp;
            request.query(sqlQuery, function(err, recordset){
                if (err) {
                        // logger.log.error(err,'%s', 'MsSql Error');
                        console.log(err,'%s', 'MsSql Error');
                        resp = {status: "401",
                                error: err}
                    }else{
                        resp = {status: "200",
                            message: recordset}  
                    }                 
                    
                    console.log('/api/PatientLogsAll called. Response = ' + JSON.stringify(recordset.length));                    
                    return res.json(resp);
            }, function(err){
                    console.error('error', err);                    
                    return res.status(500).json(err);
            });                
            
        }); //END GetPatientIdbyUserId
        
    }    

    /************************************************************
     ** START TEST API ONLY
     *************************************************************/
    function PatientLogsTest(req,res,next){
        var params = req.body;
        var patientUserId = params.PatientUserId;           

        GetPatientIdbyUserId(patientUserId,function(patientId, isNotFound, message){
            
                if ( isNotFound )
                return res.status(500).json( message);

            request.input('PatientId', conn.mssql.NVarChar(250),patientId);
            request.input('StartDate', conn.mssql.NVarChar(250),params.StartDate);
            request.input('EndDate', conn.mssql.NVarChar(250),params.EndDate); 
            var sqlQuery = [" SELECT DISTINCT ",
                            "(patientReviewLogs.pageReviewed), patientReviewLogs.id, patientReviewLogs.Note, ",
                            " AspNetUsers.LName + ', ' +	AspNetUsers.FName as Name, ",
                            " CONVERT(VARCHAR(12), (SUM (patientReviewLogs.duration) ) /60/60/24) + ' day ' + ",
                            "   CONVERT(VARCHAR(12),(SUM (patientReviewLogs.duration)) /60/60 % 24) + ' hr ' + ",
                            "	CONVERT(VARCHAR(2),  (SUM (patientReviewLogs.duration)) /60 % 60) + ' min ' + ",
                            "	CONVERT(VARCHAR(2),  (SUM (patientReviewLogs.duration) ) % 60) + ' sec' as totalDuration, ",
                            "   CONVERT(VARCHAR(10), max(patientReviewLogs.reviewedDate), 101) + ' ' + ",
                            " LTRIM(RIGHT(CONVERT(CHAR(20), max(patientReviewLogs.reviewedDate), 22), 11)) as latestDateTimeReviewed, ",
                            " patientReviewLogs.patientId, ",
                            " SUM (patientReviewLogs.duration) as Seconds, ",
                            " CAST (( (RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration)  ) / 3600 AS VARCHAR),2) * 60) + ",
                            "	RIGHT('0' + CAST( ( SUM (patientReviewLogs.duration) / 60) % 60 AS VARCHAR),2) ) as nvarchar(800))  + '.' + ",
                            "	RIGHT('0' + CAST( (SUM (patientReviewLogs.duration)  ) % 60 AS VARCHAR),2)  as Minutes, ",
                            " SUM (patientReviewLogs.duration) OVER () as GrandTotalSeconds, ",
                            " CONVERT(VARCHAR(12), (SUM (patientReviewLogs.duration) OVER ()) /60/60/24) + ' day ' + ",
                            "	CONVERT(VARCHAR(12),(SUM (patientReviewLogs.duration) OVER ()) /60/60 % 24) + ' hr ' + ",
                            "	CONVERT(VARCHAR(2),  (SUM (patientReviewLogs.duration) OVER ()) /60 % 60) + ' min ' + ",
                            "	CONVERT(VARCHAR(2),  (SUM (patientReviewLogs.duration) OVER ()) % 60) + ' sec' as  GrandTotalDuration",

                        " FROM dbo.patientReviewLogs as patientReviewLogs ", 
                        " LEFT JOIN dbo.patients patients ON patients.id =  patientReviewLogs.patientId ",
                        " LEFT JOIN dbo.AspNetUsers AspNetUsers ON AspNetUsers.Id = patients.userId ",
                        " WHERE patientReviewLogs.patientId = @PatientId ",
                            " AND patientReviewLogs.reviewedDate >= @StartDate and patientReviewLogs.reviewedDate <=  DATEADD(day,1,@EndDate) ",
                        " GROUP BY patientReviewLogs.id, patientReviewLogs.Note, patientReviewLogs.pageReviewed, ",
                        " AspNetUsers.LName, AspNetUsers.FName, patientReviewLogs.patientId, patientReviewLogs.duration"].join('\n');
            var resp;
            request.query(sqlQuery, function(err, recordset){

                
                    if (err) {
                        // logger.log.error(err,'%s', 'MsSql Error');
                        console.log(err,'%s', 'MsSql Error');
                        resp = {status: "401",
                                error: err}
                    }else{
                        if(recordset.length != 0){
                            resp = {status: "200",
                                    message: recordset}  
                        }else{
                            resp = {status: "204",
                                    message: "No Data Available!"}
                        }                            
                    } 
                    
                    console.log('/api/PatientLogs called. Response = ' + JSON.stringify(resp));     
                    return res.json(resp); 
            }, function(err){
                    console.error('error', err);
                    return res.status(500).json(err);
            });                
            
        }); //END GetPatientIdbyUserId
        
    }    
    
    /************************************************************
     ** END TEST API ONLY
     *************************************************************/
    function CheckUserRole(req,res,next){
        var params = req.body;
        request.input('userId', conn.mssql.NVarChar(250),params.UserId);
        var sqlQuery = ["SELECT AspNetUserRoles.UserId, AspNetRoles.Name,  AspNetRoles.Description",
                            "FROM AspNetUserRoles",
                            "LEFT JOIN AspNetRoles ON AspNetRoles.Id = AspNetUserRoles.RoleId",
                        "WHERE AspNetUserRoles.UserId = @userId"].join('\n');

        var resp;
        request.query(sqlQuery, function(err, recordset){
            if (err) {
                    // logger.log.error(err,'%s', 'MsSql Error');
                    console.log(err,'%s', 'MsSql Error');
                    resp = {status: "401",
                            error: err}
                }else{
                    resp = {status: "200",
                        message: recordset}  
                }                 
                
                console.log('/api/CheckUserRole called. Response = ' + JSON.stringify(resp));
                return res.json(resp);  
        }, function(err){
                console.error('error', err);
                return res.status(500).json(err);
        });
    }    

    /************************************************************
     *  Get Patient Not Reviewed
     *************************************************************/
    function GetPatientNotReviewed(req,res,next){
        var params = req.body;
        var userId = params.PhysicianUserId;
        
        request.input('userId', conn.mssql.NVarChar(250),userId);
        // var sqlQuery = ["SELECT patients.userId as userId, AspNetUsers.Email as email, AspNetUsers.FName as fName, AspNetUsers.MName as mName, AspNetUsers.LName as lName, ",
        //                     "AspNetUsers.Address1 as address1, AspNetUsers.Address2 as address2, AspNetUsers.City as city, AspNetUsers.Country as country,",
        //                     "AspNetUsers.PostalCode as postalCode, AspNetUsers.State as state, AspNetUsers.Phone1 as phone1, AspNetUsers.Phone2 as phone2 ,",
        //                     "patients.DOB as dob, patients.gender as gender, patients.race as race ,'true' as bRequireAttention,'true' as bUnderControl,'true' as bMonitored",
        //                 "FROM patientReviewLogs",
        //                     "LEFT JOIN patients on patients.id = patientReviewLogs.patientId",
        //                     "LEFT JOIN AspNetUsers on AspNetUsers.Id = patients.userId",
        //                 "WHERE DATEDIFF( day,patientReviewLogs.reviewedDate, GETDATE() ) >= 20",
        //                 "AND patientReviewLogs.physicianId = @PhysicianId",
        //                 "GROUP BY patients.userId, AspNetUsers.Email, AspNetUsers.FName, AspNetUsers.MName, AspNetUsers.LName,",
        //                     "AspNetUsers.Address1, AspNetUsers.Address2, AspNetUsers.City, AspNetUsers.Country, AspNetUsers.PostalCode,",
        //                     "AspNetUsers.State, AspNetUsers.Phone1, AspNetUsers.Phone2,  patients.DOB, patients.gender, patients.race "].join('\n');

        var sqlQuery = [    "SELECT DISTINCT patients.userId as userId, AspNetUsers.Email as email, AspNetUsers.FName as fName, AspNetUsers.MName as mName, AspNetUsers.LName as lName, ",
                    "AspNetUsers.Address1 as address1, AspNetUsers.Address2 as address2, AspNetUsers.City as city, AspNetUsers.Country as country,",
                    "AspNetUsers.PostalCode as postalCode, AspNetUsers.State as state, AspNetUsers.Phone1 as phone1, AspNetUsers.Phone2 as phone2 ,",
                    "patients.DOB as dob, patients.gender as gender, patients.race as race ,'true' as bRequireAttention,'true' as bUnderControl,'true' as bMonitored",
                "FROM patientReviewLogs",
                    "LEFT JOIN patients on patients.id = patientReviewLogs.patientId",
                    "LEFT JOIN physicians ON physicians.id = patientReviewLogs.physicianId",
                    "INNER JOIN researchAssistantphysicians ON researchAssistantphysicians.physician_id = physicians.id",
                    "INNER JOIN researchAssistants ON researchAssistants.id = researchAssistantphysicians.researchAssistant_id",                                
                    "LEFT JOIN AspNetUsers on AspNetUsers.Id = patients.userId",
                "WHERE DATEDIFF( day,patientReviewLogs.reviewedDate, GETDATE() ) >= 20",
                "AND ( physicians.userId = @userId OR researchAssistants.userId = @userId ) ",
                "GROUP BY patients.userId, AspNetUsers.Email, AspNetUsers.FName, AspNetUsers.MName, AspNetUsers.LName,",
                    "AspNetUsers.Address1, AspNetUsers.Address2, AspNetUsers.City, AspNetUsers.Country, AspNetUsers.PostalCode,",
                    "AspNetUsers.State, AspNetUsers.Phone1, AspNetUsers.Phone2,  patients.DOB, patients.gender, patients.race "].join('\n');                

        var resp;
        request.query(sqlQuery, function(err, recordset){

                if (err) {
                    // logger.log.error(err,'%s', 'MsSql Error');
                    console.log(err,'%s', 'MsSql Error');
                    resp = {status: "401",
                    error: err
                    }
                } else {
                    if(recordset.length > 0){
                        resp = {status: "200",
                        message: "Records : " + recordset.length}  
                    } else {
                        resp = {status: "204",
                        message: "No Data Available!"}  
                    }                       
                }

            console.log('/api/GetPatientNotReviewed called. Response = ' + JSON.stringify(resp));
            return res.json(resp);
        }, function(err){
            console.error('error', err);
            return res.status(500).json(err);
        });
    }    

    /****************************************************************
     *  A temporary API that is currently used 
     *  as a workaround due to issue of saving using patient ids in Int
     *  value, i think either the APIs from MHP gives int ids or 
     *  adjust the inhouse apis to accept ids in string form 
     ***************************************************************/
    function getPatientIntId(req,res,next){
        var params = req.body;

        if ( !params.patientUserId )
            return res.status(500).json( "patientUserId field is required");

        request.input('patientUserId', conn.mssql.NVarChar(250), params.patientUserId);
                 
        var sqlQuery = 'SELECT patients.id AS patientId';
            sqlQuery += '   FROM patients ';
            sqlQuery += 'WHERE patients.userId = @patientUserId';

        request.query(sqlQuery, function(err, recordset){
            if (err) {
                console.log(err,'%s', 'MsSql Error');
                return res.status(500).json(err);
            } else if (recordset.length <= 0){
                return res.json(400, "no patient with id " + params.patientUserId + " found");
            } else {
                return res.json({ status: "200", message: recordset[0].patientId });                     
            }
        }, function(err){
                console.error('error', err);
                return res.status(500).json(err);
        });
    }

    /************************************************************
     *  GET LOG DETAILS BY LOG ID
     *************************************************************/
    function getLogDetailsById(req,res,next){
        var params = req.body;

        if ( !params.LogId )
            return res.status(500).json( "LogId field is required");

        request.input('LogId', conn.mssql.NVarChar(250), params.LogId);            
    
        var sqlQuery = 'SELECT * ';
            sqlQuery += '   FROM patientReviewLogs ';
            sqlQuery += 'WHERE patientReviewLogs.id = @LogId';

        request.query(sqlQuery, function(err, recordset){
            if (err) {
                // logger.log.error(err,'%s', 'MsSql Error');
                console.log(err,'%s', 'MsSql Error');
                return res.status(500).json(err);
            } else if (recordset.length <= 0){
                return res.json(400, "no LOG with id " + params.LogId + " found");
            } else {
                return res.json({ status: "200", message: recordset });                     
            }
        }, function(err){
            console.error('error', err);
            return res.status(500).json(err);
        });
    }    

    /************************************************************
     *  UPDATE LOG TIME API
     *************************************************************/
    function UpdateLogTime(req,res,next){

        var params = req.body;
                    
        var duration = con.duration;
        var mhpUrl = con.mhpURL;

        var pageReviewed = params.PageReviewed.trim();
        var userId = params.UserId; //PhysicianUserId
        var note = params.Note;
        var logId = params.LogId; // Time Log Id
        var patientUserId = params.PatientUserId;// PatientUserId
        var patientId = params.patientId;
        
        var manualReviewedDate;

        //optionals
        if ( params.Duration > 0 )
            duration = params.Duration;
        if ( new Date(params.ReviewedDate) != 'Invalid Date' )
            manualReviewedDate = new Date(params.ReviewedDate);

        request.input('PageReviewed', conn.mssql.NVarChar(250), pageReviewed);
        request.input('Duration', conn.mssql.Int, duration); // in Seconds
        request.input('LogId', conn.mssql.Int, logId); 
        request.input('LastModifiedById', conn.mssql.NVarChar(250), userId);
        request.input('Note', conn.mssql.NVarChar(512), note);

        if ( manualReviewedDate )
            request.input('manualReviewedDate', conn.mssql.DateTime2, manualReviewedDate);
        
        var sqlQuery = '';                        

            sqlQuery += 'UPDATE dbo.patientReviewLogs '; 
            sqlQuery += 'SET '; 
            sqlQuery += '   duration = @Duration,'; 
            sqlQuery += '   lastModifiedDate = GETDATE(),'; 
            sqlQuery += '   lastModifiedById = @LastModifiedById,'; 
            sqlQuery += '   pageReviewed = @PageReviewed,'; 
            sqlQuery += '   reviewedDate = @manualReviewedDate,'; 
            sqlQuery += '   Note = @Note '; 
            sqlQuery += 'WHERE id = @LogId ';
        

        var resp ;
        request.query(sqlQuery).then(function(err, rows) {
                if (err) {
                    console.log(err,'%s', 'MsSql Error');
                    resp = {status: "401", error: err }
                } else {
                    console.log("Affected Rows :" + request.rowsAffected);
                    resp = {status: "200", message: "Affected Rows :" + request.rowsAffected}
                }
                console.log('/api/UpdateLogTime called. Response = ' + JSON.stringify(resp));
                return res.json(resp);
            }, function(err){
                console.error('error', err);
                return res.status(500).json(err);
            });

    }  


    /************************************************************
     *  DELETE LOG TIME API
     *************************************************************/
    function DeleteTimeLog(req,res,next){
        var params = req.body;

        request.input('LogId', conn.mssql.Int, params.LogId ); 
                    
        var sqlQuery = "DELETE FROM patientReviewLogs where patientReviewLogs.id = @LogId";
        var resp ;
        request.query(sqlQuery).then(function(err, rows) {
                if (err) {
                    console.log(err,'%s', 'MsSql Error');
                    resp = {status: "401", error: err }
                } else {
                    resp = {status: "200", message: "Affected Rows :" + request.rowsAffected }
                }
                console.log('/api/DeleteTimeLog called. Response = ' + JSON.stringify(resp));
                return res.json(resp);           
            }, function(err){
                console.error('error', err);
                res.status(500).json(err);
            });     
    }  


    /************************************************************
     *  LOG TIME API
     *************************************************************/
    function newAPILogTime(req,res,next){
        var params          = req.body;
        var duration        = con.duration;
        var mhpUrl          = con.mhpURL;
        var pageReviewed    = params.PageReviewed.trim();
        var status          = params.Status;
        var userId          = params.UserId.trim();
        var note            = params.Note;
        var view            = params.View;
        
        var manualReviewedDate;

        //optionals
        if ( params.Duration > 0 )
            duration = params.Duration;
        if ( new Date(params.ReviewedDate) != 'Invalid Date' )
            manualReviewedDate = new Date(params.ReviewedDate);

        var patientUserId = params.PatientUserId;// patientuserid
                    
        GetPatientIdbyUserId(patientUserId,function(patientId, isNotFound, message){
         
            if ( isNotFound )
                return res.status(500).json( message);
            
            GetDoctorId(userId, function(doctorId, isNotFound, message) {

                if ( doctorId==null )
                    return res.status(500).json( message);

            GetLatestLog(patientId,doctorId,userId,pageReviewed,duration, manualReviewedDate, note, function(doesExist, id, newDuration){

                // logger.log.info('*****STEP 4 return latest log = ' + doesExist +' | '+ id  +' | '+ newDuration);
                // console.log('*****STEP 4 return latest log = ' + doesExist +' | '+ id  +' | '+ newDuration);

                request.input('PhysicianId', conn.mssql.Int,doctorId);
                request.input('PatientId', conn.mssql.Int,patientId);
                request.input('PageReviewed', conn.mssql.NVarChar(250),pageReviewed);
                request.input('Duration', conn.mssql.Int,newDuration);
                request.input('Status', conn.mssql.Int,status);
                request.input('Id', conn.mssql.Int,id); 
                request.input('CreatedById', conn.mssql.NVarChar(250),userId);
                request.input('LastModifiedById', conn.mssql.NVarChar(250),userId);
                request.input('Note', conn.mssql.NVarChar(512), note);

                if ( manualReviewedDate )
                    request.input('manualReviewedDate', conn.mssql.DateTime2, manualReviewedDate);
                
                var sqlQuery = '';           

                if(doesExist) {
                    sqlQuery += 'UPDATE dbo.patientReviewLogs '; 
                    sqlQuery += 'SET '; 
                    sqlQuery += '   duration = @Duration,'; 
                    sqlQuery += '   lastModifiedDate = GETDATE(),'; 
                    sqlQuery += '   lastModifiedById = @LastModifiedById,'; 

                    if ( manualReviewedDate )
                        sqlQuery += '   reviewedDate = @manualReviewedDate,'; 
                    else
                        sqlQuery += '   reviewedDate = GETDATE(),'; 

                    sqlQuery += '   Note = @Note '; 

                    sqlQuery += 'WHERE id = @Id ';
                } else {
                    sqlQuery += 'INSERT INTO dbo.patientReviewLogs ';
                    sqlQuery += '  (';
                    sqlQuery += '       physicianId, ';
                    sqlQuery += '       patientId, ';
                    sqlQuery += '       pageReviewed, ';
                    sqlQuery += '       duration, ';
                    sqlQuery += '       status, ';
                    sqlQuery += '       createdDate, ';
                    sqlQuery += '       createdById, ';
                    sqlQuery += '       lastModifiedDate, ';
                    sqlQuery += '       lastModifiedById, ';                    
                    sqlQuery += '       reviewedDate, ';                                                           
                    sqlQuery += '       Note ';         
                    sqlQuery += '   ) ';
                    sqlQuery += ' VALUES ';
                    sqlQuery += '   (';
                    sqlQuery += '       @PhysicianId, ';
                    sqlQuery += '       @PatientId, ';
                    sqlQuery += '       @PageReviewed,';    
                    sqlQuery += '       @Duration, ';
                    sqlQuery += '       @Status, ';
                    sqlQuery += '       GETDATE(), ';                        
                    sqlQuery += '       @CreatedById, ';              
                    sqlQuery += '       GETDATE(), ';              
                    sqlQuery += '       @LastModifiedById, ';        

                    if ( manualReviewedDate )
                        sqlQuery += '   @manualReviewedDate,'; 
                    else
                        sqlQuery += '   GETDATE(),';                         

                    sqlQuery += '       @Note';                                             
                    sqlQuery += '   )';
                    sqlQuery += '';                                                    
                }

                var resp ;
                    var dateStamp = new Date();

                    dateStamp = moment(dateStamp).format('LTS');

                request.query(sqlQuery).then(function(err, rows) {

                        if (err) {
                            console.log(err,'%s', 'MsSql Error');
                            resp = {status: "401", error: err }
                        } else {
                            resp = {status: "200", message: "Affected Rows :" + request.rowsAffected}
                        }

                        console.log( view +' : '+dateStamp +' : /api/LogTime called. Response = ' + JSON.stringify(resp));
                        return res.json(resp);

                    }, function(err){
                        console.error('error', err);
                        return res.status(500).json(err);
                    });
                }); //END GetLatestLog                    
            }); //END GetDoctorId       
        }); // END GetPatientIdbyUserId        
    }        


    /************************************************************
     *  SEND NOTIFICATION FOR PUSH API
     *************************************************************/
    function GetNotificationPushDetails(req,res,next){
        var params = req.body;

        request.input('NotificationBaseId', conn.mssql.Int, params.notificationBaseId ); 
                    
        var sqlQuery =  [" SELECT ",
                        " NOTIF.notificationBaseId, NOTIF.id, CONVERT(VARCHAR(16),NOTIF.EventDate) as EventDate, ",
                        " CONVERT(VARCHAR(16),DATEADD(hh, -8, NOTIF.EventDate)) as UtcEventDate, NOTIF.deliverydDate, ",
                        " NOTIFBASE.description ,NOTIFBASE.patientId,PATIENTS.userId,USERDEVICES.DeviceToken ",
                        " FROM dbo.notifications as NOTIF ",
                        " INNER JOIN dbo.notificationBases NOTIFBASE ON NOTIFBASE.id = NOTIF.notificationBaseId ",
                        " INNER JOIN dbo.patients PATIENTS ON PATIENTS.id = NOTIFBASE.patientId ",
                        " INNER JOIN dbo.userDevices USERDEVICES ON USERDEVICES.userId = PATIENTS.userId ",
                        " WHERE NOTIF.notificationBaseId = @NotificationBaseId ",
                        " AND USERDEVICES.status = '0' AND USERDEVICES.DeviceToken != ''  ",
                        " GROUP BY USERDEVICES.DeviceToken,NOTIF.notificationBaseId, ",
                        " NOTIF.id,NOTIF.EventDate,NOTIF.deliverydDate, ",
                        " NOTIFBASE.description ,NOTIFBASE.patientId,PATIENTS.userId"].join('\n');
        var resp ;
              
        request.query(sqlQuery, function(err, recordset){
                if (err) {
                    console.log(err,'%s', 'MsSql Error');
                    resp = {status: "401", error: err}
                } else {
                    if(recordset.length != 0){

                        var notificationBaseId = params.notificationBaseId;
                        var notifMessage = [];
                        
                        var ctr = 0;
                        for (var item in recordset ){
                        //***** DO the sns sending here
                    
                            var app = require('../includes/_sns.js');
                            app.sendQuickNotifications(recordset[item].DeviceToken,recordset[item].userId,recordset[item].id,recordset[item].description,recordset[item].notificationBaseId,
                            (function ( success, statusMessage) {
                                ctr++;        
                                notifMessage.push({ isSuccess : success, snstatusmessage : statusMessage })

                                if (!success) {
                                    console.log(statusMessage,'%s', 'Error sending message');
                                    
                                }else{
                                    request.input('itemId', conn.mssql.NVarChar(50), recordset[item].id);
                                    var __eventDate , __deliverydDate;

                                    if ( ( new Date(params.deliverydDate) != 'Invalid Date' ) && ( new Date(params.eventDate) != 'Invalid Date' )){
                                         __deliverydDate= new Date(params.deliverydDate);
                                         __eventDate  = new Date(params.eventDate);
                                    }else{
                                         __deliverydDate=  params.deliverydDate;
                                         __eventDate  =  params.eventDate;
                                    }
                                        

                                    request.input('deliverydDate', conn.mssql.DateTime2, __deliverydDate); 
                                    request.input('eventDate', conn.mssql.DateTime2, __eventDate ); 
                                    
                                    var sqlUpdate ="UPDATE notifications SET deliverydDate = @deliverydDate, eventDate = @eventDate where id = @itemId";
                                    request.query(sqlUpdate).then(function(err, rows) {
                                        if (err) {
                                            console.log(err,'%s', 'Error updating deliveryDate');
                                            
                                        }else{ 
                                            console.log("Affected Rows :" + request.rowsAffected + ' - ' + statusMessage); 
                                            
                                        }
                                    });
                                }
                                
                                if(ctr >= recordset.length){
                                    resp = {status: "200", message: notifMessage}  
                                    return res.json(resp);                                
                                }
                            }));
                        }
                        // resp = {status: "200", message: "Notifications Count : " +  recordset.length}  
                    } else {
                        resp = {status: "204", message: "No Data Available!"}
                        return res.json(resp);
                    }
                }                 
                console.log('/api/GetNotificationPushDetails called. Response = ' + JSON.stringify(recordset.length));   

        }, function(err){
                console.error('error', err);
                return res.status(500).json(err);
        }); 
    }


    /************************************************************
     *  START DB Queries
     *************************************************************/

    function GetDoctorId(userId, callback){
        var doctorId;
        var isDoctor = false;
        var isNotFound = false;
        var message = "";

        request.input('userId', conn.mssql.NVarChar(250),userId);            
        var sqlQuery = ["SELECT TOP 1 physicians.id, physicians.prescribing_physician_name, physicians.secondary_specialty , researchAssistantphysicians.researchAssistant_id ",
                        "FROM physicians",
                        "LEFT JOIN researchAssistantphysicians ON researchAssistantphysicians.physician_id = physicians.id",
                        "LEFT JOIN researchAssistants ON  researchAssistants.id = researchAssistantphysicians.researchAssistant_id",
                        "WHERE (physicians.userId = @userId OR researchAssistants.userId = @userId)"].join('\n');        
        
            request.query(sqlQuery, function(err, recordset) {
                if (err) {
                    console.error(err,'%s', 'MsSql Error');
                    return callback(err);
                } else {
                    if(recordset.length > 0){
                        for (var item in recordset){                                
                            if (recordset[item].id){
                                doctorId = recordset[item].id;   
                                return callback(doctorId, isNotFound, message );                                            
                            }
                        }
                    }
                    else{
                        message = { "userId":userId, "message":'GetDoctorId : User not found!' }; 

                        isNotFound = true;
                        return callback(doctorId, isNotFound, message );                  
                    }                           
                }
            }, function(err){
                console.error('GetDoctorId error', err);
                return callback(err);
            });            
    }

    /****************************
     * Get latest log
     ****************************/
    function GetLatestLog(patientId, doctorId, userId , pageReviewed, duration, manualReviewedDate, note, callback){
        request.input('PatientId', conn.mssql.NVarChar(250), patientId); 
        request.input('DoctorId', conn.mssql.NVarChar(250), doctorId);
        request.input('userId', conn.mssql.NVarChar(250), userId);
        request.input('PageReviewed', conn.mssql.NVarChar(250), pageReviewed);
        request.input('Duration', conn.mssql.Int(10), duration);

        var sqlQuery = "";

            sqlQuery += "SELECT TOP 1";

            if ( manualReviewedDate ) {
                sqlQuery += "   1 AS logAction ,";
            } else {
                sqlQuery += "   IIF(convert(varchar(10), reviewedDate, 120)  = convert(varchar(10), GETDATE(), 120), 1, 0) AS logAction ,";
            }
                
            sqlQuery += "   DATEDIFF (SECOND,  reviewedDate, GETDATE()   ) as timeDiff, ";
            sqlQuery += "   id, duration,pageReviewed , reviewedDate, ";
            sqlQuery += "   GETDATE() as currentDateTime, ";
            sqlQuery += "   RIGHT('0' + CAST(  DATEDIFF (SECOND,  reviewedDate, GETDATE()  ) / 3600 AS VARCHAR),2) + ' hr ' + ";
            sqlQuery += "   RIGHT('0' + CAST(  DATEDIFF (SECOND,  reviewedDate, GETDATE()   ) / 60 % 60 AS VARCHAR),2) + ' min ' +";
            sqlQuery += "   RIGHT('0' + CAST(  DATEDIFF (SECOND,  reviewedDate, GETDATE()  )  % 60 AS VARCHAR),2) + ' sec ' as durationFormat ";
            sqlQuery += "FROM patientReviewLogs ";
            sqlQuery += "   WHERE ";
            sqlQuery += "       patientId = @PatientId ";
            sqlQuery += "       AND physicianId = @DoctorId ";                
            sqlQuery += "       AND createdById = @userId ";
            sqlQuery += "       AND pageReviewed = @PageReviewed ";

            if ( manualReviewedDate ) {
                request.input('manualReviewedDay', conn.mssql.NVarChar(250), moment(manualReviewedDate).format('YYYY-MM-DD'));
                request.input('Note', conn.mssql.NVarChar(512), note);

                sqlQuery += " AND DATEDIFF(day, reviewedDate, @manualReviewedDay) = 0 ";
                sqlQuery += " AND Note = @Note";

            }

            sqlQuery += "   ORDER BY reviewedDate DESC";

        request.query(sqlQuery, function(err, recordset) {
            if(err){
                console.error(err,'%s', 'MsSql Error');
                return callback(err);
            } else {
                    // doesExist -- true:'UPDATE', false:'INSERT'
                var doesExist = false , id, newDuration;
                if(recordset.length != 0){
                    for (var item in recordset){
                        if(recordset[item].logAction){
                            //UPDATE the retrieved record using id
                            doesExist = true;
                            id = recordset[item].id;   
                            var _duration_int = Math.abs(recordset[item].duration);           

                            if ( manualReviewedDate ){
                                newDuration = (_duration_int + Math.abs(duration));
                            } else if ( duration > 0 ) {
                                newDuration = (_duration_int + Math.abs(duration));
                            }  else {
                                newDuration = (_duration_int + con.duration)                                     
                            }
                        } else{
                            newDuration = duration;
                        }
                        return callback(doesExist, id, newDuration);
                    }
                } else {
                    newDuration = duration;
                    return callback(doesExist, id, newDuration);
                }
            }
        });
    }        

    /****************************
     * Get latest log Old
     ****************************/
    function GetLatestLogOld(patientId, doctorId, userId , pageReviewed, duration, callback){
        request.input('PatientId', conn.mssql.NVarChar(250), patientId); 
        request.input('DoctorId', conn.mssql.NVarChar(250), doctorId);
        request.input('userId', conn.mssql.NVarChar(250), userId);
        request.input('PageReviewed', conn.mssql.NVarChar(250), pageReviewed);
        request.input('Duration', conn.mssql.Int(10), duration);

        var sqlQuery = ["SELECT TOP 1",
                            "IIF(convert(varchar(10), reviewedDate, 120)  = convert(varchar(10), GETDATE(), 120), 1, 0) AS logAction ,",
                            "IIF(DATEDIFF (SECOND, reviewedDate, GETDATE()  )  > @Duration , 1, 0) AS isGreaterDuration ,	",
                            "DATEDIFF (SECOND,  reviewedDate, GETDATE()   ) as timeDiff,",
                            "id, duration,pageReviewed , reviewedDate,",
                            "GETDATE() as currentDateTime,",
                            "RIGHT('0' + CAST(  DATEDIFF (SECOND,  reviewedDate, GETDATE()  ) / 3600 AS VARCHAR),2) + ' hr ' +",
                            "RIGHT('0' + CAST(  DATEDIFF (SECOND,  reviewedDate, GETDATE()   ) / 60 % 60 AS VARCHAR),2) + ' min ' +",
                            "RIGHT('0' + CAST(  DATEDIFF (SECOND,  reviewedDate, GETDATE()  )  % 60 AS VARCHAR),2) + ' sec ' as durationFormat",
                        "FROM patientReviewLogs",
                            "WHERE patientId = @PatientId",
                            "AND physicianId = @DoctorId",
                            "AND createdById = @userId",
                            "AND pageReviewed = @PageReviewed",
                            "ORDER BY reviewedDate DESC"].join('\n');          

        request.query(sqlQuery, function(err, recordset) {
            if(err){
                console.error(err,'%s', 'MsSql Error');
                return callback(err);
            }else{
                    // doesExist -- true:'UPDATE', false:'INSERT'
                var doesExist = false , id, newDuration;
                if(recordset.length != 0){
                    for (var item in recordset){
                        if(recordset[item].logAction){
                            //UPDATE the retrieved record using id
                            doesExist = true;
                            id = recordset[item].id;                                   
                            if(recordset[item].isGreaterDuration){
                                newDuration = +recordset[item].duration + +30; //TODO remove hard coded value, put to a config
                            } else {
                                newDuration = +recordset[item].duration + +recordset[item].timeDiff;
                            }
                            
                        } else {
                            newDuration = duration;
                        }
                        return callback(doesExist, id, newDuration);
                    }
                } else {
                    newDuration = duration;
                    return callback(doesExist, id, newDuration);
                }
            }
        });
    }

    function GetPatientIdbyUserId(patientUserId,callback){
        var patientId;
        var isNotFound = false;
        var message = "";
        request.input('userId', conn.mssql.NVarChar(250), patientUserId);
        var sqlQuery = "SELECT TOP 1 id,userId from dbo.patients WHERE userId =  @userId";
        request.query(sqlQuery, function(err, recordset) {
            if (err) {
                console.error(err,'%s', 'MsSql Error');
                return callback(err);
            } else {
                if(recordset.length > 0){
                    for (var item in recordset){
                        if (recordset[item].id){
                            patientId = recordset[item].id;
                            return callback(patientId, isNotFound, message );                                          
                        }
                    }
                } else {
                    message = { "userId":patientUserId, "message":'GetPatientIdbyUserId : User not found!' }; 
                    isNotFound = true;
                    return callback(patientId, isNotFound, message );                  
                }
                
            }
        }, function(err){
                console.error('error', err);
                return callback(err)
        });
    }

    /**
     * GET all of patients total logs based on doctors ID
     * 
     * Request Params   
     *  - physician_user_id (string | required) 
     *  - month (integer | optional ) : 1 - 12 ( 1 = January ~ 12 = December )
     *  - year (integer | optional ) : 1xxx ~ 2xxx
     * 
     * NOTE :
     *  if no 'month' or 'year' sent, it will give all total logs from start to end
     *  if invalid 'year', it will not use sent year, year will be whole
     *  if invalid 'month', it will not use sent month, if year is sent then it will return all logs within the year
     */
    function getPatientsTotalLogsByDoctor(req,res,next){
        var params = req.body;
        var _service_promise = logs_service
                                .getPatientsTotalLogsByDoctor(conn, request, params.physician_user_id, params.month,params.year);
        return route_util.handleServicePromise(_service_promise, req, res, next);
    }



//  END API Calls
    
}

exports.goToApi = goToApi;