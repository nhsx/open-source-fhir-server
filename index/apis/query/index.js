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
var query = require('../../modules/query.js').query;

module.exports = function(args, finished)
{
    console.log("Index Query: " + JSON.stringify(args,null,2));
    
    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("index");

    try
    {
        var server = request.server;
        if(typeof server === 'undefined' || _.isEmpty(server)) {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to query index: Invalid request - no server thresholds present. Server is either null or undefined')); 
        }

        var maxInitialSearchResultSetSize = _.find(server.sources, function(source) {
            return source.isLocal === true;
        }).maxInitialSearchResultSetSize;

        if(typeof request.data === 'undefined') {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to query index: Invalid request - no message data present in request body')); 
        }

        var qry = request.data.query || undefined;
        if(typeof qry === 'undefined') {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to query index for: Invalid request - no query present in request body'));
        }

        if(!Array.isArray(qry))
        {
            qry = [request.data.query];
        }

        //Declare response...
        var data = {};
        //Check if there is an existing result set with this query - forward it to next service if there is (on assumption that it is required)...
        var results = request.data.results || undefined;
        if(typeof results !== 'undefined') {
            data.results = results;
        }

        var db = this.db;
        qry.forEach(function(q) {
            var documentType = q.documentType || '';
            if(documentType === '') {
                finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to query index for ' + documentType + ': Invalid query - query does not contain a valid document type'));
            }
    
            var parameters = q.parameters || undefined;
            if(typeof parameters === 'undefined' || !Array.isArray(parameters) || (Array.isArray(parameters) && parameters.length === 0)) {
                finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to query index for ' + documentType + ': No search parameters present in request body'));  
            };

            //Validate that the document type for each parameter matches the query.documentType...
            var paramIndex = 0;
            parameters.forEach(function(parameter)  {
                if(parameter.documentType.toLowerCase() !== documentType.toLowerCase())
                {
                    finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to query index for ' + documentType + ': Parameter Document Type (' + parameter.documentType + ') and Query Document Type (' + documentType + ') mismatch at parameter index: ' + paramIndex + ''));
                }
                paramIndex++;
            });
    
            var registry = request.registry;
            if(typeof registry === 'undefined') {
                finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to query index for ' + documentType + ': No search parameters configured'));  
            };
    
            q.results = [];
    
            var filtered;
            var matches;
            var passNo = 0;

            //Determine whether a partial (initial) result set has been sent back to the client...
            var isInitial = typeof q.isInitial !== 'undefined' ? q.isInitial : true;
            //For each parameter - create the filtered result set
            for(var i=0;i<parameters.length;i++)
            {
                var parameter = parameters[i];
                passNo++;
                matches = {};
                var global = parameter.documentType.toLowerCase() + parameter.indexType;
                //Instantiate the correct global...
                var documents = db.use(global);
                //Apply filters using filter handler for this 'type' of global...
                var results = query.filters[parameter.indexType].call(query, documents, parameter);
                for(var j=0;j<results.length;j++) {
                    var match = results[j];
                    matches[match] = true;
                }
                
                if(passNo === 1) {
                    filtered = matches;
                } else {
                    for(result in filtered) {
                         if(!matches[result]) delete filtered[result];
                    }
                }
            }
            //Set the total results...
            q.total = _.keys(filtered).length;
            //Build result list, taking threshold into account...
            for(result in filtered) {
                q.results.push(result);
                //Keep going until maxInitialSearchResultSize if this the initial run...
                if(isInitial === true && q.results.length === maxInitialSearchResultSetSize) {
                    q.isInitial = false;
                    break;
                }
            }
        });

        data.query = qry
        //Respond...
        finished(dispatcher.getResponseMessage(request,data));
    } catch(ex) {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }
}