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
var uuid = require('uuid');
var traverse = require('traverse');

var responseMessage = require('../../../configuration/messages/response.js').response;
var errorMessage = require('../../../configuration/messages/error.js').error;
var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;


var indexer = require('../../modules/indexer.js').indexer;

function isEmptyObject(obj) {
    for (var prop in obj) {
      return false;
    }
    return true;
  }

function isInt(value) {
    return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
}

var indexed = [];

module.exports = function(args, finished) {
    console.log("Index Create: " + JSON.stringify(args,null,2));

    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("index");

    try
    {
        var resource = request.data.results || undefined;
        var registry = request.registry || undefined;

        //Return error object to be sent to responder service in ms response...
        if (typeof resource === 'undefined' || resource === '' || isEmptyObject(resource)) {
          finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Resource cannot be empty or undefined')); 
        } 

        if(typeof resource.id === 'undefined' || resource.id === '')
        {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to create index for ' + resource.resourceType + ': Resource has no id')); 
        }
    
        if (typeof resource.resourceType === 'undefined' || resource.resourceType === '') {
          finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'ResourceType cannot be empty or undefined'));  
        }

        //Add resource id and resource type to inbound request...
        request.resourceId = resource.id;
        request.resource = resource.resourceType;
         
        if(typeof registry === 'undefined') {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to create index for ' + resource.resourceType + ': No search parameters configured'));  
        }
      
        var indexData = {
            documentId:resource.id,
            documentType:resource.resourceType,
            indices:[]
        };
        //Remove any FHIR extensions from the resource as these are not searchable and so there is no point in indexing them
        resource = traverse(resource).map(function(node) {
            if(this.key === 'extension') this.remove();
        });

        var db = this.db;
        var indices;
        var indexTypeHandler;
        var isIndexable = false;

        traverse(resource).map(function(node) {
            if(!Array.isArray(node)) {
                this.path.forEach(function(path) {
                    registry.searchParameters.forEach(function(registryEntry) {
                        //If this search Parameter IS NOT virtual then proceed...
                        if(registryEntry.type !== 'virtual')
                        {
                            ///If false then any other property after this one with the same name will not be indexed
                            //This is intended to prevent encounter.type and encounter.participant.type from both being indexed as encounter.type, for example...
                            var allowMultiple = (typeof registryEntry.allowMultiple === 'undefined' ? true : registryEntry.allowMultiple);
                            if(allowMultiple === false) {
                                //Check if this indexType.property hasn't already been indexed... if not, isIndexable === true
                                isIndexable = (registryEntry.property === path && indexed.indexOf(registryEntry.property) === -1);
                            } 
                            else {
                                isIndexable = (registryEntry.property === path);
                            }

                            if(isIndexable) {
                                indexTypeHandler = indexer.indexers[registryEntry.type];
                                indices = indexTypeHandler.call(
                                    indexer, 
                                    {
                                        resourceType: resource.resourceType,
                                        propertyName: path,
                                        global: registryEntry.indexType,
                                        indexFrom: node,
                                        indexPropertyName: registryEntry.indexProperty || registryEntry.searchProperty || registryEntry.property
                                    }
                                );
                                
                                //If allowMultiple === false and we have got this far then add indexType.property to the indexed array to prevent any more properties of the same name from being indexed...
                                if(allowMultiple === false) {
                                    indexed.push(registryEntry.property);
                                }
                            }   
                        }
                    });
                });
            }
            //Create the indices...
            if(indices !== undefined && indices.length > 0)
            {
                indices.forEach(function(index) {
                    if(index !== undefined && index.subscripts !== undefined && index.subscripts.length > 0)
                    {
                        var subscripts = index.subscripts;
                        subscripts.forEach(function (sub) {
                            traverse(sub).map(function (node) {
                                if (typeof node!=='object' && node !== 'index' && node !== '') {
    
                                    var subs = [];
                                    subs.push(resource.resourceType.toLowerCase());
                                    this.path.forEach(function(term) {
                                        if (!isInt(term)) subs.push(term);
                                    });
                                    subs.push(node);
                                    subs.push(resource.id);
    
                                    var idx = db.use(index.global);
                                    idx.$(subs).value = resource.id;
        
                                    indexData.indices.push(
                                        {
                                            indexType:index.global,
                                            path: subs,
                                            value: idx.$(subs).value
                                        }
                                    );
                                }
                            });
                        });
                    }
                });

                indices = undefined;
                indexTypeHandler = undefined;
            }
        });
        
        //Sort indexData so that it is returned in alphabetical order...
        indexer.sort(indexData);
        finished(dispatcher.getResponseMessage(request,indexData));
    }
    catch (ex) { 
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }
}