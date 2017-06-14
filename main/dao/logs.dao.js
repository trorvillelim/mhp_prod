exports.getPatientsTotalLogsByDoctor = getPatientsTotalLogsByDoctor;

return;

/////////

/*****
 * Get Patients total logs
 *  - per month
 */
function getPatientsTotalLogsByDoctor(_connection, _connection_request, physician_user_id, month, year){
    console.log('hey!');
    console.log(month);
    if (month)
        _connection_request.input('PARAM_MONTH', _connection.mssql.Int, month);
    if ( year > 0)
        _connection_request.input('PARAM_YEAR', _connection.mssql.Int, year);

    _connection_request.input('PARAM_PHYSICIAN_USER_ID', _connection.mssql.NVarChar(250), physician_user_id);

    var sql = '';
        sql += ' SELECT DISTINCT ';
        sql += '   Z.patient_id, ';
        sql += '   Z.patient_lastname , ';
        sql += '   Z.patient_firstname, ';
        //sql += '   Z.ReviewedDate, ';
        sql += '   SUM(Z.total_duration_count) total_duration_count ';

        sql += ' FROM (' ;

                sql += ' (SELECT DISTINCT ';
                sql += '   user_patient.id patient_id, ';
                sql += '   user_patient.LName patient_lastname, ';
                sql += '   user_patient.FName patient_firstname, ';
             //   sql += '   patient_review_logs.ReviewedDate ReviewedDate, ';

                sql += '   SUM(patient_review_logs.duration) total_duration_count ';

                sql += 'FROM dbo.patientReviewLogs as patient_review_logs   ';

                sql += '   INNER JOIN physicians ON patient_review_logs.physicianId = physicians.id    ';
                sql += '   INNER JOIN patients ON patient_review_logs.patientId = patients.id  ';
                sql += '   LEFT JOIN AspNetUsers as user_patient ON patients.userId = user_patient.id ';

                sql += 'WHERE   ';
                sql += '   physicians.userId = @PARAM_PHYSICIAN_USER_ID '

                if ( month )
                    sql += '   AND MONTH(patient_review_logs.ReviewedDate) = @PARAM_MONTH ';

                if ( year > 0 )
                    sql += '   AND YEAR(patient_review_logs.ReviewedDate) = @PARAM_YEAR  ';

                sql += 'GROUP BY  ';
                sql += ' user_patient.id, user_patient.LName, user_patient.FName )'; // end of first group

                sql += ' UNION ';

                sql += '(SELECT DISTINCT ';
                sql += '   user_patient.id patient_id, ';
                sql += '   user_patient.LName patient_lastname, ';
                sql += '   user_patient.FName patient_firstname, ';
                sql += '   NULL as total_duration_count ';

                sql += 'FROM dbo.patientReviewLogs as patient_review_logs   ';

                sql += '   INNER JOIN physicians ON patient_review_logs.physicianId = physicians.id    ';
                sql += '   INNER JOIN patients ON patient_review_logs.patientId = patients.id  ';
                sql += '   LEFT JOIN AspNetUsers as user_patient ON patients.userId = user_patient.id ';

                sql += 'WHERE   ';
                sql += '   physicians.userId = @PARAM_PHYSICIAN_USER_ID ';

                // if ( month )
                //     sql += '   AND MONTH(patient_review_logs.ReviewedDate) != @PARAM_MONTH ';

                // if ( year > 0 )
                //     sql += '   AND YEAR(patient_review_logs.ReviewedDate) = @PARAM_YEAR  ';

                sql += 'GROUP BY  ';
                sql += ' user_patient.id, user_patient.LName, user_patient.FName)  ' ;  // end of 2nd group


    sql += ')';

    sql += 'as Z';
    sql += ' GROUP BY ';
    sql += ' Z.patient_id, Z.patient_lastname, Z.patient_firstname ';


    ///// ************************************** //////////////

    // var sql = '';
    // sql += 'SELECT DISTINCT ';
    // sql += '   user_patient.id patient_id, ';
    // sql += '   user_patient.LName patient_lastname, ';
    // sql += '   user_patient.FName patient_firstname, ';
    // sql += '   patient_review_logs.ReviewedDate ReviewedDate, ';
    // sql += '   SUM(patient_review_logs.duration) total_duration_count ';
    //
    // sql += 'FROM dbo.patientReviewLogs as patient_review_logs   ';
    //
    // sql += '   INNER JOIN physicians ON patient_review_logs.physicianId = physicians.id    ';
    // sql += '   INNER JOIN patients ON patient_review_logs.patientId = patients.id  ';
    // sql += '   LEFT JOIN AspNetUsers as user_patient ON patients.userId = user_patient.id ';
    //
    // sql += 'WHERE   ';
    // sql += '   physicians.userId = @PARAM_PHYSICIAN_USER_ID ';
    //
    // // if ( month )
    // //     sql += '   AND MONTH(patient_review_logs.ReviewedDate) = @PARAM_MONTH ';
    //
    // if ( year > 0 )
    //     sql += '   AND YEAR(patient_review_logs.ReviewedDate) = @PARAM_YEAR  ';
    //
    // sql += 'GROUP BY  ';
    // sql += '   user_patient.id, user_patient.LName, user_patient.FName, patient_review_logs.ReviewedDate  ';
    // sql += 'ORDER BY  case when patient_review_logs.ReviewedDate = @PARAM_MONTH  then @PARAM_MONTH else 2 end;';
    //
    //      console.log(sql);

    return _connection_request.query(sql);

}