var _ = require('underscore');

var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;
var ssp = require('../modules/subscriptionServicePipeline.js').subscriptionServicePipeline;

module.exports = function(args, finished)
{
   console.log("Publisher Evaluate: " + JSON.stringify(args,null,2));

   var request = args.req.body;
   request.pipeline = request.pipeline || [];
   request.pipeline.push("publish");

   try
   {
      var bundle = request.data.bundle || undefined;
      //Return error object to be sent to responder service in ms response...
      if (typeof bundle === 'undefined' || _.isEmpty(bundle)) {
        finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Evaluate: subscription bundle cannot be empty or undefined')); 
      } 

      var subject = request.subject || undefined;
      //Return error object to be sent to responder service in ms response...
      if (typeof subject === 'undefined' || _.isEmpty(subject)) {
        finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Evaluate: No subject to evaluate - subject cannot be empty or undefined')); 
      } 

      if(typeof subject.resource === 'undefined' || _.isEmpty(subject)) {
        finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Evaluate: No subject to evaluate - subject cannot be empty or undefined')); 
      }

      //Only continue if active subscriptions were found...
      var entries = bundle.entry || undefined;
      if(typeof entries !== 'undefined' && (_.isArray(entries) && entries.length > 0)) {
        //Just a sanity check to ensure that only active subscriptions are processed...
        var activeSubs = _.filter(entries, function(entry) {
          return entry.resource.status === 'active';
        });
        if(typeof activeSubs === 'undefined' || activeSubs.length === 0) {
          //Just exit the pipeline here as nothing to be done...
          finished({publish:false});
        } 
        else
        {
          //Before forwarding to search services, configure the request...
          ssp.configureSubscriptionEvaluateRequest(request);
          //Fetch the search query(ies) that require evaluating...
          var subscriptionQuery = ssp.getSubscriptionEvaluationQuery(request);
          //Dispatch...
          finished(dispatcher.getResponseMessage(request,subscriptionQuery));
        }
      }
    } catch (ex) { 
       finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
   }


  

}