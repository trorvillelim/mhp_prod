exports.route = function(base, server){

    server.get(base + '/test', testSample);
    server.get(base + '/test2', test2Sample);
    server.post(base + '/test2', testPostSample);

    return;

    //////

    /**
     * Documentation HERE
     */
    function testSample(req, res, next){
        return res.json('test!');
    };

    /**
     * Documentation HERE
     */
    function test2Sample(req, res, next){
        return res.json('test2!');
    };    

    /**
     * Documentation HERE
     */
    function testPostSample(req, res, next){
        return res.json('test2 post!');
    };       

}