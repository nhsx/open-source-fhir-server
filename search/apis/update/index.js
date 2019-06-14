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
var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;

function isEmptyObject(obj) {
    for (var prop in obj) {
      return false;
    }
    return true;
  }
  
  function isInt(value) {
    return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
  }

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
    var bundle = request.data.results || undefined;

    if (typeof bundle === 'undefined' || bundle === '' || isEmptyObject(bundle)) {
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
    if(!searchSet.exists) {
        finished(dispatcher.error.notFound(request,'processing', 'fatal', 'Resource ' + bundle.id + ' does not exist'));
    } 
    //Simple replace (so delete and then insert)
    searchSet.delete();
    //Set _lastUpdated
    bundle.meta.lastUpdated = moment().utc().format();
    searchSet = this.db.use(bundle.resourceType);
    searchSet.$(bundle.id).setDocument(bundle);
    //Set searchset id on outbound response...
    request.searchSetId = searchSetId;
    var results = bundle;
    finished(dispatcher.getResponseMessage(request,{query, results}));

  } catch(ex) {
    finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
  }
}