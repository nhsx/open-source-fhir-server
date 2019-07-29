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

module.exports = function(args, finished) 
{
    console.log("Index Top: " + JSON.stringify(args,null,2));
    
    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("index");

    try
    {
        if(typeof request.data === 'undefined') {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to query index: Invalid request - no message data present in request body')); 
        }

        var qry = request.data.query || undefined;
        if(typeof qry === 'undefined') {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to query index for: Invalid request - no query present in request body'));
        }

        //Declare response...
        var data = {};
        //Check if there is an existing result set with this query - forward it to next service if there is (on assumption that it is required)...
        var results = request.data.results || undefined;
        if(typeof results !== 'undefined') {
            data.results = results;
        }

        if(!Array.isArray(qry))
        {
            qry = [request.data.query];
        }
        //Only return up to maxInitialSearchResultSetSize threshold then set q.initial === true so that the remainder of this search can be completed out of band...
        var threshold = _.find(request.server.sources, function(source) {
            return source.isLocal === true;
        }).maxInitialSearchResultSetSize;

        var db = this.db.use(request.resourceType.toLowerCase() + 'id'); //Always use the id global...
        for(var i=0;i<qry.length;i++)
        {
            var q = qry[i];
            q.results = [];
            db.$([q.documentType.toLowerCase(),'id']).forEachChild(function(value,node) {
                q.results.push(value);
            });
            q.total = q.results.length;
            if(q.total > threshold)
            {
                q.results = q.results.slice(0,threshold);
                q.isInitial = true;
                break;
            }
        }

        data.query = qry
        
        finished(dispatcher.getResponseMessage(request,data));
    }
    catch(ex) 
    {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }

}