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
    console.log("Repo Batch Read: " + JSON.stringify(args,null,2));
    
    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("repo");
   
    try
    {
        var batch = request.data.batchRequest || undefined;
        if(typeof batch === 'undefined') {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Bundle cannot be empty or undefined')); 
        }

        if(batch.type !== 'batch') {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Only Batch requests are supported by this server.')); 
        }

        var entries = batch.entry || undefined;
        if(typeof entries === 'undefined' || (typeof entries !== 'undefined' && !Array.isArray(entries))) {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Bundle must contain a valid entry array which must contain at least 1 request')); 
        }

        var query = request.data.query;
        if(typeof query === 'undefined')
        {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Batch requests to the local FHIR store (repo) must contain a valid query in addition to a batchrequest')); 
        }

        var db = this.db;

        var bundle = {};
        bundle.resourceType = "Bundle"
        bundle.id = uuid.v4();
        bundle.type = request.bundleType || "batch-response";
        bundle.entry = [];

        entries.forEach(function(entry) {
            var url = entry.request.url;
            //Split url on "/" so that resourceType and resourceId can be extracted...
            if(url.indexOf("/") === 0) {
                url = url.substring(1);
            }
            var urlAsArray = url.split("/");
            var resourceType = urlAsArray[0];
            var resourceId = urlAsArray[1];
            //Fetch the resource from db..
            var resource = db.use(resourceType, resourceId);
            if(!resource.exists) {
                //Add an error response of 404 not found...
                bundle.entry.push(dispatcher.error.notFound(request, 'processing', 'fatal', 'Resource ' + resourceType + ' ' + resourceId + ' does not exist'));
            } else {
                //Add resource to bundle.entry after pulling it from source...
                resource = resource.getDocument(true);
                bundle.entry.push({resource: resource});
            }
        });

        finished(dispatcher.getResponseMessage(request,{query,bundle}));
    } catch(ex) {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }
}