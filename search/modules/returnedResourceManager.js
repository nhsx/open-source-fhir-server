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
    _sortFunctions: [],
    _getSortFunctions:function(registry, parameters)
    {
        var sortFunctions = [];
        parameters.forEach(function(parameter) {
            var path = registry.searchResultParameters.sort[parameter.name];
            var f = new Function('entry', 'return entry.resource.' + path);
            sortFunctions.push(f);
        });
        return sortFunctions;
    },
    sort:function(registry, searchSet, parameters) {
        var sortFunctions = this._getSortFunctions(registry, parameters);
        var sorted = searchSet.entry;
        for(var i=0;i<sortFunctions.length;i++)
        {
            var f = sortFunctions[i];
            sorted = _.sortBy(sorted, f);
            var param = parameters[i];
            if(param.direction === "desc") {
                sorted = sorted.reverse();
            }
        }
        searchSet.entry = sorted;
        return searchSet; 
    },
    paginate: 
    {        
        range:function(page,pageSize) {
            page = parseInt(page);
            pageSize = parseInt(pageSize);
            var range = {start:0,end:0};

            if(page > 1)
            {
               range.start = (page*pageSize)-pageSize;
            }
            range.end = range.start+pageSize

            return range;
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
            var range = this.range(page,pageSize);

            searchSet.entry = entries.slice(range.start,range.end);
            
            return searchSet;
        },
        attachLinks:function(searchSet, query, server) {
            var isPaged = (query.pageSize !== "*");
            var pageSize = isPaged ? query.pageSize : searchSet.total.toString();
            var baseUrl = server.url + "?_getpages=" + searchSet.id + "&_count=" + pageSize + "&";  
            //If this is a paged result set...
            if(isPaged) {
                searchSet.link.push(this._getLink("first",baseUrl,"1"));
                searchSet.link.push(this._getLink("next",baseUrl,query.next));
                searchSet.link.push(this._getLink("previous",baseUrl,query.previous));
                searchSet.link.push(this._getLink("last",baseUrl,query.last));
            }
        },
        _getLink:function(relation,baseUrl,offset) {
            return {
                relation:relation,
                url:baseUrl + "_getpagesoffset=" + offset
            }
        }
    },
    includes:
    {
        rebuild(searchSet, query) {
            //Rebuilds list of includes/revincludes from a persisted searchset (if necessary)...
            if(typeof query.includes === 'undefined') 
            {
                query.includes = [];
                query.revincludes = [];

                var queryString = _.find(searchSet.link,function(l) { return l.relation === 'self'}).url;
                //Get a substring of url as only interested in q string params...
                queryString = queryString.substring(queryString.indexOf("?")+1);
                //Split this into an array and then further reduce by fetching  _include ||  _revinclude params...
                var rawIncludes = _.filter(queryString.split('&'),function(part) {return part.indexOf("_include") > -1 || part.indexOf("_revinclude") > -1});
                //should give _include=Patient:general-practitioner etc...
                for(var i=0;i<rawIncludes.length;i++)
                {
                    var rawInclude = rawIncludes[i];
                    var include = rawInclude.split('=');
                    var includeType = include[0];
                    var includeValue = include[1];
                    if(includeType === "_include") {
                        query.includes.push(includeValue);
                    } else if (includeType === "_revinclude") {
                        query.revincludes.push(includeValue);
                    }
                }
            }
        },
        _aggregateReferenceQueries:function(queries,target) {
            for(var i=0;i<queries.length;i++) {
                target.push(queries[i]);
            }
        },
        fetch:function(registry, searchset, includes, revincludes) {
            var referenceQueries = [];
            
            var incs = this.include.getReferencesToInclude(registry,searchset,includes);
            this._aggregateReferenceQueries(incs,referenceQueries);

            var revs = this.revinclude.getReferencesToInclude(registry,searchset,revincludes);
            this._aggregateReferenceQueries(revs,referenceQueries);

            return referenceQueries;
        },
        include: 
        {
            getReferencesToInclude:function(registry,searchset,includes) {
                var queries = [];
                for(var i=0;i<includes.length;i++)
                {
                    var include = includes[i];
                    var incParameter = registry.searchResultParameters.include[include] || undefined;
                    //property  e.g. generalPractitioner
                    if(typeof incParameter !== 'undefined') {
                        var included = [];
                        for(var j=0;j<searchset.entry.length;j++) {
                            var entry = searchset.entry[j];
                            if(traverse(entry.resource).has([incParameter.reference]))
                            {
                                var property = entry.resource[incParameter.reference]
                                if(!_.isArray(property)) {
                                    property = [property] //FHIR and its f******g arrays!!!!
                                };
                                for(var k=0;k<property.length;k++)
                                {
                                    var prop = property[k];
                                    if(!_.contains(included, prop.reference))
                                    {
                                        var referencedResourceId = prop.reference.split("/")[1];
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
                                        included.push(prop.reference);
                                        queries.push(query);
                                    }
                                }
                            }
                        }
                    }
                }
                return queries;
            }
        },
        revinclude:
        {
            getReferencesToInclude:function(registry,searchSet,includes) {
                var queries = [];
                for(var i=0;i<includes.length;i++)
                {
                    //include will be string in format "xxxx:xxxx"
                    //Fetch the revinclude parameter from the registry...
                    var inc = includes[i];
                    var revParameter = registry.searchResultParameters.revinclude[inc];
                    //Using revParameter.reference and the resource id, extract a list of references from the search set...
                    var references = _.map(searchSet.entry, function(entry) { 
                        return revParameter.referenceType + "/" + entry.resource.id || revParameter.reference + "/" + entry.resource.id
                    });
                    for(var j=0;j<references.length;j++) {
                        var reference = references[j];
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
                    }
                }
                return queries;
            }
        }
    }
    
}

module.exports = {
    returnedResourceManager
}