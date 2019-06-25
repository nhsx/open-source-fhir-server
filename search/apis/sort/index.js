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
var returnedResourceManager = require('../../modules/returnedResourceManager.js').returnedResourceManager;

module.exports = function(args, finished) {
    console.log("Search Sort: " + JSON.stringify(args,null,2));

    var searchSetId = args.searchSetId || '';

    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("search");

    var query = request.data.query || undefined;
    var registry = request.registry || undefined;

    try
    {        
        //Check registry
        if(typeof registry === 'undefined' || (typeof registry !== 'undefined' && registry.searchResultParameters === undefined)) {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to sort ' + searchSetId + ': No search result parameters configured'));  
        }

        if(typeof query === 'undefined')
        {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to sort ' + searchSetId + ': No query provided - query cannot be empty or undefined'));
        }

        //check query and sort params
        //if sort params check against registry...
        if (searchSetId === '') {
            finished(dispatcher.error.badRequest(request, 'processing', 'fatal', 'SearchSetId cannot be empty or undefined')); 
        }

        var searchSet = this.db.use("Bundle", searchSetId);
        if(!searchSet.exists) {
            finished(dispatcher.error.notFound(request,'processing', 'fatal', 'Search Set ' + searchSetId + ' does not exist or has expired')); 
        }
        searchSet = searchSet.getDocument(true);

        if(!Array.isArray(query)) {
            query = [request.data.query];
        }
        
        var results;
        query.forEach(function(q) {
            var sortParameters = q.sort || undefined;
 
            if(typeof sortParameters === 'undefined' || sortParameters.length === 0)
            {
                //If there are no search parameters then just return the search set...
                results = searchSet;
            } else {
                //Check sort parameters against registry...
                sortParameters.forEach(function(parameter) {
                    var isValid = (typeof registry.searchResultParameters.sort[parameter.name] !== 'undefined');
                        if(!isValid) {
                            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to sort ' + searchSetId + ': Sort Parameter ' + parameter.name + ' is not supported'));
                        }
                    });
            }

            results = returnedResourceManager.sort(registry, searchSet, sortParameters);
            finished(dispatcher.getResponseMessage(request,{query:q,results}));
        });
    } catch(ex) {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    } 
}