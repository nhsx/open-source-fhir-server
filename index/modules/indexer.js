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

var moment = require('moment');
var _ = require('underscore');

var indexer = 
{
    indexers:
    {
        _baseIndexer: function(data) {
            var index = {};
            index.global = data.global;
            index.subscripts = [];
            
            var entry = {};
            entry[data.indexPropertyName] = data.indexFrom;
            index.subscripts.push(entry);
    
            return [index];
        },
        datetime: function(data) {
            console.log('Datetime Indexer: ' + JSON.stringify(data,null,2));
            //Create two entries: 1) one just the date portion of the string and 2) a datetime (using 00:00:00 if not present)
            var index = {};
            index.global = data.global;
            index.subscripts = [];

            var dateValue = data.indexFrom;
            var dateString = dateValue.includes('T') ? dateValue.substring(0,dateValue.indexOf('T')) : dateValue;
            var dateTimeString = dateValue.includes('T') ? dateValue : dateValue + 'T00:00:00';

            var dateEntry = {};
            dateEntry[data.indexPropertyName + 'Date'] = moment(dateString).valueOf().toString();

            var dateTimeEntry = {};
            dateTimeEntry[data.indexPropertyName + 'DateTime'] = moment(dateTimeString).valueOf().toString();

            index.subscripts.push(
                dateEntry,
                dateTimeEntry
            )

            return [index];
        },
        name: function(data) {
            console.log('Name Indexer: ' + JSON.stringify(data,null,2));
    
            var index = {};
            index.global = data.global;
            index.subscripts = [];
            //Only do this if indexFrom is a name object...
            if(typeof data.indexFrom === 'object')
            {
                //Given is an array... for every given name, create an index entry
                data.indexFrom.given.forEach(function(givenName) {
                    index.subscripts.push(
                        {
                            'name': givenName + ' ' + data.indexFrom.family
                        }
                    )
                });
            }

            return [index];
        },
        period: function(data) {
            console.log('Period Indexer: ' + JSON.stringify(data,null,2));

            var index = {};
            index.global = data.global;
            index.subscripts = [];
            //Only do this if indexFrom is a period object...
            if(typeof data.indexFrom === 'object')
            {
                var dateStartValue = data.indexFrom.start;
                var dateStartString = dateStartValue.includes('T') ? dateStartValue.substring(0,dateStartValue.indexOf('T')) : dateStartValue;
                var dateStartTimeString = dateStartValue.includes('T') ? dateStartValue : dateStartValue + 'T00:00:00';

                var dateStartEntry = {};
                dateStartEntry['startDate'] = moment(dateStartString).valueOf();
                var dateStartTimeEntry = {};
                dateStartTimeEntry['startDateTime'] = moment(dateStartTimeString).valueOf();

                var entry = {};
                entry[data.indexPropertyName] = [
                    dateStartEntry,
                    dateStartTimeEntry
                ]

                //Default to end date of 31/12/9999 if no end date is provided
                var dateEndValue = data.indexFrom.end || "9999-12-31T23:59:59";
                var dateEndString = dateEndValue.includes('T') ? dateEndValue.substring(0,dateEndValue.indexOf('T')) : dateEndValue;
                var dateEndTimeString = dateEndValue.includes('T') ? dateEndValue : dateEndValue + 'T23:59:59';

                var dateEndEntry = {};
                dateEndEntry['endDate'] = moment(dateEndString).valueOf();
                var dateEndTimeEntry = {};
                dateEndTimeEntry['endDateTime'] = moment(dateEndTimeString).valueOf();

                entry[data.indexPropertyName].push(dateEndEntry);
                entry[data.indexPropertyName].push(dateEndTimeEntry);
               
                index.subscripts.push(entry);
            }
        
            return [index];
        },
        number: function(data) {
            console.log('Number Indexer: ' + JSON.stringify(data,null,2));
            return this.indexers._baseIndexer(data);
        },
        reference: function(data) {
            console.log('Reference Indexer: ' + JSON.stringify(data,null,2));
    
            var index = {};
            index.global = data.global;
            index.subscripts = [];
            //Only do this if data.indexFrom is a reference object...
            if(typeof data.indexFrom === 'object' && data.indexFrom.reference)
            {
                var reference = data.indexFrom.reference;
                if(reference.startsWith('http')) {
                    //URL
                    var urlEntry = {}
                    urlEntry[data.indexPropertyName] = reference;
                    index.subscripts.push(urlEntry);
                }
                var referenceComponents = reference.split('/');
                //Type and logical Id length-2 + Logical Id = length-1;
                //Logical Id = length-1
                var typeAndLogicalId = referenceComponents[referenceComponents.length-2] + '/' + referenceComponents[referenceComponents.length-1];
                var typeAndLogicalIdEntry  = {};
                typeAndLogicalIdEntry[data.indexPropertyName] = typeAndLogicalId;
                index.subscripts.push(typeAndLogicalIdEntry);
            
                var logicalId = referenceComponents[referenceComponents.length-1];
                var logicalIdEntry = {};
                logicalIdEntry[data.indexPropertyName] = logicalId;
                index.subscripts.push(logicalIdEntry);
            }
            //For reference identifiers...
            if(typeof data.indexFrom === 'object' && data.indexFrom.identifier)
            {
                var referencedResourceIdentifierEntry = {};
                referencedResourceIdentifierEntry[data.indexPropertyName] = data.indexFrom.identifier.system + '|' + data.indexFrom.identifier.value; 
                index.subscripts.push(referencedResourceIdentifierEntry)
            }
    
            return [index];
        },
        string: function(data) {
            console.log('String Indexer: ' + JSON.stringify(data,null,2));
            return this.indexers._baseIndexer(data);
        },
        token: function(data) {
            console.log('Token Indexer: ' + JSON.stringify(data,null,2));
    
            var index = {};
            index.global = data.global;
            index.subscripts = [];
            //Context check STOPS references from being indexed as an identifer for a resource... e.g. subject.identifier (wrong)
            if(!data.context.startsWith('identifier') && typeof data.indexFrom === 'object')
            {
                var tokenData = {
                    propertyName: data.propertyName,
                    indexPropertyName: data.indexPropertyName,
                    system: data.indexFrom.system || ''
                };

                tokenData[this._tokenTargetPropertyMap[data.propertyName]] = data.indexFrom[this._tokenTargetPropertyMap[data.propertyName]];

                var entry = this.indexers._tokenizer.call(this, tokenData);
                index.subscripts.push(entry);
            }
    
            return [index];
        },
        codeableConcept: function(data) {
            console.log('Codeable Concepts Indexer: ' + JSON.stringify(data,null,2));
    
            var index = {};
            index.global = data.global;
            index.subscripts = [];
            //Context check STOPS composite objects in complex types from being indexed as an tokens for a resource... e.g. participant[].type
            if(!data.context.startsWith('participant') && typeof data.indexFrom === 'object')
            {
                //Needs to check for presence of coding array (codeable concept)
                if(typeof data.indexFrom.coding !== 'undefined' && data.indexFrom.coding.length > 0)
                {
                    var context = this;
                    data.indexFrom.coding.forEach(function(codeableConcept) {

                        var tokenData = {
                            propertyName: data.propertyName,
                            indexPropertyName: data.indexPropertyName,
                            code:codeableConcept.code,
                            system:codeableConcept.system
                        };

                        var entry = context.indexers._tokenizer.call(context, tokenData);
                        index.subscripts.push(entry); 
                    })
                } 
            }
    
            return [index];
        },
        participant: function(data) {
            console.log('Participant Indexer: ' + JSON.stringify(data,null,2));
            //Participant has to be split across two indices: a codeable concept (participant-type) and a reference (participant).
            var indexes = [];
            //This check will ensure that the indexing is only done once
            if(data.indexFrom.type) {
                //Tokenize the codeable concept first...
                if(data.indexFrom.type.length > 0)
                {
                    var context = this;

                    data.indexFrom.type.forEach(function(type) {
                        
                        var index = {};
                        index.subscripts = [];
                        index.global = data.global[0]; //Token
            
                        type.coding.forEach(function(codeableConcept) {
    
                            var tokenData = {
                                propertyName: "type",
                                indexPropertyName: data.indexPropertyName[0], //participant-type
                                code:codeableConcept.code,
                                system:codeableConcept.system
                            };
    
                            var entry = context.indexers._tokenizer.call(context, tokenData);
                            index.subscripts.push(entry); 
                        })

                        indexes.push(index);
                        
                    });
                }
                //Now the individual...
                if(data.indexFrom.individual) 
                {
                    var referenceData = {
                        resourceType: data.resourceType,
                        propertyName: "individual",
                        global: data.global[1],//reference
                        indexFrom: data.indexFrom.individual,
                        indexPropertyName: data.indexPropertyName[1] //participant
                    }
                    //Palm this off to reference handler...
                    var reference = this.indexers.reference.call(this, referenceData);
                    indexes.push(reference[0]);
                }

            }
            return indexes 
        },
        uri: function(data) {
            console.log('URI Indexer: ' + JSON.stringify(data,null,2));
            return this.indexers._baseIndexer(data);
        },
        _tokenizer: function(data) {
            //data == data.indexPropertyName, data.propertyName, data.system, data.code/value
            //If no system, then 2 entries |code, code (means code without a system or where system is implicit, e.g. gender)
            //If system, then 3 entries system|code, system|, code
            var tokenSystem = data.system;
            var tokenCode = data[this._tokenTargetPropertyMap[data.propertyName]]; 
            
            var tokenValue = {};
            var tokenValueName = this._tokenTargetPropertyMap[data.propertyName];
            tokenValue[tokenValueName] = tokenCode;

            var entry = {}, systemlessTokenValue = {}, systemValue = {}, textValue = {};

            if(tokenSystem === '')
            {
                systemlessTokenValue[this._tokenTargetPropertyMap[data.propertyName]] = '|' + tokenCode;
                systemValue.system = '|';
                entry[data.indexPropertyName] = [
                    tokenValue,
                    systemValue,
                    systemlessTokenValue
                ];
            } 
            else 
            {
                systemValue.system = tokenSystem + '|';
                textValue.text = tokenSystem + '|' + tokenCode;

                entry[data.indexPropertyName] = [
                    tokenValue,
                    systemValue,
                    textValue
                ];
            }

            return entry;
        }
    },
    resolvers:{
        _baseResolver: function(data) {
            console.log('Base Resolver: ' + JSON.stringify(data,null,2));
            var path = {};
            var baseResolverPath = data.documentType.toLowerCase() + ',' + data.indexedProperty;
            path.paths = [baseResolverPath];
            return path;
        },
        id: function(data) {
            console.log('ID Resolver: ' + JSON.stringify(data,null,2));
            return this.resolvers._baseResolver(data);    
        },
        datetime: function(data) {
            console.log('Datetime Resolver: ' + JSON.stringify(data,null,2));
            //Base resolver will give us datetime node - need to append date and dateTime...
            var path = this.resolvers._baseResolver(data);
            var basePath = path.paths[0];
            path.paths[0] = basePath + 'Date';
            path.paths[1] = basePath + 'DateTime';
            return path;
        },
        period: function(data) {
            console.log('Period Resolver: ' + JSON.stringify(data,null,2));
            //Start, End
            var basePath = data.documentType.toLowerCase() + ',' + data.indexedProperty;//e.g. encounter,date
            //First path is start date...
            var startDate = basePath + ',startDate';
            //Second is start datetime
            var startDateTime = basePath + ',startDateTime';
            //Third path is end date...
            var endDate = basePath + ',endDate';
            //Fourth path is end datetime...
            var endDateTime = basePath + ',endDateTime';
            //Push each path into paths array
            var path = {}
            path.paths = [];
            path.paths.push(startDate);
            path.paths.push(startDateTime);
            path.paths.push(endDate);
            path.paths.push(endDateTime)
            //return path;
            return path;
        },
        name: function(data) {
            console.log('Name Resolver: ' + JSON.stringify(data,null,2));
            //Paths must be Given, Family and Name (baseResolver will return name)...
            var path = this.resolvers._baseResolver(data);
            //Add paths for Given and Family...
            path.paths.push(data.documentType.toLowerCase() + ',given');
            path.paths.push(data.documentType.toLowerCase() + ',family');
            //return path;
            return path;
        },
        number: function(data) {
            console.log('Number Resolver: ' + JSON.stringify(data,null,2));
            return this.resolvers._baseResolver(data);
        },
        reference: function(data) {
            console.log('Reference Resolver: ' + JSON.stringify(data,null,2));
            return this.resolvers._baseResolver(data);
        },
        string: function(data) {
            console.log('String Resolver: ' + JSON.stringify(data,null,2));
            return this.resolvers._baseResolver(data);
        },
        token: function(data) {
            console.log('Token Resolver: ' + JSON.stringify(data,null,2));
            //Code/Value, System, Text
            var path = {}
            var basePath = data.documentType.toLowerCase() + ',' + data.indexedProperty;
            //First path is either code or value depending on indexedProperty...
            var tokenValue = this._tokenTargetPropertyMap[data.indexedProperty];
            var tokenValuePath = basePath + ',' + tokenValue;
            //Second Path is system...
            var systemPath = basePath + ',system';
            //Final path is text...
            var textPath = basePath + ',text';
            //Replace the path.paths array with a new, correct one
            path.paths = [];
            path.paths.push(tokenValuePath);
            path.paths.push(systemPath);
            path.paths.push(textPath);
            //return path;
            return path;
        },
        uri: function(data) {
            console.log('URI Resolver: ' + JSON.stringify(data,null,2));
            return this.resolvers._baseResolver(data);
        }
    },
    _tokenTargetPropertyMap: 
    {
        identifier:'value',
        tag:'code',
        _tag:'code',
        type:'code',
        class:'code',
        code:'code',
        category:'code',
        "participant-type":'code'
    },
    sort: function(indexData)
    {
        indexData.indices.sort(function(a, b) {
            if(a.indexType.toUpperCase() < b.indexType.toUpperCase())
            {
                return -1;
            } else if(a.indexType.toUpperCase() > b.indexType.toUpperCase()) {
                return 1;
            } else {
                if(a.path[1].toUpperCase() < b.path[1].toUpperCase())
                {
                    return -1;
                } else if (a.path[1].toUpperCase() > b.path[1].toUpperCase()) {
                    return 1;
                } else {
                    if(a.path[2].toUpperCase() < b.path[2].toUpperCase())
                    {
                        return -1;
                    } else if (a.path[2].toUpperCase() > b.path[2].toUpperCase()) {
                        return 1;
                    } else {
                        return 0; //These two items are completely identical (as far as sorting is concerned)
                    }
                }
            }
        });
    }
}

module.exports = {
    indexer
}