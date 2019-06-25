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

var uuid = require('uuid');
var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;

module.exports = function(args, finished) {
    console.log("Search Add: " + JSON.stringify(args,null,2));

    var searchSetId = args.searchSetId || '';

    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("search");

    try
    {
        if (searchSetId === '') {
            finished(dispatcher.error.badRequest(request, 'processing', 'fatal', 'SearchSetId cannot be empty or undefined')); 
        }
        //TODO: Validate presence of data, data.bundle, data.query in request
        //Same checks as paginate/sort 

        var mode = request.mode || '';
        if(mode === '')
        {
            finished(dispatcher.error.badRequest(request, 'processing', 'fatal', 'Adding resources to an existing searchset/bundle requires a mode of include or revinclude to be specified')); 
        }
        //Declare response...
        var data = {};
       //If a result set/bundle as been passed to this service then searchset should reference it, else pull searchset from cache...
        var searchSet = request.data.results || undefined
        if(typeof searchSet === 'undefined') {
            searchSet = this.db.use("Bundle", request.searchSetId);
            if(!searchSet.exists) {
                finished(dispatcher.error.notFound(request,'processing', 'fatal', 'Search Set ' + request.searchSetId + ' does not exist or has expired')); 
            }
            else {
                searchSet = searchSet.getDocument(true);
            }
        } else {
            //Preserve the initial result set prior to any additions (useful for debugging/logging...)
            data.initialResults = searchSet;
        }
        //This is the bundle that must be added to the search set...
        var bundle = request.data.bundle;
        var query = request.data.query;
        query.added = [];
        bundle.entry.forEach(function(entry) {
            entry.fullUrl = request.server.url + entry.resource.resourceType + "/" + entry.resource.id;
            entry.search = {mode: mode};
            searchSet.entry.push(entry);

            query.added.push(
                {
                    reference:entry.resource.resourceType + '/' + entry.resource.id,
                    mode:mode 
                }
            )
        });
        //Build service response data...
        data.query = query;
        data.results = searchSet;
        //Dispatch response...
        finished(dispatcher.getResponseMessage(request,data));
    } catch(ex) {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }    
}