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
var _ = require('underscore');
var moment = require('moment');

var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;

module.exports = function(args,finished) {
    //Validate iss client id against yotta clients store... (check to see if client exists on every interaction)
    console.log("Auth Validate: " + JSON.stringify(args,null,2));

    var request = args.req.body;
    request.pipeline = request.pipeline || [];
    request.pipeline.push("validate");

    try
    {
        //QEWD will validate the token in terms of expiry and its signature. This is an extra step to ensure that the token hasn't been modified...
        //Validate that the client id is genuine and belongs to a registered client...
        var jwt = args.session;
        var clientId = jwt.iss || undefined;
        if(typeof clientId === 'undefined') {
            jwt.authenticated = false;
            finished(dispatcher.error.forbidden(request));
        }

        var registeredClient = this.db.use('clients',clientId);
        if(!registeredClient.exists) {
            jwt.authenticated = false;
            finished(dispatcher.error.forbidden(request));
        }

        if(registeredClient.revoked === true) {
            jwt.authenticated = false;
            finished(dispatcher.error.forbidden(request));
        }

        request.registeredClientId = clientId;
        finished(dispatcher.getResponseMessage(request,request.data));
    }
    catch(ex)
    {
        finished(fisp.createServerErrorMessage(request, ex.stack || ex.toString()));
    }
}