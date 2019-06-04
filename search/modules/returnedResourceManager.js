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
var traverse = require('traverse');

var returnedResourceManager = {
    _getSortFunctions:function(registry, parameters)
    {
        var sortFunctions = [];
        parameters.forEach(function(parameter) {
            var path = registry.searchResultParameters[parameter.name];
            var f = new Function('entry', 'return entry.resource.' + path);
            sortFunctions.push(f);
        });
        return sortFunctions;
    },
    sort:function(registry, searchSet, parameters) {
        var sortFunctions = this._getSortFunctions(registry, parameters);
        var sorted = searchSet.entry;
        var i = 0;
        sortFunctions.forEach(function(f) {
            sorted = _.sortBy(sorted, f);
            var param = parameters[i];
            if(param.direction === "desc") {
                sorted = sorted.reverse();
            }
            i++;
        });
        searchSet.entry = sorted;
        return searchSet; 
    },
    paginate: 
    {        
        rangeStart:function(page) {
            return parseInt(page) === 1 ? parseInt(page)-1 : parseInt(page);
        },
        rangeEnd:function(page,pageSize) {
            return this.rangeStart(page)+parseInt(pageSize);
        },
        firstPage:function() {
            return 1;
        },
        previousPage:function(page) {
            return this.firstPage() === parseInt(page) ? page : parseInt(page)-1 ;
        },
        nextPage:function(searchSet, page, pageSize) {
            return this.morePages(searchSet, page, pageSize) === true ? parseInt(page) + 1 : page;
        },
        lastPage:function(searchSet, pageSize) {
            return Math.ceil(searchSet.entry.length/parseInt(pageSize));
        },
        morePages:function(searchSet, page, pageSize) {
            return parseInt(page) < this.lastPage(searchSet, parseInt(pageSize));
        },
        trim:function(searchSet, page, pageSize) {
            var entries = searchSet.entry;
            
            var rangeStart = this.rangeStart(page);
            var rangeEnd = this.rangeEnd(page,pageSize)

            console.log("RangeStart: " + rangeStart);
            console.log("RangeEnd: " + rangeEnd);
    
            searchSet.entry = entries.slice(rangeStart,rangeEnd);
            
            return searchSet;
        }
    },
    includes:
    {
        fetch:function(registry, searchset, includes, revincludes) {
            var referenceQueries = [];
            
            var incs = this.include.getReferencesToInclude(registry,searchset,includes);
            incs.forEach(function(inc) {
                referenceQueries.push(inc);
            });

            var revs = this.revinclude.getReferencesToInclude(registry,searchset,revincludes);
            revs.forEach(function(rev) {
                referenceQueries.push(rev);
            });

            return referenceQueries;
        },
        include: 
        {
            getReferencesToInclude:function(registry,searchSet,includes) {
                var queries = [];
                includes.forEach(function(include) {
                    var incParameter = registry.searchResultParameters.include[include] || undefined;
                    //property  e.g. generalPractitioner
                    if(typeof incParameter !== 'undefined') {
                        searchSet.entry.forEach(function(entry) {
                            if(traverse(entry.resource).has([incParameter.reference]))
                            {
                                var referencedResourceId = entry.resource[incParameter.reference].reference.split("/")[1];
                                var query = {
                                    documentType:incParameter.resourceType,
                                    parameters: [
                                        {
                                            indexType:"id",
                                            documentType:incParameter.resourceType.toLowerCase(),
                                            node:"id",
                                            value: referencedResourceId
                                        }
                                    ]
                                }
                                queries.push(query);
                            }
                        });
                    }
                });
                return queries;
            }
        },
        revinclude:
        {
            getReferencesToInclude:function(registry,searchSet,includes) {
                var queries = [];
                includes.forEach(function(include) {
                    //include will be string in format "xxxx:xxxx"
                    //Fetch the revinclude parameter from the registry...
                    var revParameter = registry.searchResultParameters.revinclude[include];
                    //Using revParameter.reference and the resource id, extract a list of references from the search set...
                    var references = _.map(searchSet.entry, function(entry) { 
                        return revParameter.referenceType + "/" + entry.resource.id || revParameter.reference + "/" + entry.resource.id
                    });
                    references.forEach(function(reference) {
                        var query = {
                            documentType:revParameter.resourceType,
                            parameters: [
                                {
                                    indexType:"reference",
                                    documentType:revParameter.resourceType.toLowerCase(),
                                    node:revParameter.reference.toLowerCase(),
                                    value:reference
                                }
                            ]
                        }
                        queries.push(query);
                    });
                });
                return queries;
            }
        }
    }
    
}

module.exports = {
    returnedResourceManager
}