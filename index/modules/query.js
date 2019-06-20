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

var query = 
{
    selectors:
    {
        _baseSelector: function(parameter) {
            console.log('Base Selector: ' + JSON.stringify(parameter,null,2));
            var selector = {};
            var baseSelector = parameter.documentType + ',' + parameter.node
            selector.paths = [baseSelector];
            return selector;
        },
        string:function(parameter) {
            console.log('String Selector: ' + JSON.stringify(parameter,null,2));
            return this.selectors._baseSelector.call(this,parameter);
        },
        name:function(parameter) {
            console.log('Name Selector: ' + JSON.stringify(parameter,null,2));
            return this.selectors._baseSelector.call(this,parameter); 
        },
        datetime:function(parameter) {
            console.log('DateTime Selector: ' + JSON.stringify(parameter,null,2));
            var selector = this.selectors._baseSelector.call(this, parameter);
            //If parameter.value contains T then append DateTime, else append Date...
            selector.paths[0] = parameter.value.includes('T') ? selector.paths[0] + 'DateTime' : selector.paths[0] + 'Date';
            return selector;
        },
        reference:function(parameter) {
            console.log('Reference Selector: ' + JSON.stringify(parameter,null,2));
            return this.selectors._baseSelector.call(this,parameter); 
        },
        id: function(parameter) {
            console.log('Reference Selector: ' + JSON.stringify(parameter,null,2));
            return this.selectors._baseSelector.call(this,parameter); 
        },
        period: function(parameter) {
            console.log('Period Selector: ' + JSON.stringify(parameter,null,2));
            //What is the difference here though? additional selector: encounter,date,startDate,startDateTime etc...
            //return an array of selectors
            //selector paths for startDate, startDateTime, endDate, endDateTime
            var selector = {};
            var path = parameter.documentType + ',date,' + parameter.node;
            selector.paths = [path];
            return selector;
        },
        token: function(parameter) {
            console.log('Token Selector: ' + JSON.stringify(parameter,null,2));
            //What is the difference here though? additional selector: docType,node,code, docType,node,value (for identifier), docType,node,system, docType,node,text
            //Look at global - return an array of selectors
            //encounter,class,code
            //encounter,class
            //encounter,class,system
            //encounter,class,text
            var selector = {};
            var rootPath = parameter.documentType + ',' + parameter.node
            var codePath = rootPath + ',code';
            var systemPath = rootPath + ',system';
            var textPath = rootPath + ',text';
            selector.paths = [codePath,systemPath,textPath];
            return selector;
        }
    },
    filters:
    {
        _baseFilter(documents, parameter) {
            console.log('Base Filter: ' + JSON.stringify(parameter,null,2));

            var selector;
            //Get the initial 'select(or)' path...
            try
            {
                selector = this.selectors[parameter.indexType].call(this, parameter).paths[0].split(',');
            }
            catch(ex) 
            {
                throw 'Could not execute node path selector for global type: ' + parameter.indexType + ', reason: ' + ex.stack || ex.toString();
            }
            return this.filters._select.call(this,selector,documents,parameter);
        },
        datetime: function(documents, parameter) {
            console.log('DateTime Filter: ' + JSON.stringify(parameter,null,2));
            //if value does not contain T and modifier is eq or default then set the modifier to _between 
            return this.filters._baseFilter.call(this,documents,parameter);
        },
        string: function(documents, parameter) {
            console.log('String Filter: ' + JSON.stringify(parameter,null,2));
            return this.filters._baseFilter.call(this,documents,parameter);
        },
        name: function(documents, parameter) {
            console.log('Name Filter: ' + JSON.stringify(parameter,null,2));
            return this.filters._baseFilter.call(this,documents,parameter);
        },
        reference: function(documents, parameter) {
            console.log('Reference Filter: ' + JSON.stringify(parameter,null,2));
            return this.filters._baseFilter.call(this,documents,parameter);
        },
        id: function(documents, parameter) {
            console.log('ID Filter: ' + JSON.stringify(parameter,null,2));
            return this.filters._baseFilter.call(this,documents,parameter);       
        },
        token: function(documents, parameter) {
            console.log('Token Filter: ' + JSON.stringify(parameter,null,2));
            //Always equals - what is the difference here though? additional selectors?
            //Look at global (may need to operatate on an array of selectors???)
            //class=http://hl7.org/fhir/v3/ActCode|EMER
            //class=EMER
            //class=|EMER
            //class=http://hl7.org/fhir/v3/ActCode|
            //Loop through each selector (code/value, system, text) - will need 3 selectors
            var results = [];
            var selector;
            //Get the initial 'select(or)' paths...
            try
            {
                selector = this.selectors[parameter.indexType].call(this, parameter);
            }
            catch(ex) 
            {
                throw 'Could not execute node path selector for global type: ' + parameter.indexType + ', reason: ' + ex.stack || ex.toString();
            }
            //Fetch the initial result set (map) for each selector...
            var selectors = selector.paths;
            var context = this;
            selectors.forEach(function(selector) {
                selectorResults = context.filters._select.call(context, selector, documents, parameter);
                selectorResults.forEach(function(result) {
                    results.push(result);
                });
            });
            
            return results;
        },
        period: function(documents, parameter) {
            console.log('Period Filter: '  + JSON.stringify(parameter,null,2));
            return this.filters._baseFilter.call(this,documents,parameter);
        },
        _select: function(selector, documents, parameter) {
            console.log("_select: " + JSON.stringify(selector) + " parameter: " + JSON.stringify(parameter));

            var context = this;
            var results = [];
            selector = !Array.isArray(selector) ? selector.split(',') : selector;

            documents.$(selector).forEachChild(function(value,node) {
                //Filter (reduce)...
                var paramValues = parameter.value.split(','); //Handles 'OR' (which kinda translates to a SQL IN)
                paramValues.forEach(function(paramValue) {
                    var match = false;
                    var modifier = parameter.modifier || parameter.indexType;
                    try
                    {
                        match = context.modifiers[modifier].call(context,value,paramValue);
                    }
                    catch(ex)
                    {
                        throw 'Could not evaluate parameter modifier: ' + modifier + ', reason: ' + ex.stack || ex.toString();
                    }
                    
                    if(match === true) {
                        node.forEachChild(function(id) {
                            results.push(id);
                        });
                    }
                });
            });

            return results;
        }
    },
    modifiers:
    {
        string:function(value,expression) {
            //= means starts with http://hl7.org/fhir/stu3/search.html#string
            return value.toLowerCase().startsWith(expression.toLowerCase());
        },        
        name:function(value,expression) {
            return this.modifiers['string'].call(this,value,expression);
        },        
        datetime:function(value,expression) {
            //Default is === (or isSame using moment)
            return this.modifiers['eq'].call(this,value,expression);
        },
        reference:function(value,expression) {
            //Reference default (only modifier)=== 
            return this.modifiers['exact'].call(this, value, expression);
        },
        token:function(value,expression) {
            //See note on case-sensitivity: https://www.hl7.org/fhir/search.html#token
            return this.modifiers['exact'].call(this, value, expression);
        },
        period:function(value,expression) {
            return this.modifiers['eq'].call(this, value, expression);
        },
        id:function(value,expression) {
             //ID default (only modifier)=== 
             return this.modifiers['exact'].call(this, value, expression);           
        },
        eq:function(value,expression) {
            return moment(parseInt(value)).isSame(moment(expression));
        },
        neq:function(value,expression) {
            return !moment(parseInt(value)).isSame(moment(expression));
        },
        lt:function(value,expression) {
            return moment(parseInt(value)).isBefore(moment(expression));
        },
        gt:function(value,expression) {
            return moment(parseInt(value)).isAfter(moment(expression));
        },
        sa:function(value,expression) {
            return moment(parseInt(value)).isSameOrAfter(moment(expression));
        },
        eb:function(value, expression) {
            return moment(parseInt(value)).isSameOrBefore(moment(expression));
        },
        between:function(value,expression) {
            return true;
        },  
        contains:function(value,expression) {
            return value.toLowerCase().includes(expression.toLowerCase());
        },
        exact:function(value,expression) {
            return value === expression;
        },
        identifier:function(value,expression) {
           return this.modifiers['exact'].call(this, value, expression);  
        },
        missing:function(value,expression)
        {
            //value not in any of the allowed values or blank (true),
            //value is in any of the allowed values and is not blank?
            //?
        }
    },

}

module.exports = {
    query
};