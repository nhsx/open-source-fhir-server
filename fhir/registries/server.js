var server = {
    url:"http://localhost:8080/fhir/stu3/",
    version:"1.0.0",
    documentation:"https://github.com/nhsx/open-source-fhir-server",
    resourceProfileBase:"https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect",
    resourceProfileVersion:"1",
    sources:[
        {
            target:'repo',
            isLocal:true,
            allowIdOnCreate:true,
            maxSearchResultSetSize:1000, //This is the maximum number of search results any query will return...
            maxInitialSearchResultSetSize:50,//This is the threshold at which the server will return first set of results before sending the query off for completion)...
            defaultPageSize:30,
            tag:{
                system:'https://roqr.fhir.co.uk/source',
                code:'local-repo',
                display:'ROQR Local FHIR Store/Repository'
            }
        },
        {
            target:'ccri',
            isLocal:false,
            dispatchable:true,
            resourceIdentifier:{
                system:'https://data.developer.nhs.uk/ccri-fhir/id'
            },
            tag:{
                    system:'https://roqr.fhir.co.uk/source',
                    code:'ccri',
                    display:'NHS Care Connect Reference Implementation'
                },
            url:'https://data.developer.nhs.uk/ccri-fhir/STU3'
        }
    ]
}

module.exports = {
    server
}