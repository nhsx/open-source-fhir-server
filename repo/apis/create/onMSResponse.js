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

var messageMap = require('../../../configuration/messages/messageMap.js').messageMap;
//forward to index query
//which in turns forward to search query (results) 
//which in turns forwards to batch
module.exports = function(message, jwt, forward, sendBack) {
    console.log("repo CREATE message in: " + JSON.stringify(message,null,2));
    //This service can operate in both pipeline and standalone modes...
    if(message.serviceMode === 'standalone' || message.routes.length === 0) return false;
    //Forward to index service so that the resource can be indexed...NOTE: the receiving service is expected to be able to handle this request but it could easily be mocked or even a log service which simply stores/forwards...
    var indexCreateRequest = messageMap.request.getRequestMessage(message);
    console.log("repo CREATE message out: " + JSON.stringify(indexCreateRequest,null,2));
    forward(indexCreateRequest,jwt,function(responseObj) {
        sendBack(responseObj);
    });
}