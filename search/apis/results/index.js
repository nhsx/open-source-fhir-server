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
    console.log("Search RESULTS " + JSON.stringify(args,null,2));

    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("search");

    //Convert query responses into batch requests...
    try
    {
        //validate request...

        //Set request.bundleReturnType to instruct batch operation to return the type of bundle required, rather than a default of batch-response...
        request.bundleType = "searchset"

        var batchRequest = {
            resourceType:"Bundle",
            id:uuid.v4(),
            type:"batch",
            entry: []
        };

        //Declare response...
        var data = {};
        //Check if there is an existing result set with this request - forward it to next service if there is (on assumption that it is required)...
        var results = request.data.results || undefined;
        if(typeof results !== 'undefined') {
            data.results = results;
        }
        //Convert the query to an array if needed - this may be a result set for different resource types...
        var query = request.data.query;
        if(!Array.isArray(query)) {
            query = [request.data.query];
        }
        //for each result in query.results
        query.forEach(function(q) {
            var results = q.results;
            batchRequest.entry = _.map(results, function(result) {
                return {
                            request:{
                                method:"GET",
                                url:q.documentType + "/" + result
                            }
                        }
                    });
        });
        //Add query and batch request to service response...
        data.query = query;
        data.batchRequest = batchRequest;
        //Dispatch...
        finished(dispatcher.getResponseMessage(request,data));
    } 
    catch(ex) {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }
}