var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;
var ssp = require('../modules/subscriptionServicePipeline.js').subscriptionServicePipeline;

module.exports = function(args, finished)
{
   console.log("Publisher Evaluate: " + JSON.stringify(args,null,2));

   var request = args.req.body;
   request.pipeline = request.pipeline || [];
   request.pipeline.push("publish");

   finished({OK:1});

   /*try
   {
       var resourceId = request.resourceId || undefined;
       //Return error object to be sent to responder service in ms response...
       if (typeof resourceId === 'undefined' || resourceId === '') {
         finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Publisher: resource id cannot be empty or undefined')); 
       } 
   
       var resourceType = request.resource || undefined;
       if (typeof resourceType === 'undefined' || resourceType === '') {
         finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Publisher: resource type cannot be empty or undefined'));  
       }
        //Before forwarding, replace the routes and registry in the request...
       ssp.configureRequest(request);
       //Fetch the subscription query for attaching to the outbound request...
       var subscriptionQuery = ssp.getSubscriptionQuery(request);
       //Dispatch...
       finished(dispatcher.getResponseMessage(request,subscriptionQuery));
       }
   catch (ex) { 
       finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
   }*/

}