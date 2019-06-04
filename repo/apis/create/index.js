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


var moment = require('moment');
var uuid = require('uuid');
var responseMessage = require('../../../configuration/messages/response.js').response;
var errorMessage = require('../../../configuration/messages/error.js').error;

function isEmptyObject(obj) {
    for (var prop in obj) {
      return false;
    }
    return true;
  }
  
module.exports = function(args, finished) {
    console.log("Local Repo Create: " + JSON.stringify(args,null,2));

    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("repo");
    
    var resource = request.data || undefined;
    var checkId = request.checkId|| undefined;

    try
    {
        //Return error object to be sent to responder service in ms response...
        if (typeof resource === 'undefined' || resource === '' || isEmptyObject(resource)) {
          finished(errorMessage.badRequest(request,'processing', 'fatal', 'Resource cannot be empty or undefined')); 
        } 
    
        if (typeof resource.resourceType === 'undefined' || resource.resourceType === '') {
          finished(errorMessage.badRequest(request,'processing', 'fatal', 'ResourceType cannot be empty or undefined'));  
        }
      
        if (checkId && typeof resource.id !== 'undefined' && resource.id.length > 0) {
          finished(errorMessage.badRequest(request,'processing', 'fatal', 'Resource ' + resource.resourceType + ' cannot have an \'id\' property'));
        }

        //Add an id property to the resource before persisting...
        if (typeof resource.id === 'undefined' || resource.id.length === 0) resource.id = uuid.v4();
        //Set meta/version id...
        if (typeof resource.meta === 'undefined' || (typeof resource.meta !== 'undefined' && resource.meta.versionId === undefined)) {
          resource.meta = resource.meta || {};
          resource.meta.versionId = '1';
          resource.meta.lastUpdated = moment().utc().format();
        }
        //Persist resource...
        var doc = this.db.use(resource.resourceType);
        doc.$(resource.id).setDocument(resource);
        finished(responseMessage.getResponse(request,{results: resource}));
    }
    catch (ex) { 
        finished(
          errorMessage.serverError(request, ex.stack || ex.toString())
        );
    }
}