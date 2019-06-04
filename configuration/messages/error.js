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

var error = {
    _baseError: function(request, code, severity, diagnostics, status, text) {
        return {
            error:
            {
                responseId: uuid.v4(),
                requestId:request.requestId,
                pipeline:request.pipeline,
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
        return {
            error: {
                responseId: uuid.v4(),
                requestId:request.requestId,
                pipeline:request.pipeline,
                operation:request.operation,
                requestedOn: request.requestedOn,
                respondedOn: moment().utc().format(),
                status:500,
                text:'Internal Server Error',
                stack: stack
            }
        }
    }
}

module.exports = {
    error
}