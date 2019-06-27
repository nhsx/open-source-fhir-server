var subscriptionServicePipeline = {
    routes:[
        {paths:{path: "/services/v1/adapters/repo/search"}},
        {paths:{path: "/services/v1/repo/search"}},
        {paths:{path: "/services/v1/repo/index/query"}},
        {paths:{path: "/services/v1/search/results"}},
        {paths:{path: "/services/v1/repo/batch"}},
        {paths:{path: "/services/v1/publisher/evaluate"}}
    ],
    configureRequest:function(request) {
        //Reset request routes...
        request.routes = this.routes;
        //Set message properties required by search service...
        request.resourceType = 'Subscription';     
        //Switch the registries...
        request.registry = request.subscriptionRegistry;
        delete request.subscriptionRegistry;
        //Attach the subject/observable...
        request.subject = request.data.results;
    },
    getSubscriptionQuery:function(request) {
        var resourceType = request.resource
        var data = {
            criteria:resourceType
        };
        return data;
    },
}

module.exports = {
    subscriptionServicePipeline
}
