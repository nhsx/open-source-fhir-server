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

var fhirInteractionServicePipeline = {
    _baseOperation: function(fhirRequest, request) {
        //TODO: Attach error, messageMap and response
        //Attach server registry...
        request.server = serverRegistry;
    },
    create: function(fhirRequest, request){
        this._baseOperation(fhirRequest, request);
        
        request.serviceMode = "pipeline";
        request.operation = "CREATE";
        request.pipeline = ["fhir"];
        request.routes = [
           {path: "/services/v1/adapters/repo/create"},
           {path: "/services/v1/repo/create"},
           {path: "/services/v1/repo/index"},
           {path: "/services/v1/adapters/repo/read"},
           {path: "/services/v1/repo/read"},
           {path: "/services/v1/adapters/repo/respond"},
           {path: "/services/v1/responder/create"}
        ];
        //TODO: Extend routes to include subscription pipeline
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
                {path: "/services/v1/adapters/repo/read"},
                {path: "/services/v1/repo/read"},
                {path: "/services/v1/adapters/repo/respond"},
                {path: "/services/v1/responder/create"}
            ];
            request.resource = fhirRequest.resource;
            request.resourceId = fhirRequest.resourceId;
        } else if(!_.isEmpty(fhirRequest.req.query)) {
            //Search
            request.operation = "SEARCH";
            request.routes = [
                {path: "/services/v1/adapters/repo/search"},
                {path: "/services/v1/repo/search"},
                {path: "/services/v1/repo/index/query"},
                {path: "/services/v1/search/results"},
                {path: "/services/v1/repo/batch"},
                {path: "/services/v1/search"},
                {path: "/services/v1/search/:searchSetId/sort"},
                {path: "/services/v1/search/:searchSetId"},
                {path: "/services/v1/search/:searchSetId/paginate/:page/:pageSize"},
                {path: "/services/v1/search/:searchSetId/include"},
                {path: "/services/v1/repo/index/query"},
                {path: "/services/v1/search/results"},
                {path: "/services/v1/repo/batch"},
                {path: "/services/v1/search/:searchSetId/add"},
                {path: "/services/v1/adapters/repo/respond"},
                {path: "/services/v1/responder/create"}
            ]
            request.data = fhirRequest.req.query;
            var resource = fhirRequest.resource;
            //Attach the registry entry for this resource...
            request.registry = resourceRegistry.resources[resource];
            request.resourceType = resource;
        } else {
            //Throw exception - unknown/unsupported READ
            throw errorMessage.serverError("Unsupported READ operation");
        }
    },
    update:{},
    delete:{}
}

module.exports = {
    fhirInteractionServicePipeline
}