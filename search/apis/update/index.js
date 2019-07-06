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

var _ = require('underscore');
var moment = require('moment');

var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher; 

module.exports = function(args, finished) {
  console.log("Search Update: " + JSON.stringify(args,null,2));

  var searchSetId = args.searchSetId;

  var request = args.req.body;
  request.pipeline = request.pipeline || [];
  request.pipeline.push("search");

  try
  {
    //TODO: Validate request.data (query/results)
    var query = request.data.query || undefined;
    var bundle = request.data.results || request.data.bundle || undefined;

    if (typeof bundle === 'undefined' || bundle === '' || _.isEmpty(bundle)) {
        finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Resource cannot be empty or undefined')); 
    } 

    if (typeof bundle.resourceType === 'undefined' || bundle.resourceType === '' || (typeof bundle.resourceType !== 'undefined' && bundle.resourceType !== 'Bundle')) {
        finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'ResourceType cannot be empty or undefined and must be equal to Bundle'));  
    }

    if (typeof bundle.id !== 'undefined' && bundle.id.length === 0) {
        finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Resource ' + bundle.resourceType + ' must have an \'id\' property'));
    }

    if(bundle.id !== searchSetId) {
        finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Resource ' + bundle.id + ' does not match ' + searchSetId));
    }

    //Does this bundle exist...
    var searchSet = this.db.use(bundle.resourceType, bundle.id);
    var previousVersion;
    if(!searchSet.exists) {
        finished(dispatcher.error.notFound(request,'processing', 'fatal', 'Searchset ' + bundle.id + ' does not exist or may have expired'));
    } else {
      previousVersion = searchSet.getDocument(true);
    }
    //Copy searchset meta to bundle and update version number, last updated etc...
    bundle.meta = previousVersion.meta;
    bundle.meta.versionId = parseInt(bundle.meta.versionId) + 1;
    bundle.meta.lastUpdated = moment().utc().format();
    //Ensure that the bundle type is set to search set...
    bundle.type = "searchset";
    //Copy over the total...
    bundle.total = previousVersion.total;
    //Copy the self link...
    if(typeof bundle.link === 'undefined' || (_.isArray(bundle.link) && bundle.link.length === 0))
    {
      bundle.link = []
      bundle.link.push(_.find(previousVersion.link, function(link) {
        return link.relation === "self";
      }));
    }
    //Now trash the previous search set...
    searchSet.delete();
    //Persist the new, updated one...
    var updatedSearchSet = this.db.use(bundle.resourceType);
    updatedSearchSet.$(bundle.id).setDocument(bundle);
    //Set searchset id on outbound response...
    request.searchSetId = searchSetId;
    var results = bundle;
    finished(dispatcher.getResponseMessage(request,{query, results}));

  } catch(ex) {
    finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
  }
}