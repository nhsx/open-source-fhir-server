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
var responseMessage = require('../../../configuration/messages/response.js').response;
var errorMessage = require('../../../configuration/messages/error.js').error;
 
module.exports = function(args, finished) {
    console.log("Repo Adapter Search: " + JSON.stringify(args,null,2));
    //Convert incoming query into REPO search query...
    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("repoadapter");

    try
    {
        //TODO: Site specific route to deal with persisted search sets that are being paged through (page will always be 1 in this instance)
        //validate inbound request (TODO)... especially need the registry here...
        var registry = request.registry;
        var queryParameters = request.data;
        var query = {
            resourceType:request.resourceType,
            parameters: [],
            pageSize:'*',
            page:'1',
            sort:[],
            includes:[],
            revincludes:[]
        }
        //map queryParameters onto search/indexed properties...
        for(p in queryParameters){
            if(p !== '_count' && p !=='_sort') {
                if(p !== '_include' && p !=='_revinclude') {
                    var parameterName = p;
                    //If there is a modifier present then strip out...
                    var modifier;
                    if(parameterName.indexOf(':') > -1)
                    {
                        var paramAndModifier = parameterName.split(':');
                        parameterName = paramAndModifier[0];
                        modifier = paramAndModifier[1];
                    } 
                    var searchParameter = _.findWhere(registry.searchParameters, {searchProperty:parameterName});
                    if(typeof searchParameter !== 'undefined') {
                        var parameter = {
                            name:searchParameter.property,
                            value:queryParameters[p]
                        };
                        if(typeof modifier !== 'undefined') 
                        {
                            parameter.modifier = modifier;
                        }
                        query.parameters.push(parameter);
                    }
                } else if(p === '_revinclude') {
                    query.revincludes.push(queryParameters[p]);
                } else if(p === '_include') {
                    query.includes.push(queryParameters[p]);
                }
            }
        }
        if(query.parameters.length === 0)
        {
            finished(errorMessage.badRequest(request,'processing', 'fatal', 'Invalid Search Parameters or Search Parameters not supported'));
        }

        //Set pagination parameters...
        query.pageSize = queryParameters["_count"] || '*';
        //Set sort parameters...
        if(typeof queryParameters["_sort"] !== 'undefined') {
            query.sort = queryParameters["_sort"].split(",");
        }
        //Set include parameters...
        finished(responseMessage.getResponse(request,{query: query}));
    } 
    catch(ex) 
    {
        finished(errorMessage.serverError(request, ex.stack || ex.toString()));
    }
}