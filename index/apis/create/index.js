var traverse = require('traverse');

var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;
var indexer = require('../../modules/indexer.js').indexer;

function isEmptyObject(obj) {
    for (var {} in obj) {
      return false;
    }
    return true;
  }

function isInt(value) {
    return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
}

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
        resource = traverse(resource).map(function() {
            if(this.key === 'extension') this.remove();
        });

        var db = this.db;
        var indices;
        var indexTypeHandler;
        var isIndexable = false;
        var indexed = [];

        traverse(resource).map(function(node) {
            if(!Array.isArray(node)) {
                var fullPath = this.path.toString();
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
                                        indexPropertyName: registryEntry.indexProperty || registryEntry.searchProperty || registryEntry.property,
                                        context: fullPath
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
    
                                    var idx = db.use(resource.resourceType.toLowerCase() + index.global);
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