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

var registry = [
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
        indexType:"reference"
    },
    {
        property:"generalPractitioner",
        type:"reference",
        indexType:"reference"
    }
]


module.exports = function(message, jwt, forward, sendBack) {
    console.log("search UPDATE");
    console.log("search UPDATE message in: " + JSON.stringify(message,null,2));

    message.req.body.service = "SEARCH";
    message.req.body.operation = "UPDATE"
    message.req.body.serviceMode = "standalone"
    message.req.body.pipeline = ["tests"];

    var path = "/services/v1/search/" + message.searchSetId;

    var updateSearchResults = {
        path: path,
        method:"POST",
        body:message.req.body
    }
    console.log("search UPDATE message out: " + JSON.stringify(updateSearchResults,null,2));
    forward(updateSearchResults,jwt,function(responseObj) {
        sendBack(responseObj);
    });
}