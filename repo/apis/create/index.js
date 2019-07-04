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
var _ = require('underscore');

var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;
  
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
        if (typeof resource === 'undefined' || resource === '' || _.isEmpty(resource)) {
          finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Resource cannot be empty or undefined')); 
        } 
    
        if (typeof resource.resourceType === 'undefined' || resource.resourceType === '') {
          finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'ResourceType cannot be empty or undefined'));  
        }
      
        if (checkId === true && typeof resource.id !== 'undefined' && resource.id.length > 0) {
          finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Resource ' + resource.resourceType + ' cannot have an \'id\' property'));
        }

        var server = request.server;
        if(typeof server === 'undefined' || server === '' || _.isEmpty(server)) {
          finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Server configuration is not available'));
        }

        //Add an id property to the resource before persisting...
        if (typeof resource.id === 'undefined' || resource.id.length === 0) resource.id = uuid.v4();
        //Set meta/version id...
        if (typeof resource.meta === 'undefined' || (typeof resource.meta !== 'undefined' && typeof resource.meta.versionId === 'undefined')) {
          resource.meta = resource.meta || {};
          resource.meta.versionId = '1';
          resource.meta.lastUpdated = moment().utc().format();
        }
        //Set source _tag...
        var source = _.find(server.sources,function(source) { return source.target === 'repo';});
        resource.meta.tag = resource.meta.tag || [];
        resource.meta.tag.push(
          {
            system:source.tag.system,
            code:source.tag.code,
            display:source.tag.display
          }
        );
        //Persist resource...
        var doc = this.db.use(resource.resourceType);
        doc.$(resource.id).setDocument(resource);
        finished(dispatcher.getResponseMessage(request,{results: resource}));
    }
    catch (ex) { 
        finished(
          dispatcher.error.serverError(request, ex.stack || ex.toString())
        );
    }
}