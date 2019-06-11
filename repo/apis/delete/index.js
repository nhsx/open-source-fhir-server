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

module.exports = function(args, finished) {

    console.log("Local Repo Delete: " + JSON.stringify(args,null,2));

    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("repo");
    

    try
    {
    
        var resourceId = request.resourceId;
        var resourceType = request.resource;

        if (typeof resourceType === 'undefined' || resourceType === '') {
          finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'ResourceType cannot be empty or undefined'));  
        }
      
        if (typeof resourceId === 'undefined' || resourceId.length === 0) {
          finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Resource ' + resourceType + ' cannot be deleted - \'resource id\' cannot be null'));
        }
        //Delete this resource (if it exists)...
        var resource = this.db.use(resourceType, resourceId);
        if(!resource.exists)
        {
            finished(dispatcher.error.notFound(request,'processing','fatal', 'Resource ' + resourceType + '/' + resourceId + ' not found'));
        }
        resource.delete();
        //Before dispatching to create, set checkid to false (this will bypass a validation rule which ensures created resources do not have and id)
        request.checkId = false;
        finished(dispatcher.getResponseMessage(request,request.data));
    }
    catch (ex) { 
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }
}