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
    Patient:{
        searchParameters: [
            {
                property:"id",
                searchProperty:"_id",
                type:"string",
                indexType:"id"
            },
            {
                property:"lastUpdated",
                searchProperty:"_lastUpdated",
                type:"datetime",
                indexType:"datetime"
            },
            {
                property:"city",
                searchProperty:"address-city",
                type:"string",
                indexType:"string"
            },
            {
                property:"district",
                searchProperty:"address-state",
                type:"string",
                indexType:"string"
            },
            {
                property:"postalCode",
                searchProperty:"address-postalcode",
                type:"string",
                indexType:"string"
            },
            {
                property:"name",
                type:"name",
                indexType:"name"
            },
            //Type: virtual parameters (as below) serve as a means to map search params onto other indicies - they are NOT indexed
            {
                property:"name",
                type:"virtual",
                searchProperty:"family"
            }, 
            {
                property:"name",
                type:"virtual",
                searchProperty:"given"
            }, 
            {
                property:"identifier",
                searchProperty:"identifier",
                type:"token",
                indexType:"token"
            },
            {
                property:"tag",
                searchProperty:"_tag",
                type:"token",
                indexType:"token"
            },
            {
                property:"gender",
                type:"string",
                indexType:"string"
            },
            {
                property:"birthDate",
                type:"datetime",
                indexType:"datetime"
            },
            {
                property:"managingOrganization",
                type:"reference",
                indexType:"reference",
                searchProperty:"organization"
            },
            {
                property:"generalPractitioner",
                type:"reference",
                indexType:"reference",
                searchProperty:"general-practitioner"
            }
        ]
    },
    Encounter:
    {
        searchParameters:[
            {
                property:"id",
                searchProperty:"_id",
                type:"string",
                indexType:"id"
            },
            {
                property:"lastUpdated",
                searchProperty:"_lastUpdated",
                type:"datetime",
                indexType:"datetime"
            },
            {
                property:"tag",
                searchProperty:"_tag",
                type:"token",
                indexType:"token"
            },
            {
                property:"class",
                searchProperty:"class",
                type:"token",
                indexType:"token"
            },
            {
                property:"condition",
                searchProperty:"diagnosis",
                type:"reference",
                indexType:"reference"
            },
            {
                property:"episodeOfCare",
                searchProperty:"episode-of-care",
                type:"reference",
                indexType:"reference"
            },
            {
                property:"identifier",
                searchProperty:"identifier",
                type:"token",
                indexType:"token"
            },
            {
                property:"location",
                searchProperty:"location",
                type:"reference",
                indexType:"reference"
            },
            {
                //This form allows complex types to be "split" into separate indexTypes... participant-type is a codeableConcept/token (type) and participant is a reference (individual)
                //The participant index handler knows where to pick out the codeable concept and reference from the participant object.
                property:"participant",
                searchProperty:["participant-type","participant"],
                type:"participant",
                indexType:["token","reference"],
                indexPropertyIndexTypes:{
                    "participant-type":"token",
                    "participant":"reference"
                }
            },
            {
                property:"partOf",
                searchProperty:"part-of",
                type:"reference",
                indexType:"reference"
            },
            {
                property:"period",
                searchProperty:"date",
                type:"period",
                indexType:"period"
            },
            {
                property:"type",
                searchProperty:"type",
                type:"codeableConcept",
                indexType:"token",
                allowMultiple:false
            },
            {
                property:"subject",
                searchProperty:"patient",
                type:"reference",
                indexType:"reference"
            },
            {
                property:"status",
                type:"string",
                indexType:"string",
                allowMultiple:false
            }
        ]
    } 
}

module.exports = function(message, jwt, forward, sendBack) {
    console.log("repo Index CREATE");
    console.log("repo Index CREATE message in: " + JSON.stringify(message,null,2));

    message.req.body.service = "INDEX";
    message.req.body.operation = "CREATE"
    message.req.body.serviceMode = "standalone"
    message.req.body.pipeline = ["tests"],
    message.req.body.registry = registry[message.req.body.data.results.resourceType];

    var createIndexForLocalResourceRequest = {
        path:"/services/v1/repo/index",
        method:"POST",
        body:message.req.body
    }
    console.log("repo Index CREATE message out: " + JSON.stringify(createIndexForLocalResourceRequest,null,2));
    forward(createIndexForLocalResourceRequest,jwt,function(responseObj) {
        sendBack(responseObj);
    });
}
