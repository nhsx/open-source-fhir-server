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
var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;

module.exports = function(args,finished) {
    //takes search message and re-formats/transforms to index query message...
    console.log("repo SEARCH in: " + JSON.stringify(args.req.body, null ,2));
    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("repo");
    
    var searchQuery = request.data.query || undefined;
    var registry = request.registry || undefined;

    try
    {
        //validate request (TODO...)
        var indexQuery = {};
        indexQuery.documentType = request.data.query.resourceType;
        indexQuery.page = request.data.query.page;
        indexQuery.pageSize = request.data.query.pageSize;
        indexQuery.parameters = [];
        indexQuery.sort = [];
        indexQuery.includes = request.data.query.includes;
        indexQuery.revincludes = request.data.query.revincludes;
        //Convert FHIR search params into index params...
        searchQuery.parameters.forEach(function(searchParameter) {
            var indexParameter = _.findWhere(registry.searchParameters, {property: searchParameter.name});
            if(typeof indexParameter !== 'undefined') {
                var queryParameter = {
                    indexType:indexParameter.indexType,
                    documentType: indexQuery.documentType.toLowerCase(),
                    node:indexParameter.property,
                    value: searchParameter.value
                }
                if(typeof searchParameter.modifier !== 'undefined') {
                    queryParameter.modifier = searchParameter.modifier;
                }
                indexQuery.parameters.push(queryParameter);
            }
        });
        //Replace the request's searchQuery with the indexQuery
        finished(dispatcher.getResponseMessage(request,{query:indexQuery}));
    } catch(ex) {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }
}