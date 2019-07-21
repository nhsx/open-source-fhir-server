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
    request.pipeline = request.pipeline || [];
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
        //Check that there are any results first - if not kill this pipeline...
        var query = request.data.query || undefined;
        if(typeof query === 'undefined' || _.isEmpty(query)) {
            finished({searchcomplete:true});
        }
        //Check server...
        var server = request.server;
        if(typeof server === 'undefined' || _.isEmpty(server)) {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to complete search ' + searchSetId + ': server cannot be undefined'));  
        }
        //Get maxiniitalresultsize...
        var maxInitialSearchResultSetSize = _.find(server.sources, function(source) {
            return source.isLocal === true;
        }).maxInitialSearchResultSetSize;
        //Check that there are any results first - if not kill this pipeline...
        var bundle = request.data.bundle || undefined;
        if(typeof bundle === 'undefined' || _.isEmpty(bundle) || (!_.isEmpty(bundle) && !_.isArray(bundle.entry) || (!_.isEmpty(bundle) && _.isArray(bundle.entry) && bundle.entry.length === 0))) {
            finished({searchcomplete:true});
        }
        //Is there any need to proceed?
        if(parseInt(bundle.total) < maxInitialSearchResultSetSize)
        {
            finished({searchcomplete:true});
        }
        //Check registry...
        var registry = request.registry;
        if(typeof registry === 'undefined' || (typeof registry !== 'undefined' && registry.searchResultParameters === undefined)) {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to complete search ' + searchSetId + ': No search result parameters configured'));  
        }
        //Need to map inbound message from search onto that which is needed by query/index...
        //First thing - drop the bundle...
        delete data.bundle;
        //Next, drop results from initial search, make sure that q.isInitial === false (this will override maxInitialResultSetSize observation in query/index) and blat total...
        //This is effectively restoring the query back to it's original state and then asking the index service to execute it in full...
        var completeSearch = true;
        for(var i=0;i<query.length;i++)
        {
            var q = query[i];
            var isInitial = typeof q.isInitial !== 'undefined' ? q.isInitial : true;
            //Only continue if this is the initial query and the total is > maxInitialSearchResultSetSize...
            if(isInitial === true) {
                //Set q.isInitial...
                q.isInitial = false;
                //Delete total and results...
                delete q.total;
                delete q.results;
            } else {
                completeSearch = false;
                break;
            }
        }
        if(completeSearch === true) {
            //Persist query so that it can be re-run...
            var queries = this.db.use('querycache');
            queries.$(searchSetId).value = dispatcher.stringify(query);
            //Exit here - respond with the query, in case a service may need it...
            finished(dispatcher.getResponseMessage(request,{query:query}));
        } else {
            //Nothing to do here, so kill pipeline...
            finished({searchcomplete:true});
        }
    } catch(ex) {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    } 

}