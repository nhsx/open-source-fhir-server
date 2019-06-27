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

var request = require('request');
var _ = require('underscore');

var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;
var returnedResourceManager = require('../../modules/returnedResourceManager.js').returnedResourceManager;

module.exports = function(args, finished) {
    //For each server that isn't local dispatch a request...
    //Dispatch query[0].raw to remote site and await response
    //https://github.com/robtweed/QEWD-Courier-QUp/blob/master/helm/discovery_service/apis/getPatientDemographics/index.js
    //if return, stamp each result with a tag (from server config) and persist in search set...
    //if error then just log it and move on (no need to exit the pipeline as this is just demonstrating a simple proxy/result aggregation)
    console.log("Search Dispatch: " + JSON.stringify(args,null,2));

    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("search");

    try
    {
        var server = request.server || undefined;
        if(typeof server === 'undefined' || server === '' || _.isEmpty(server)){
          finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Requests to persist search sets must contain a valid server registry object'));
        }

        var data = request.data || undefined;
        if (typeof data === 'undefined' || data === '' || _.isEmpty(data)) {
          finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Requests to persist search sets must contain a valid data object'));
        } 

        var query = data.query || undefined;
        if (typeof query === 'undefined' || query === '' || _.isEmpty(query)) {
          finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Requests to persist search sets must contain a valid query object'));
        } 

        var bundle = data.bundle || undefined;
        if (typeof bundle === 'undefined' || bundle === '' || _.isEmpty(bundle)) {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Resource cannot be empty or undefined')); 
        } 

        if (typeof bundle.resourceType === 'undefined' || bundle.resourceType === '' || (typeof bundle.resourceType !== 'undefined' && bundle.resourceType !== 'Bundle')) {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'ResourceType cannot be empty or undefined and must be equal to Bundle'));  
        }

        if(bundle.entry.length > 0 && returnedResourceManager.federate.canDispatch(query)) {
          //Grab the remote id from mdm based on what was searched for...
          var localId = returnedResourceManager.federate.getLocalIdFromQuery(query);
          if(localId !== '') {
            //Dispatch the query
            //For each result, append server source tag and add to bundle
            //Set request.data.bundle = federated bundle
            var mdm = this.db.use('mdm',localId);
            if(mdm.exists)
            {
              mdm = mdm.getDocument(true);
              //console.log(JSON.stringify(mdm,null,2));
              //Dispatch request - call back needs to...
              //For each result, append server source tag and add to bundle
              //Set request.data.bundle = federated bundle
              
            }
            finished(dispatcher.getResponseMessage(request,request.data));
          } 
          else 
          {
            finished(dispatcher.getResponseMessage(request,request.data));
          }
        } 
        else 
        {
          finished(dispatcher.getResponseMessage(request,request.data));
        }
    }
    catch(ex) {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }
}