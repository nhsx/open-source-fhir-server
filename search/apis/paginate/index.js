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

var responseMessage = require('../../../configuration/messages/response.js').response;
var errorMessage = require('../../../configuration/messages/error.js').error;
var returnedResourceManager = require('../../modules/returnedResourceManager.js').returnedResourceManager;

module.exports = function(args, finished) {
    console.log("Search Read: " + JSON.stringify(args,null,2));

    var searchSetId = args.searchSetId || '';
    //paginate/:page/:pageSize
    var page = args.page || '1';
    var pageSize = args.pageSize || '*';

    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("search");

    try
    {
        //TODO: check query and pagination parameters
        if (searchSetId === '') {
            finished(errorMessage.badRequest(request, 'processing', 'fatal', 'SearchSetId cannot be empty or undefined')); 
        }

        var query = request.data.query;
        var searchSet = this.db.use("Bundle", searchSetId);
        if(!searchSet.exists) {
            finished(errorMessage.notFound(request,'processing', 'fatal', 'Search Set ' + searchSetId + ' does not exist or has expired')); 
        } else {
            searchSet = searchSet.getDocument(true);
            query.pageSize = pageSize;
            query.current = page;
 
            if(pageSize !== '*') {
                query.totalPages = returnedResourceManager.paginate.lastPage(searchSet, pageSize).toString();
                query.previous = returnedResourceManager.paginate.previousPage(page).toString();
                query.next= returnedResourceManager.paginate.nextPage(searchSet, page, pageSize).toString();
                query.last = returnedResourceManager.paginate.lastPage(searchSet, pageSize).toString();
                
                searchSet = returnedResourceManager.paginate.trim(searchSet, page, pageSize);
            }

            var results = searchSet;
            finished(responseMessage.getResponse(request,{query,results}));
        }
    } catch(ex) {
        finished(errorMessage.serverError(request, ex.stack || ex.toString()));
    } 
}