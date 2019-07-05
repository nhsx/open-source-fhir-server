var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;
var ssp = require('../modules/subscriptionServicePipeline.js').subscriptionServicePipeline;

module.exports = function(args, finished)
{
    //Create modules
    //The publisherServicePipeline
    //Service Pipeline:
    /*
                {path: "/services/v1/repo/index/query"},//Fetch subs resources (Criteria=resourceType)
                {path: "/services/v1/search/results"},
                {path: "/services/v1/repo/batch"},
                //Forward batch to process...
                
                {path: process}//For each subs build batch of index queries and send (add subs endpoint to data object), 
                forward results to notify (this will give us the id of the result or no result for each query)
                {path: notify}
                where query result length === 1 instantiate a REQUEST HTTP object and forward to endpoint (create notifier type handlers but for now only REST)
               
    */

   console.log("Publisher Publish: " + JSON.stringify(args,null,2)); 

   var request = args.req.body;
   request.pipeline = request.pipeline || [];
   request.pipeline.push("publish");

   try
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
       //Don't notify if a subscription has changed/been created? 
       if(resourceType === 'Subscription') {
         //Exit pipeline...
         finished({publish:false});
       }
        //Before forwarding, replace the routes and registry in the request...
       ssp.configureSubscriptionSearchRequest(request);
       //Fetch the subscription query for attaching to the outbound request...
       var subscriptionQuery = ssp.getSubscriptionQuery(request);
       //Dispatch...
       finished(dispatcher.getResponseMessage(request,subscriptionQuery));
   }
   catch (ex) { 
       finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
   }

}