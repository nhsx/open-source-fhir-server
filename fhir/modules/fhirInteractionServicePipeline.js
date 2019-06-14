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
var serverRegistry = require('../registries/server.js').server;
var resourceRegistry = require('../registries/resources.js');
var dispatcher = require('../../configuration/messaging/dispatcher.js').dispatcher;

var fhirInteractionServicePipeline = {
    createRequestMessage: function() {
        return dispatcher.createRequestMessage();
    },
    createServerErrorMessage: function(request, stack) {
        return dispatcher.error.serverError(request, stack);
    },
    _baseOperation: function(fhirRequest, request) {
        //Attach server registry...
        request.server = serverRegistry;
    },
    create: function(fhirRequest, request){
        this._baseOperation(fhirRequest, request);
        
        request.serviceMode = "pipeline";
        request.operation = "CREATE";
        request.pipeline = ["fhir"];
        request.routes = [
            {
                paths:{path: "/services/v1/adapters/repo/create"}
            },
            {
                paths:{path: "/services/v1/repo/create"}
            },
            {
                paths: {path: "/services/v1/repo/index"}
            },
            {
                paths:[
                    {path:"/services/v1/publisher/publish",awaitReply:false},
                    {path: "/services/v1/adapters/repo/read"}
                ]
            },
            {
                paths:{path: "/services/v1/repo/read"}
            },
            {
                paths:{path: "/services/v1/adapters/repo/respond"},
            },
            {
                paths:{path: "/services/v1/responder/create"},
            }
        ];

        //async path {path:"/services/v1/audit/create", awaitReply:"false"}
        //async path {path:"/services/v1/version/create" awaitReply:"false"}

        request.data = fhirRequest.req.body;
        //Attach the registry entry for this resource...
        request.registry = resourceRegistry.resources[fhirRequest.resource];
    }, 
    read: function(fhirRequest, request) {
        this._baseOperation(fhirRequest, request);

        request.serviceMode = "pipeline";
        request.pipeline = ["fhir"];

        if(_.has(fhirRequest, "resourceId")) {
            //This is straightforward read...
            request.operation = "READ";
            request.routes = [
                {paths: {path: "/services/v1/adapters/repo/read"}},
                {paths: {path: "/services/v1/repo/read"}},
                {paths: {path: "/services/v1/adapters/repo/respond"}},
                {paths: {path: "/services/v1/responder/create"}}
            ];
            request.resource = fhirRequest.resource;
            request.resourceId = fhirRequest.resourceId;
        } else if(!_.isEmpty(fhirRequest.req.query)) {
            //Search
            request.operation = "SEARCH";
            request.routes = [
                {paths:{path: "/services/v1/adapters/repo/search"}},
                {paths:{path: "/services/v1/repo/search"}},
                {paths:{path: "/services/v1/repo/index/query"}},
                {paths:{path: "/services/v1/search/results"}},
                {paths:{path: "/services/v1/repo/batch"}},
                {paths:{path: "/services/v1/search"}},
                {paths:{path: "/services/v1/search/:searchSetId/sort"}},
                {paths:{path: "/services/v1/search/:searchSetId"}},
                {paths:{path: "/services/v1/search/:searchSetId/paginate/:page/:pageSize"}},
                {paths:{path: "/services/v1/search/:searchSetId/include"}},
                {paths:{path: "/services/v1/repo/index/query"}},
                {paths:{path: "/services/v1/search/results"}},
                {paths:{path: "/services/v1/repo/batch"}},
                {paths:{path: "/services/v1/search/:searchSetId/add"}},
                {paths:{path: "/services/v1/adapters/repo/respond"}},
                {paths:{path: "/services/v1/responder/create"}}
            ]
            request.data = fhirRequest.req.query;
            var resource = fhirRequest.resource;
            //Attach the registry entry for this resource...
            request.registry = resourceRegistry.resources[resource];
            request.resourceType = resource;
        } else {
            //Throw exception - unknown/unsupported READ
            throw dispatcher.error.serverError("Unsupported READ operation");
        }
    },
    update: function(fhirRequest, request)
    {
        //Delete everything first, then create it again...
        //TODO: async path {path:"/services/v1/audit/create", awaitReply:"false"}
        //TODO: async path {path:"/services/v1/version/create" awaitReply:"false"}
        this._baseOperation(fhirRequest, request);
        
        request.serviceMode = "pipeline";
        request.operation = "UPDATE";
        request.pipeline = ["fhir"];
        request.routes = [
            {
                paths:{path: "/services/v1/adapters/repo/delete"}
            },
            {
                paths:{path: "/services/v1/repo/delete"}
            },
            {
                paths:{path: "/services/v1/repo/index/:documentId/delete"}
            },
            {
                paths:{path: "/services/v1/adapters/repo/create"}
            },
            {
                paths:{path: "/services/v1/repo/create"}
            },
            {
                paths:[
                        {path:"/services/v1/publisher/publish",awaitReply:false},
                        {path: "/services/v1/repo/index"}
                    ]
            },
            {
                paths:{path: "/services/v1/adapters/repo/read"}
            },
            {
                paths:{path: "/services/v1/repo/read"}
            },
            {
                paths:{path: "/services/v1/adapters/repo/respond"},
            },
            {
                paths:{path: "/services/v1/responder/create"},
            }
        ];
        request.resource = fhirRequest.resource;
        request.resourceId = fhirRequest.resourceId;
        request.data = fhirRequest.req.body;
        //Attach the registry entry for this resource...
        request.registry = resourceRegistry.resources[fhirRequest.resource];
    },
    delete: function(fhirRequest, request) {
        this._baseOperation(fhirRequest, request);

        //TODO: async path {path:"/services/v1/audit/create", awaitReply:"false"}
        request.serviceMode = "pipeline";
        request.operation = "DELETE";
        request.pipeline = ["fhir"];
        request.routes = [
            {
                paths:{path: "/services/v1/adapters/repo/delete"}
            },
            {
                paths:{path: "/services/v1/repo/delete"}
            },
            {
                paths:{path: "/services/v1/repo/index/:documentId/delete"}
            },
            {
                paths:{path: "/services/v1/adapters/repo/respond"},
            },
            {
                paths:{path: "/services/v1/responder/create"},
            }
        ];
        request.resource = fhirRequest.resource;
        request.resourceId = fhirRequest.resourceId;
        request.data = fhirRequest.req.body;
        //Attach the registry entry for this resource...
        request.registry = resourceRegistry.resources[fhirRequest.resource];
    }
}

module.exports = {
    fhirInteractionServicePipeline
}