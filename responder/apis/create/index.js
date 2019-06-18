var _ = require('underscore');

var responder = require('../../modules/responder.js').responder;
var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;

module.exports = function(args,finished) {
    console.log("RESPONDER CREATE: " + JSON.stringify(args,null,2));

    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("responder");

    try
    {
        //if request is an error, return operation outcome and http error status, else return data as is...
        //Todo: validate contents of request...
        if(request.data.error) 
        {
            //Convert data to an operation outcome...
            finished(responder.createErrorResponse(request.data.error));
        } else {
            finished(request.data);
        }
    }
    catch(ex)
    {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }
}