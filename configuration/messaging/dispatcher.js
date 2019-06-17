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
var uuid = require('uuid');
var moment = require('moment');

var dispatcher =  {
    messageMap:
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
            message.checkId = message.checkId;
            message.operation = "CREATE"
            request.body = message;
        },
        "/services/v1/adapters/repo/delete":function(request,message,route) {
            message.operation = "DELETE"
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
        "/services/v1/adapters/repo/searchset":function(request,message,route) {
            message.operation = "SEARCHSET"; 
            request.body = message;
        },
        "/services/v1/publisher/publish":function(request,message,route) {
            message.operation = "PUBLISH";
            request.body = message;
        },
        "/services/v1/repo/batch":function(request,message,route) {
            message.operation = "BATCH-READ";
            request.body= message;
        },
        "/services/v1/repo/create":function(request,message,route) {
            message.checkId = message.checkId;
            message.operation = "CREATE";
            request.body= message;
        },
        "/services/v1/repo/delete":function(request,message,route) {
            message.operation = "DELETE";
            request.body= message;
        },
        "/services/v1/repo/index":function(request,message,route) {
            message.operation = "INDEX";
            request.body = message;
        },
        "/services/v1/repo/index/:documentId/delete":function(request,message,route) {
            message.operation = "DELETE";
            message.documentId = message.resourceId || undefined;
            message.documentType = message.resource || undefined;
            request.path = request.path.replace(':documentId',message.documentId);
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
        }
    },
    shouldForward:function(message) {
        //Check service and routes...
        if(message.serviceMode === 'standalone' || 
        _.isUndefined(message.routes) || _.isNull(message.routes) || _.isEmpty(message.routes) || message.routes.length === 0) 
        {
            return false;
        }
        
        return true;
    },
    dispatch:function(message, jwt, forward, sendBack) {
        //Should this message be forwarded?
        if(!this.shouldForward(message)) return false;
        //Get the next route...
        var route = message.routes.shift();
        //Check for valid paths...
        if(_.isUndefined(route.paths) || _.isNull(route.paths) || _.isEmpty(route.paths))
        {
            throw "Message cannot be routed as Route contains no valid paths: " + JSON.stringify(route.paths, null, 2);
        }
        //Ensure paths are an array
        if(!_.isArray(route.paths)) {
            route.paths = [route.paths];
        }
        //Ensure that there is zero or one path that requires a reply...
        var replyCount = _.filter(route.paths, function(p) {
            return !_.has(p,"awaitReply") || _.isUndefined(p.awaitReply) || p.awaitReply === "" || p.awaitReply === true 
        }).length;

        if(replyCount > 1) {
            throw "Message cannot be routed as only one route path can recieve a service reply: " + JSON.stringify(route.paths, null, 2);
        }

        //Dispatch to services which do not require a reply first...
        this._dispatchNoAwaitReply(route, message, jwt, forward);
        //Dispatch to the service which needs a reply...
        this._dispatchAwaitReply(route, message, jwt, forward, sendBack);
        //Return true to notify caller that message was routed...
        return true;
    },
    _dispatchNoAwaitReply: function(route, message, jwt, forward) {
            //Process the routes which do not require a reply...
        var routes = _.filter(route.paths, function(r) {
            return _.has(r, "awaitReply") && r.awaitReply === false;
        });

        var context = this;
        routes.forEach(function(r) {
            //Get request from map and send...
            var request = context._baseRequest(r);
            //Call the request configuration handler for this route...
            context.messageMap[r.path](request,message,r);
            //Now forward...
            console.log("No Await Reply: " + JSON.stringify(request));
            forward(request, jwt, function(responseObj) {});
        });
    },
    _dispatchAwaitReply: function(route, message, jwt, forward, sendBack) {
        //Process the route which requires a reply...
        var routes = _.filter(route.paths, function(p) {
            return !_.has(p,"awaitReply") || p.awaitReply === "" || p.awaitReply === true 
        });

        var context = this;
        routes.forEach(function(r) {
            //Get request from map and send...
            var request = context._baseRequest(r);
            //Call the request configuration handler for this route...
            context.messageMap[r.path](request,message,r);
            //Now forward...
            forward(request, jwt, function(responseObj) { sendBack(responseObj);});
        });
    },
    _baseRequest: function(route)
    {
        var request = {
            path:route.path,
            method:route.method || "POST"
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
    getResponseMessage:function(request, data) {
        var response = {
            messageId: request.messageId,
            responseId: uuid.v4(),
            respondedOn:moment().utc().format()
        };
        response = _.extend(response, request);
        response.data = data;
        return response;
    },
    error: {
        _baseError: function(request, code, severity, diagnostics, status, text) {
            var response = {
                messageId: request.messageId,
                responseId: uuid.v4(),
                respondedOn:moment().utc().format()
            };
            response = _.extend(response, request);
            response.data = {
                error:{
                    responseId: uuid.v4(),
                    requestId:request.requestId,
                    pipeline:request.pipeline,
                    serviceMode:request.serviceMode,
                    operation:request.operation,
                    requestedOn:request.requestedOn,
                    respondedOn:moment().utc().format(),
                    code:code,
                    severity:severity,
                    diagnostics:diagnostics,
                    status:status,
                    text:text
                }
            };
            return response;
        },
        badRequest: function(request, code, severity, diagnostics)
        {
            return this._baseError(request, code, severity, diagnostics, 400, 'Bad Request');
        },
        notFound: function(request, code, severity, diagnostics) 
        {
            return this._baseError(request, code, severity, diagnostics, 404, 'Not Found');
        },
        serverError: function(request, stack)
        {
            var response = {
                messageId: request.messageId,
                responseId: uuid.v4(),
                respondedOn:moment().utc().format()
            };
            response = _.extend(response, request);
            response.data = {
                error:{
                    responseId: uuid.v4(),
                    requestId:request.requestId,
                    pipeline:request.pipeline,
                    serviceMode:request.serviceMode,
                    operation:request.operation,
                    requestedOn:request.requestedOn,
                    respondedOn:moment().utc().format(),
                    status:500,
                    text:'Internal Server Error',
                    stack: stack
                }
            };
            return response;
        }
    }
}

module.exports = {
    dispatcher
}