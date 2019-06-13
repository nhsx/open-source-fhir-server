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

module.exports = function(args, finished) {
    
    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("index");

    try
    {
        var documentId = args.req.body.documentId || undefined;
        var documentType = args.req.body.documentType || undefined;
        var registry = request.registry;

        if(typeof documentId === 'undefined') {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to delete index - document id cannot be null or undefined'));  
        }

        if(typeof registry === 'undefined') {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to delete index for document id ' + documentId + ': No search parameters configured'));  
        }

        var db = this.db;
        var indexTypes = _.uniq(_.sortBy(_.pluck(_.filter(registry.searchParameters,function(sp) { return sp.type !== 'virtual';}),"indexType"),true));
        indexTypes.forEach(function(indexType) {
            var index = db.use(indexType);
            index.forEachLeafNode(function(data,leafNode) {
                if(data!=='' && data===documentId) {
                    index.$(leafNode._node.subscripts).delete();
                }
            });
        });

        finished(dispatcher.getResponseMessage(request,request.data));
    } 
    catch(ex) {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }
}