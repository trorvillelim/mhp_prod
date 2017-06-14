function CallWebService(authToken, data){
    //@params url : String
    //@params data : JSON String
    //@params authToken : String

    var req = new XMLHttpRequest();    
    var response ;
    // var url = "http://localhost:9000/api/LogTime"; 
    var url = "http://nodejs-web-services-elb-1558580578.us-east-1.elb.amazonaws.com/api/LogTime"; 
    

    req.open("POST", url, true);
    req.setRequestHeader('Access-Control-Allow-Origin', '*');
    req.setRequestHeader('Content-type', 'application/json');
    req.setRequestHeader('Authorization', authToken);
    req.onload = function () {
        // do something to response
        response = this.responseText; 
        console.log("RESPONSE: " + response);  
    };             
    req.send(data);
    return response;
    
}