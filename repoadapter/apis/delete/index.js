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


var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;

module.exports = function(args, finished) {
    console.log("REPO ADAPTER DELETE: " + JSON.stringify(args));
    //Simply extract the message body from args and let onMSResponse forward the message do the local repo services...
    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("repoadapter");

    try
    {
        if(typeof request.registry === 'undefined') {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Invalid Resource Type')); 
        }

        if(typeof request.data === 'undefined') {
            finished(dispatcher.error.badRequest(request,'processing', 'fatal', 'Resource cannot be empty or undefined')); 
        }

        finished(dispatcher.getResponseMessage(request,request.data));
    } 
    catch(ex) {
        finished(dispatcher.error.serverError(request, ex.stack || ex.toString()));
    }
}