var server = require('./server.js').server;

var responders = {
    fhir: 
    {
        get: function(msg, req, res)
            {
                if(msg.token) delete msg.token

                res.set('Content-Length', msg.length);
                res.status(200)
                res.send(msg);
            },
        post: function(msg, req, res)
            {
                if(msg.token) delete msg.token
                
                res.status(201);
                res.set('Content-Length', msg.length);
                server.setResourceLocation(req,res,msg.resourceType,msg.id);
                res.send(msg);
            },
        put: function(msg, req, res)
            {
                if(msg.token) delete msg.token

                res.status(204);
                res.send();
            },
        delete: function(msg, req, res)
            {
                if(msg.token) delete msg.token

                res.status(202);//Non commital (lol)
                res.send();
            }
    }
}

module.exports = {
    responders
}