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
    console.log("Search Create: " + JSON.stringify(args,null,2));

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

        //Add an id property to the resource before persisting...
        if (typeof bundle.id === 'undefined' || bundle.id.length === 0) bundle.id = uuid.v4();
        //Set meta/version id...
        if (typeof bundle.meta === 'undefined' || (typeof bundle.meta !== 'undefined' && bundle.meta.versionId === undefined)) {
          bundle.meta = bundle.meta || {};
          bundle.meta.versionId = "1";
          bundle.meta.lastUpdated = moment().utc().format();
        }
        //Add a self link so that the context of this search is persisted...
        bundle.link = [];
        bundle.link.push({relation:"self", url:server.url + query[0].raw});
        //Set the bundle total (note: this is how many matched the search critiera - does not include "included" or "revincluded" results)...
        bundle.total = bundle.entry.length.toString();
        //For each entry, set the mode to match...
        for(var i=0;i<bundle.entry.length;i++) {
          var entry = bundle.entry[i];
          entry.fullUrl = request.server.url + entry.resource.resourceType + "/" + entry.resource.id;
          entry.search = {mode:"match"};
        }
        bundle.entry = _.map(bundle.entry, function(entry, index) {
          
          return entry;
        });
        //Persist bundle/search set...
        var doc = this.db.use(bundle.resourceType);
        doc.$(bundle.id).setDocument(bundle);
        //Set searchSet id on the incoming request so that it is present in the response from this handler and available to other services that may be in the pipeline...
        request.searchSetId = bundle.id;

        finished(dispatcher.getResponseMessage(request,{query, bundle}));
    }
    catch (ex) {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }
}