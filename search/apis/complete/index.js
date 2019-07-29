/*
 ----------------------------------------------------------------------------------------------------------------------------
 | ROQR - fhiR On Qewd and dockeR                                                                                           |
 | Developed as part of the Yorkshire and Humber Care Record ("LHCRE")                                                      |
 | https://yhcr.org/wp-content/uploads/2019/05/YHCR_Design_Paper_003__Conceptual_Design_for_a_FHIR_Proxy_Server_v2.0.docx   |                                                              |
 |                                                                                                                          |
 | http://www.synanetics.com                                                                                                |
 | Email: support@synanetics.com                                                                                            |
 |                                                                                                                          |
 | QEWD                                                                                                                     |
 | http://qewdjs.com                                                                                                        |
 | https://github.com/robtweed/qewd/tree/master/up                                                                          |
 |                                                                                                                          |
 | FHIR/NHS Care Connect                                                                                                    |
 | https://nhsconnect.github.io/CareConnectAPI/                                                                             |
 |                                                                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");                                                          |
 | you may not use this file except in compliance with the License.                                                         |
 | You may obtain a copy of the License at                                                                                  |
 |                                                                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                                                                           |
 |                                                                                                                          |
 | Unless required by applicable law or agreed to in writing, software                                                      |
 | distributed under the License is distributed on an "AS IS" BASIS,                                                        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.                                                 |
 | See the License for the specific language governing permissions and                                                      |
 |  limitations under the License.                                                                                          |
 ----------------------------------------------------------------------------------------------------------------------------
 MVP pre-Alpha release: 4 June 2019
*/

var _ = require('underscore');

var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;

module.exports = function(args, finished) {
    console.log("Search Complete: " + JSON.stringify(args,null,2));

    var request = args.req.body;
    request.pipeline = [];
    request.pipeline.push("search");

    try
    {   
        //Check that there are any results first - if not kill this pipeline...
        var data = request.data || undefined;
        if(typeof data === 'undefined' || _.isEmpty(data)) {
            finished({searchcomplete:true});
        }        
        //Check searchSet id...
        var searchSetId = request.searchSetId || undefined;
        if (typeof searchSetId === 'undefined' || searchSetId === '') {
            finished(dispatcher.error.badRequest(request, 'processing', 'fatal', 'Unable to complete search - SearchSetId cannot be empty or undefined')); 
        }
        //Check searchset exists!
        searchSet = this.db.use("Bundle", searchSetId);
        if(!searchSet.exists) {
            finished(dispatcher.error.notFound(request,'processing', 'fatal', 'Unable to complete search - Search Set ' + searchSetId + ' does not exist or has expired')); 
        }
        //Check server...
        var server = request.server;
        if(typeof server === 'undefined' || _.isEmpty(server)) {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to complete search ' + searchSetId + ': server cannot be undefined'));  
        }
        //Check registry...
        var registry = request.registry;
        if(typeof registry === 'undefined' || (typeof registry !== 'undefined' && registry.searchResultParameters === undefined)) {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to complete search ' + searchSetId + ': No search result parameters configured'));  
        }
        //Got this far so fetch the query from cache and re-route it around the search process to complete...
        var querycache = this.db.use("querycache");
        var query = querycache.$(searchSetId).value;
        if(typeof query !== 'undefined') {
            query = dispatcher.parse(query);
            //Bin of anything that is in request.data and anything else that may still be attached from the search pipeline...
            delete request.data;
            delete request.mode;
            //Attach a new set of routes so that this query is effectively executed in full (out of band)...
            request.routes = [
                {paths:{path: "/services/v1/repo/index/query"}}, //Re run query...
                {paths:{path: "/services/v1/repo/batch/index"}}, //Hydrate results from repo...
                {paths:{path: "/services/v1/search/:searchSetId"}}, //Update/replace the existing initial search set...
                {paths:{path: "/services/v1/search/:searchSetId/sort"}}, //Sort it...
                {paths:{path: "/services/v1/search/:searchSetId"}} //Update with sorted search set...
            ];
            //Bin the query cache entry...
            querycache = this.db.use('querycache',searchSetId);
            if(querycache.exists)
            {
                querycache.delete();
            }
            //Forward the query...
            finished(dispatcher.getResponseMessage(request,{query:query}));
        } else {
            //Nothing to do here, so kill pipeline...
            finished({searchcomplete:true});
        }
    } catch(ex) {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    } 
}