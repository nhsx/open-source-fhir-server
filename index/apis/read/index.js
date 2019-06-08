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
var indexer = require('../../modules/indexer.js').indexer;
var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;

module.exports = function(args, finished) {
    console.log("Index Read: " + JSON.stringify(args,null,2));

    var docId = args.documentId || '';
    var documentType = args.documentType || '';
    var indexType = args.indexType || '';

    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("index");
    var registry = request.registry || undefined;

    var indexData = {
        documentId:docId,
        documentType:documentType,
        indices:[]
    };

    try
    {
        if(typeof registry === 'undefined') {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to create index for ' + resource.resourceType + ': No search parameters configured'));  
        };

        var db = this.db;
        registry.searchParameters.forEach(function(registryEntry) {
            var globals = [];
            if(Array.isArray(registryEntry.indexType)) {
                registryEntry.indexType.forEach(function(idxType) {
                    if(indexType !== '') {
                        if(indexType === idxType) globals.push(idxType);
                    } else {
                        globals.push(idxType);
                    }
                });
            } else {
                globals.push(registryEntry.indexType);
            }

            if(indexType === '' || (indexType !== '' && globals.indexOf(indexType) > -1)) 
            {
                globals.forEach(function(global) 
                {
                    var indexedProperties = [];
                    if(Array.isArray(registryEntry.searchProperty))
                    {
                        registryEntry.searchProperty.forEach(function(property) {
                            if(registryEntry.indexPropertyIndexTypes[property] === global)
                            {
                                indexedProperties.push(property);
                            }
                        });
                    } else {
                        var indexedProperty = registryEntry.searchProperty || registryEntry.property;
                        indexedProperties.push(indexedProperty);
                    }
                    
                    var path;
                    indexedProperties.forEach(function(indexedProperty) {
                        path = indexer.resolvers[global].call(
                            indexer, 
                            {
                                documentType: indexData.documentType,
                                documentId: indexData.documentId,
                                indexedProperty: indexedProperty
                            }
                        );
                    });

                    var documents = db.use(global);
                    path.paths.forEach(function(path) {
                        console.log("Path: " + path);
                        var pathArray = path.split(',');
                        documents.$(pathArray).forEachChild(function(value, node) {
                            
                            var global =  node._node.global;
                            var subscripts = node._node.subscripts;

                            node.forEachChild(function(id) {
                                if(id===indexData.documentId)
                                {
                                    subscripts.push(id);
                                    indexData.indices.push(
                                        {
                                            indexType: global,
                                            path: subscripts,
                                            value: documents.$(subscripts).value
                                        }
                                    )
                                    return true;
                                }
                            });
                        });
                    }); 
                });
            }
        });

        //Sort indexData so that it is returned in alphabetical order...
        indexer.sort(indexData);

        finished(dispatcher.getResponseMessage(request,indexData));

    } catch(ex) {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }
}