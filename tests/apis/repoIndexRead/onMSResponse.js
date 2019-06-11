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

var registry = {
    searchParameters: [
            {
                indexProperty:'id',
                property:'id',
                searchProperty:'_id',
                type:'string',
                indexType:'id'
            },
            {
                indexProperty:'lastUpdated',
                property:'lastUpdated',
                searchProperty:'_lastUpdated',
                type:'datetime',
                indexType:'datetime'
            },
            {
                indexProperty: 'city',
                property:'city',
                searchProperty:'address-city',
                type:'string',
                indexType:'string'
            },
            {
                indexProperty:'district',
                property:'district',
                searchProperty:'address-state',
                type:'string',
                indexType:'string'
            },
            {
                indexProperty:'postalCode',
                property:'postalCode',
                searchProperty:'address-postalcode',
                type:'string',
                indexType:'string'
            },
            {
                property:'name',
                type:'name',
                indexType:'name',
            },
            //Type: virtual parameters (as below) serve as a means to map search params onto other indicies - they are NOT indexed
            {
                property:'name',
                type:'virtual',
                searchProperty:'family'
            }, 
            {
                property:'name',
                type:'virtual',
                searchProperty:'given'
            },  
            {
                indexProperty: 'identifier',
                property:'identifier',
                searchProperty:'identifier',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty: 'tag',
                property:'tag',
                searchProperty:'_tag',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty: 'gender',
                property:'gender',
                searchProperty:'gender',
                type:'string',
                indexType:'string'
            },
            {
                indexProperty:'birthDate',
                property:'birthDate',
                searchProperty:'birthDate',
                type:'datetime',
                indexType:'datetime'
            },
            {
                indexProperty:'managingOrganization',
                property:'managingOrganization',
                type:'reference',
                indexType:'reference',
                searchProperty:'organization'
            },
            {
                indexProperty:'generalPractitioner',
                property:'generalPractitioner',
                type:'reference',
                indexType:'reference',
                searchProperty:'general-practitioner'
            }
        ],
        searchResultParameters:
        {
            _id:'id',
            _lastUpdated:'lastUpdated',
            family:'name[0].family',
            given:'name[0].given[0]',
            birthDate:'birthDate',
            gender:'gender'
        },
        searchResultParameters:
        {
            sort:{
                _id:'id',
                _lastUpdated:'lastUpdated',
                family:'name[0].family',
                given:'name[0].given[0]',
                birthDate:'birthDate',
                gender:'gender'
            },
            include:{
                'Patient:general-practitioner':{resourceType:'Practitioner',reference:'generalPractitioner'},
                'Patient:organization':{resourceType:'Organization',reference:'managingOrganization'}
            },
            revinclude:{
                'Encounter:patient':{resourceType:'Encounter',reference:'Subject',referenceType:'Patient'}
            }
        }
    }

module.exports = function(message, jwt, forward, sendBack) {
    console.log("repo Index READ");
    console.log("repo Index READ message in: " + JSON.stringify(message,null,2));

    message.req.body.messageId = uuid.v4();
    message.req.body.requestId = uuid.v4();
    message.req.body.service = "INDEX";
    message.req.body.operation = "READ"
    message.req.body.serviceMode = "standalone"
    message.req.body.pipeline = ["tests"],
    message.req.body.registry = registry;

    var path = "/services/v1/repo/index/" + message.resource + '/' + message.resourceId
    if(typeof message.indexType !== 'undefined') {
        path = path + "/" + message.indexType
    }

    var getIndexForLocalResourceRequest = {
        path: path,
        method:"POST",
        body:message.req.body
    }
    console.log("repo Index READ message out: " + JSON.stringify(getIndexForLocalResourceRequest,null,2));
    forward(getIndexForLocalResourceRequest,jwt,function(responseObj) {
        sendBack(responseObj);
    });
}
