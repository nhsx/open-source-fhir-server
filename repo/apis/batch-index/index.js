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
var _ = require('underscore');

var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;

module.exports = function(args, finished) {
    console.log("Repo Batch Index Read: " + JSON.stringify(args,null,2));
    
    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("repo");
   
    try
    {
        var query = request.data.query;
        if(typeof query === 'undefined')
        {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Batch requests to the local FHIR store (repo) must contain a valid query in addition to a batchrequest')); 
        }

        //Declare response...
        var data = {};
        //Check if there is an existing result set with this request - forward it to next service if there is (on assumption that it is required)...
        var results = request.data.results || undefined;
        if(typeof results !== 'undefined') {
            data.results = results;
        }

        var bundle = {};
        bundle.resourceType = "Bundle"
        bundle.id = request.searchSetId || uuid.v4(); //Check for existing search set id... this request may have come from the search complete service, in which case, the bundle.id should be the same as the existing searchSetId
        bundle.type = request.bundleType || "batch-response";
        bundle.entry = [];

        for(var i=0;i<query.length;i++)
        {
            var q = query[i]
            var resourceType = q.documentType;
            var queryResults = q.results;
            for(var j=0;j<queryResults.length;j++)
            {
                var resourceId = queryResults[j];
                var entry = this.db.use(resourceType,resourceId);
                if(entry.exists)
                {
                    entry = entry.getDocument(true);
                    bundle.entry.push({resource: entry});
                }
            }
        }
        //Add query and bundle to service response...
        data.query = query;
        data.bundle = bundle;
        //Dispatch...
        finished(dispatcher.getResponseMessage(request,data));
    } catch(ex) {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }
}