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

var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;
var returnedResourceManager = require('../../modules/returnedResourceManager.js').returnedResourceManager;

module.exports = function(args, finished) {
    console.log("Search Include: " + JSON.stringify(args,null,2));

    var searchSetId = args.searchSetId || '';

    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("search");
    request.mode = "include";
    request.searchSetId = searchSetId;

    try
    {
        
        //if no routes defined etc
        var registry = request.registry || undefined;
        //if registry undefined...
        //if request.data undefined || request.data.query undefined
        var query = request.data.query || undefined;
        //if query.include undefined, is not an array or if it is an array and length === 0 
        if(!Array.isArray(query)) {
            query = [request.data.query];
        }
        //If a result set/bundle as been passed then searchset should reference it, else pull searchset from cache...
        var searchSet = request.data.results || undefined
        if(typeof searchSet === 'undefined') {
            searchSet = this.db.use("Bundle", request.searchSetId);
            if(!searchSet.exists) {
                finished(dispatcher.error.notFound(request,'processing', 'fatal', 'Search Set ' + request.searchSetId + ' does not exist or has expired')); 
            }
            else {
                searchSet = searchSet.getDocument(true);
            }
        }
        //This generates a set of queries derived from the initial query (which contains include and revincludes)
        //Once the include (and rev) queries have been generated, the initial query should be popped off the array as the generated search set is already cached (there wouldnt be a search set id otherwise)
        
        query.forEach(function(q) {
            var referenceQueries = returnedResourceManager.includes.fetch(registry,searchSet,q.includes,q.revincludes)
            referenceQueries.forEach(function(rq) {
                query.push(rq);
            });
        });
        query.shift();
        
        request.mode = "include";
        finished(dispatcher.getResponseMessage(request,{query,results:searchSet}));
    } catch(ex) {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }
}