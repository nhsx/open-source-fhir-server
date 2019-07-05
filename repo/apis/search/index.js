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

    try
    {
        var registry = request.registry || undefined;

        var searchQuery = request.data.query || undefined;
        if(!_.isArray(searchQuery))
        {
            searchQuery = [searchQuery];
        }

        var indexQueries = [];
        for(var i=0;i<searchQuery.length;i++)
        {
            var query = searchQuery[i];
            //validate request (TODO...)
            var indexQuery = {};
            indexQuery.raw = query.raw;
            indexQuery.documentType = query.resourceType;
            indexQuery.page = query.page;
            indexQuery.pageSize = query.pageSize;
            indexQuery.parameters = [];
            indexQuery.sort = [];
            indexQuery.includes = query.includes;
            indexQuery.revincludes = query.revincludes;
            //Convert FHIR search params into index params...
            for(var j=0;j<query.parameters.length;j++)
            {
                var searchParameter = query.parameters[j];
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
            }
            //Convert FHIR sort params into index sort parameters...
            for(var j=0;j<query.sort.length;j++)
            {
                var sortParameter = query.sort[j];
                var isDesc = sortParameter.startsWith('-');
                sortParameter = sortParameter.replace('-','');
                if(typeof registry.searchResultParameters.sort[sortParameter]!== 'undefined') {
                    var querySortParameter = {
                        name:sortParameter
                    }
                    if(isDesc === true) {
                        querySortParameter.direction = "desc";
                    }
                    indexQuery.sort.push(querySortParameter);
                }
            }
            //Add query to index queries...
            indexQueries.push(indexQuery);
        }
        //Replace the request's searchQuery with the indexQueries
        finished(dispatcher.getResponseMessage(request,{query:indexQueries}));
    } catch(ex) {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }
}