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
    console.log("publisher: " + JSON.stringify(args.req.body, null, 2));
    finished({OK:1});
}