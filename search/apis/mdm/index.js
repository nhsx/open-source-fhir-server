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

/* THIS IS A TEMPORARY HACK FOR MDM - MDM WILL BE IN ITS OWN SERVICE (part of the aggregator) */

var request = require('request');
var _ = require('underscore');

var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;

module.exports = function(args, finished) {
    console.log("Search MDM: " + JSON.stringify(args,null,2));

    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("search");

    try
    {
        var server = request.server || undefined;
        if(typeof server === 'undefined' || server === '' || _.isEmpty(server)){
          finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Requests to persist MDM data must contain a valid server registry object'));
        }

        var registry = request.registry || undefined;
        if(typeof registry === 'undefined' || registry === '' || _.isEmpty(registry)){
          finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Requests to persist MDM data must contain a valid resource registry object'));
        }

        var isMasterData = registry.isMasterData || false;
        if(!isMasterData) {
          //Exit here as this resource requires no mdm...
          finished(dispatcher.getResponseMessage(request,request.data));
        }

        var data = (request.data && request.data.results) || undefined;
        if (typeof data === 'undefined' || data === '' || _.isEmpty(data)) {
          finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Requests to persist persist MDM data must contain a valid data object'));
        } 

        var resource = request.data.results;
        //For each remote system map the local resource id to remote system id...
        var remotes = _.filter(server.sources, function(source) {
          return source.isLocal === false;
        });
        var ids = [];
        //Fetch ids to
        remotes.forEach(function(remote) {
          ids = _.filter(resource.identifier, function(id) {
            return id.system === remote.resourceIdentifier.system;
          });
        });
        if(ids.length > 0)
        {
          request.data.mdm = [];
          var mdm = this.db.use('mdm');
          //Write out to MDM global
          //local id, source system, source system id...
          ids.forEach(function(id) {
            var mdmEntry = {
              id:resource.id,
              source:id.system,
              value:id.value
            }
            mdm.$(mdmEntry.id).setDocument(mdmEntry);
            request.data.mdm.push(mdmEntry);
          });
        }
        //Pass through original request...
        finished(dispatcher.getResponseMessage(request,request.data));
    }
    catch(ex) {
      finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }
}