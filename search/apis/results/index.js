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
var responseMessage = require('../../../configuration/messages/response.js').response;
var errorMessage = require('../../../configuration/messages/error.js').error;

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

        //for each query in request.data.query
        var query = request.data.query;
        if(!Array.isArray(query)) {
            query = [request.data.query];
        }
        //for each result in query.results
        query.forEach(function(q) {
            var results = q.results;
            results.forEach(function(result) {
                batchRequest.entry.push(
                    {
                        request:{
                            method:"GET",
                            url:q.documentType + "/" + result
                        }
                    }
                );
            });
        });
        
        finished(responseMessage.getResponse(request,{query,batchRequest}));
    } 
    catch(ex) {
        finished(errorMessage.serverError(request, ex.stack || ex.toString()));
    }

    finished({args});


    //query needs to process a batch against multiple resource types

}