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

var crypto = require('../../modules/crypto.js').crypto;
var dispatcher = require('../../../configuration/messaging/dispatcher.js').dispatcher;

module.exports = function(args, finished) {
    
    var request = dispatcher.createRequestMessage();

    try
    {
        var grant_type = args.req.headers['grant_type'] || undefined;
        var clientId = args.req.headers['client_id'] || undefined;
        var clientSecret = args.req.headers['client_secret'] || undefined;
        //finished(args);
        if(typeof grant_type === 'undefined' || typeof clientId === 'undefined' || typeof clientSecret === 'undefined') {
            finished(dispatcher.error.unauthorized(request));
        }
        else {
            var registeredClient = this.db.use('clients', clientId);
            if(!registeredClient.exists)
            {
                finished(dispatcher.error.unauthorized(request));
            }
            
            registeredClient = registeredClient.getDocument(true);
            if(registeredClient.revoked === true) {
                finished(dispatcher.error.unauthorized(request));
            }
            //Decrypt ciphered client secret...
            var plainTextSecret = crypto.decrypt(registeredClient.secret);
            //Compare to plain text secret...
            if(plainTextSecret !== clientSecret)
            {
                finished(dispatcher.error.unauthorized(request));
            }
            
            var jwt = args.session;
            jwt.aud = 'IAM';
            jwt.iat = moment().utc().valueOf();
            jwt.iss = clientId;
            jwt.jti = uuid.v4();
            jwt.authenticated = true;
            jwt.timeout = moment().add(48,'hours').utc().valueOf();
            
            finished({ok:true});
        }
    }
    catch(ex)
    {
        finished(dispatcher.error.serverError(request,ex.stack || ex.toString()));
    }

}