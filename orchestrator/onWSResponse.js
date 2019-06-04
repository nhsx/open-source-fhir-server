var responders = require('./modules/responders.js').responders;

module.exports = function(req, res, next) {
    var msg = res.locals.message || {error: 'Internal server error'};

    var code, status;
    if (msg.httpStatusError) {
        code = 500;
        status = msg.httpStatusError.status;
        if(status && status.code) code = status.code;
        if(msg.operationOutcome !== undefined)
        {
            msg = msg.operationOutcome;
        } 
        else 
        {
            delete msg.status;
            delete msg.restMessage;
            delete msg.ewd_application;
            delete msg.path;
        }
        res.set('Content-Length', msg.length);
        res.status(code).send(msg);
    } else {
        if(msg.token) delete msg.token;
        //Send Response...
        var responseHandlers = responders["fhir"];
        var responseHandler = responseHandlers[req.method.toLowerCase()];
        responseHandler(msg,req,res);
    }
    next();
  };