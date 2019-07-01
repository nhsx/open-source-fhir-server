var _ = require('underscore');

var subscriptionServicePipeline = {
    routes:[
        {paths:{path: "/services/v1/adapters/repo/search"}},
        {paths:{path: "/services/v1/repo/search"}},
        {paths:{path: "/services/v1/repo/index/query"}},
        {paths:{path: "/services/v1/search/results"}},
        {paths:{path: "/services/v1/repo/batch"}},
        {paths:{path: "/services/v1/publisher/evaluate"}},
        {paths:{path: "/services/v1/adapters/repo/search"}},
        {paths:{path: "/services/v1/repo/search"}},
        {paths:{path: "/services/v1/repo/index/query"}},
        {paths:{path: "/services/v1/publisher/notify"}}
    ],
    //TODO: Add log route...
    configureSubscriptionSearchRequest:function(request) {
        //Reset request routes...
        request.routes = this.routes;
        //Set message properties required by search service...
        request.resourceType = 'Subscription';     
        //Attach the subject/observable...
        request.subject = {
            registry: request.registry,
            resource: request.data.results
        }
        //Switch the registries...
        request.registry = request.subscriptionRegistry;
        delete request.subscriptionRegistry;
        //No longer need resource id and resource...
        delete request.resource;
        delete request.resourceId;
    },
    configureSubscriptionEvaluateRequest:function(request) {
        //Set registry and resource type to that of subject - searches are to be evaluated against the subject, e.g. Encounter, Observation etc, rather than the subscription...
        request.registry = request.subject.registry;
        request.resourceType = request.subject.resource.resourceType;
        //Once done, clean up the subject...
        delete request.subject.registry;
        //Promote subject.resource to subject to remove extraneous nesting of objects...
        request.subject = request.subject.resource;
        //Create an empty collection to hold the subscribers...
        request.subscribers = [];
    },
    getSubscriptionEvaluationQuery:function(request) {
        //For each subscription in the bundle, extract and parse the criteria query string so that a searchQuery can be created...
        var resourceId = request.subject.id;
        var bundle = request.data.bundle;
        var data = [];

        bundle.entry.forEach(function(entry) {
            var criteria = entry.resource.criteria.substring(entry.resource.criteria.indexOf('?')+1);
            var criteriaQueries = criteria.split('&');
            var queryData = {};
            queryData['_id'] = resourceId
            criteriaQueries.forEach(function(query) {
                var queryKeyValue = query.split('=');
                var key = queryKeyValue[0];
                var val = queryKeyValue[1];
                queryData[key] = val;
            });
            //Extract the salient details of the subscription and attach to request.subscribers (this enables other services to correlate between a query result and its intended enpoint/delivery channel)
            var queryIndex = data.push(queryData)-1;
            request.subscribers.push(
                {
                    subscription:entry.resource,
                    resultsIndex:queryIndex
                }
            );
        }); 
        //Once done, ditch the bundle as it is no longer required...
        delete request.data.bundle;
        delete request.data.bundleType;
        //Return data...
        return data;
    },
    getSubscriptionQuery:function(request) {
        var resourceType = request.subject.resource.resourceType;
        var data = {
            criteria:resourceType,
            status:'active'
        };
        return data;
    },
}

module.exports = {
    subscriptionServicePipeline
}
