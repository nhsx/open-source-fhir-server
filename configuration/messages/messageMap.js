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

var uuid = require('uuid');
var moment = require('moment');
var _ = require('underscore');

var messageMap = {
    request:
        {
            "/services/v1/responder/create":function(request, message, route) {
                message.operation = "RESPOND";
                request.body = message;
            },
            "/services/v1/adapters/repo/respond":function(request,message,route) {
                message.operation = "RESPOND";
                request.body = message;
            },
            "/services/v1/adapters/repo/create":function(request,message,route) {
                message.operation = "CREATE"
                request.body = message;
            },
            "/services/v1/adapters/repo/read":function(request,message,route) {
                message.operation = "READ";
                request.body = message;
            },
            "/services/v1/adapters/repo/respond":function(request,message,route) {
                message.operation = "RESPOND";
                request.body = message;
            },
            "/services/v1/adapters/repo/search":function(request,message,route) {
                message.operation = "SEARCH";
                request.resource = request.resource;
                request.body = message;
            },
            "/services/v1/repo/batch":function(request,message,route) {
                message.operation = "BATCH-READ";
                request.body= message;
            },
            "/services/v1/repo/create":function(request,message,route) {
                message.checkId = message.checkId || true;
                message.operation = "CREATE";
                request.body= message;
            },
            "/services/v1/repo/index":function(request,message,route) {
                message.operation = "INDEX";
                request.body = message;
            },
            "/services/v1/repo/index/query":function(request,message,route) {
                message.operation = "QUERY";
                request.body= message;
            },
            "/services/v1/repo/read":function(request,message,route) {
                message.operation = "READ";
                request.body = message;
            },
            "/services/v1/repo/search":function(request,message,route) {
                message.operation = "SEARCH";
                request.body = message;
            },
            "/services/v1/search":function(request, message, route) {
                message.operation = "CREATE",
                request.body = message;
            },
            "/services/v1/search/:searchSetId":function(request, message, route) {
                message.operation = "UPDATE",
                request.path = request.path.replace(':searchSetId',message.searchSetId);
                request.body = message;
            },
            "/services/v1/search/:searchSetId/add":function(request,message,route) {
                message.operation = "ADD";
                //Replace the :searchSetId with message.searchSetId
                request.path = request.path.replace(':searchSetId',message.searchSetId);
                request.body = message;
            },
            "/services/v1/search/:searchSetId/include":function(request,message,route) {
                message.operation = "INCLUDE";
                //Replace the :searchSetId with message.searchSetId
                request.path = request.path.replace(':searchSetId',message.searchSetId);
                request.body = message;
            },
            "/services/v1/search/:searchSetId/paginate/:page/:pageSize":function(request,message,route) {
                message.operation = "PAGINATE";
                //Replace the :searchSetId with message.searchSetId
                request.path = request.path.replace(':searchSetId',message.searchSetId);
                //Replace page and page size with corresponding variables in message
                request.path = request.path.replace(":page", message.data.query.page);
                request.path = request.path.replace(":pageSize", message.data.query.pageSize);
                request.body = message;
            },
            "/services/v1/search/:searchSetId/sort":function(request,message,route) {
                message.operation = "SORT";
                //Replace the :searchSetId with message.searchSetId
                request.path = request.path.replace(':searchSetId',message.searchSetId);
                request.body = message;
            },
            "/services/v1/search/results":function(request,message,route) {
                message.operation = "RESULTS";
                request.body= message;
            },
            "/services/v1/search/:searchSetId/revinclude":function(request,message,route) {
                message.operation = "REVINCLUDE";
                //Replace the :searchSetId with message.searchSetId
                request.path = request.path.replace(':searchSetId',message.searchSetId);
                request.body = message;
            },
            _baseRequest:function(route,method) {
                var request = {
                    path:route.path,
                    method:method
                }
                return request;
            },
            createRequestMessage:function(){
                var request = {
                    messageId:uuid.v4(),
                    requestId:uuid.v4(),
                    requestedOn:moment().utc().format(),
                }
                return request;
            },
            getRequestMessage:function(message,method)
            {
                method = method || "POST";

                var route = message.routes.shift();
                var request = this._baseRequest(route,method)
                //Call the request configuration handler for this route...
                this[route.path](request,message,route);
                //Return the configured request...
                return request;
            }
        },
        response:
        {
            getResponseMessage:function(request, data) {
                var response = {
                    messageId: request.messageId,
                    responseId: uuid.v4(),
                    respondedOn:moment().utc().format()
                };
                response = _.extend(response, request);
                response.data = data;
                return response;
            }
        }
  
}

module.exports = {
    messageMap
}