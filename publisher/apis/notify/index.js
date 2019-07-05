var _ = require('underscore');

var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;
var notifier = require('../modules/notifier.js').notifier;

module.exports = function(args, finished)
{
   console.log("Publisher Notify: " + JSON.stringify(args,null,2));

   var request = args.req.body;
   request.pipeline = request.pipeline || [];
   request.pipeline.push("publish");

   try
   {

    var query = request.data.query;
    if(typeof query === 'undefined' || _.isEmpty(query) || !_.isArray(query)) {
      finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Notify: Invalid query - query cannot be empty or undefined and must be an array')); 
    }

    var subscribers = request.subscribers || undefined;
    if (typeof subscribers === 'undefined' || _.isEmpty(subscribers) || !_.isArray(subscribers)) {
      finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Notify: Invalid subscribers - subscribers cannot be empty or undefined and must be an array')); 
    } 

    var notificationCount = subscribers.length;
    subscribers.forEach(function(subscriber) {
        query = query[subscriber.resultsIndex];
        if(typeof query.results !== 'undefined' && _.isArray(query.results) && query.results.length > 0) 
        {
          var subscription = subscriber.subscription;
          var replies = 0
          //This subject matches this subscription...
          notifier.notify(subscription, request.subject, function(result) {
            if(result) {
              //Update subscription.error...
              subscription.error = result.error;
              subscriber.noftificationSent = false;
            } else {
              subscriber.noftificationSent = true;
            }
            replies++;
            if(replies === subscribers.length)
            {
              var subscribers = request.subscribers;
              //No longer require the context so ditch everything from request apart from subscribers and updated subscriptions...
              delete request.bundleType;
              delete request.subject;
              delete request.resourceType;
              delete request.registry;
              delete request.subscribers;
          
              finished(dispatcher.getResponseMessage(request, {results:subscribers}));
            }
          }); 
        }
    });

   } catch (ex) { 
       finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
   }


  

}