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
var meta = require('../modules/meta.js').meta;

var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;

module.exports = function(args, finished) {

    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("capability");

    try
    {
        var server = request.server;
        if(typeof server === 'undefined' || server === '' || _.isEmpty(server)) {
          finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Server configuration is not available'));
        }

        var registry = request.registry || undefined;
        if(typeof registry === 'undefined') {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Unable to retrieve capability statement: resource configuration is not available'));  
        }

        //Fetch the local repo server...
        var localRepo = _.find(server.sources, function(source) {
            return source.isLocal === true;
        });
        //Declare variable to return statement...
        var metadata;
        //Check if there is a cached capability statement...
        var cached = this.db.use('capability');
        if(cached.exists) {
            metadata = dispatcher.parse(cached.$(localRepo.target).value);
        } else {
            //Generate n' cache...
            metadata = meta.CapabilityStatement;
            //Set header details...
            metadata.software.version = server.version;
            metadata.implementation.url = server.url;
            metadata.implementationGuide.push(server.documentation);
            //Configure the resource (details)...
            var keys = _.keys(registry);
            for(var i=0;i<keys.length;i++)
            {
                var resourceType = keys[i]
                var resourceRegistry = registry[resourceType];
                var resourceMeta = meta[resourceType];
                if(typeof resourceMeta !== 'undefined')
                {
                    var resourceInteractions = _.map(resourceMeta.interaction,function(interaction) {
                        return {code:interaction};
                    });

                    var searchParams = _.map(resourceRegistry.searchParameters, function(searchParameter) {
                        var parameterMetaData = resourceMeta[searchParameter.searchProperty];
                        var searchParam = {};
                        if(typeof parameterMetaData !== 'undefined') {
                            searchParam = {
                                name:searchParameter.searchProperty,
                                type:parameterMetaData.type || searchParameter.type,
                                documentation:parameterMetaData.documentation
                            }
                        } else {
                            searchParam = {
                                name:searchParameter.searchProperty,
                                type:'No search parameter type information available',
                                documentation:'No documentation available'
                            }
                        }
                        return searchParam;
                    })

                    var searchIncludes = [];
                    if(!_.isEmpty(resourceRegistry.searchResultParameters.include)){
                        var includeKeys = _.keys(resourceRegistry.searchResultParameters.include)
                        for(var j=0;j<includeKeys.length;j++)
                        {
                            searchIncludes.push(includeKeys[j]);
                        }
                    }
                    if(!_.isEmpty(resourceRegistry.searchResultParameters.include)){
                        var includeKeys = _.keys(resourceRegistry.searchResultParameters.revinclude)
                        for(var j=0;j<includeKeys.length;j++)
                        {
                            searchIncludes.push(includeKeys[j]);
                        }
                    }

                    var resource = {
                        type:resourceType,
                        profile:{
                            reference: server.resourceProfileBase + resourceType + '-' + server.resourceProfileVersion
                        },
                        interaction:resourceInteractions,
                        conditionalUpdate: false,
                        searchIncludes:searchIncludes,
                        searchParam:searchParams
                    }

                    metadata.rest[0].resource.push(resource);
                }

                //Persist the capability statement...
                cached.$(localRepo.target).value = dispatcher.stringify(metadata);
            }
        }

        finished(dispatcher.getResponseMessage(request, metadata));
    }
    catch(ex)
    {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }
}