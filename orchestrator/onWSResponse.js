var responders = require('./modules/responders.js').responders;

module.exports = function(req, res, next) {
    var msg = res.locals.message || {error: 'Internal server error'};
    var code, status;
    if (msg.httpStatusError || (msg.data && msg.data.error)) {
        code = 500;
        status = (msg.httpStatusError && msg.httpStatusError.status) || (msg.data && msg.data.error.status);
        if(status && status.code) code = status.code;
        if(typeof msg.operationOutcome !== 'undefined')
        {
            msg = msg.operationOutcome;
        } 
        else 
        {
            delete msg.status;
            delete msg.restMessage;
            delete msg.ewd_application;
            delete msg.path;
            delete msg.token;
        }
        res.set('Content-Length', msg.length);
        res.status(code).send(msg);
    } else {
        //Send Response...
        if(req.originalUrl.indexOf("fhir") > -1) {
            var responseHandlers = responders["fhir"];
            var responseHandler = responseHandlers[req.method.toLowerCase()];
            res.type('application/fhir+json');
            responseHandler(msg, req, res);
        } else if(req.originalUrl.indexOf("token") > -1) {
            res.send(msg);
        } else {
            delete msg.token;
            res.send(msg);
        }
    }
    next();
  };