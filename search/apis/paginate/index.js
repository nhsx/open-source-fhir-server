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
var returnedResourceManager = require('../../modules/returnedResourceManager.js').returnedResourceManager;

module.exports = function(args, finished) {
    console.log("Search Read: " + JSON.stringify(args,null,2));

    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("search");

    try
    {
        var searchSetId = args.searchSetId || '';
        //paginate/:page/:pageSize
        var page = args.page || '1';
        var pageSize = args.pageSize || '*';
        var server = request.server || undefined;

        if(typeof server === 'undefined') {
            finished(dispatcher.error.badRequest(request, 'processing', 'fatal', 'Invalid Search configuration - server base url cannot be null or undefined')); 
        }

        //TODO: check data, query and pagination parameters
        //TODO: what if client changes the _count/pageSize???
        if (searchSetId === '') {
            finished(dispatcher.error.badRequest(request, 'processing', 'fatal', 'SearchSetId cannot be empty or undefined')); 
        }

        var query = request.data.query;
        var searchSet = this.db.use("Bundle", searchSetId);
        if(!searchSet.exists) {
            finished(dispatcher.error.notFound(request,'processing', 'fatal', 'Search Set ' + searchSetId + ' does not exist or has expired')); 
        } else {
            searchSet = searchSet.getDocument(true);
            if(searchSet.total > 0)
            {
                query.page = page;
                query.pageSize = pageSize;
                query.current = page;
                //This function will reattach any include/revinclude parameters requested in original query
                //This is necessary for cached searchsets as the original query is only persisted in bundle.link, specifically where link.relation === 'self'
                returnedResourceManager.includes.rebuild(searchSet, query);
     
                if(pageSize !== '*') {
                    var localRepo = _.find(server.sources, function(source) {
                        return source.isLocal === true;
                    })
    
                    var maxInitialSearchResultSize = localRepo.maxInitialSearchResultSetSize;
                    var maxSearchResultSize = localRepo.maxSearchResultSetSize;
    
                    query.totalPages = returnedResourceManager.paginate.lastPage(searchSet, pageSize, maxInitialSearchResultSize, maxSearchResultSize).toString();
                    query.previous = returnedResourceManager.paginate.previousPage(page, maxInitialSearchResultSize, maxSearchResultSize).toString();
                    query.next= returnedResourceManager.paginate.nextPage(searchSet, page, pageSize, maxInitialSearchResultSize, maxSearchResultSize).toString();
                    query.last = returnedResourceManager.paginate.lastPage(searchSet, pageSize, maxInitialSearchResultSize, maxSearchResultSize).toString();
                    //Attach Paging Links before trimming...
                    returnedResourceManager.paginate.attachLinks(searchSet, query, server);
                    //Now trim n return...
                    searchSet = returnedResourceManager.paginate.trim(searchSet, page, pageSize);
                }
            }
            
            finished(dispatcher.getResponseMessage(request,{query,results:searchSet}));
        }
    } catch(ex) {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    } 
}