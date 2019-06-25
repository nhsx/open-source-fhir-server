var resources = 
{
    AllergyIntolerance:{
        searchParameters:[
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
                indexProperty:'tag',
                property:'tag',
                searchProperty:'_tag',
                type:'token',
                indexType:'token'
            }, 
            {
                indexProperty:'assertedDate',
                property:'assertedDate',
                searchProperty:'date',
                type:'datetime',
                indexType:'datetime'
            },
            {
                indexProperty:'clinicalStatus',
                property:'clinicalStatus',
                searchProperty:'clinical-status',
                type:'string',
                indexType:'string'
            },
            {
                indexProperty:'identifier',
                property:'identifier',
                searchProperty:'identifier',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'patient',
                property:'patient',
                searchProperty:'patient',
                type:'reference',
                indexType:'reference'
            },
            {
                indexProperty:'verificationStatus',
                property:'verificationStatus',
                searchProperty:'verification-status',
                type:'string',
                indexType:'string'
            }
        ],
        searchResultParameters:
        {
            sort:{
                _id:'id',
                _lastUpdated:'lastUpdated',
                date:"assertedDate",
                "clinical-status":"clinicalStatus",
                "verification-status":"verificationStatus"
            },
            include:{
                'AllergyIntolerance:patient':{resourceType:'Patient',reference:'patient'}
            }
        }
    },
    Condition: {
        searchParameters:[
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
                indexProperty:'tag',
                property:'tag',
                searchProperty:'_tag',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'asserter',
                property:'asserter',
                searchProperty:'asserter',
                type:'reference',
                indexType:'reference'
            },
            {
                indexProperty:'assertedDate',
                property:'assertedDate',
                searchProperty:'asserted-date',
                type:'datetime',
                indexType:'datetime'
            },
            {
                indexProperty:'category',
                property:'category',
                searchProperty:'category',
                type:'codeableConcept',
                indexType:'token'
            },
            {
                indexProperty:'clinicalStatus',
                property:'clinicalStatus',
                searchProperty:'clinical-status',
                type:'string',
                indexType:'string'
            },
            {
                indexProperty:'code',
                property:'code',
                searchProperty:'code',
                type:'codeableConcept',
                indexType:'token'
            },
            {
                indexProperty:'context',
                property:'context',
                searchProperty:'encounter',
                type:'reference',
                indexType:'reference'
            },
            {
                indexProperty:'identifier',
                property:'identifier',
                searchProperty:'identifier',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'subject',
                property:'subject',
                searchProperty:'patient',
                type:'reference',
                indexType:'reference'
            }
        ],
        searchResultParameters:
        {
            sort:{
                _id:'id',
                _lastUpdated:'lastUpdated'
            },
            include:{
                'Condition:patient':{resourceType:'Patient',reference:'subject'},
                'Condition:encounter':{resourceType:'Encounter',reference:'context'},
                'Condition:asserter':{resourceType:'Practitioner',reference:'asserter'}
            },
            revinclude:{}
        }
    },
    Consent:{
        searchParameters:[
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
                indexProperty:'tag',
                property:'tag',
                searchProperty:'_tag',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'identifier',
                property:'identifier',
                searchProperty:'identifier',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'patient',
                property:'patient',
                searchProperty:'consentor',
                type:'reference',
                indexType:'reference'
            },
            {
                indexProperty:'patient',
                property:'patient',
                searchProperty:'patient',
                type:'reference',
                indexType:'reference'
            },
            {
                indexProperty:'status',
                property:'status',
                searchProperty:'status',
                type:'string',
                indexType:'string'
            }
        ],
        searchResultParameters:
        {
            sort:{
                _id:'id',
                _lastUpdated:'lastUpdated',
                dateTime:'dateTime'
            },
            include:{
                'Consent:patient':{resourceType:'Patient',reference:'patient'},
                'Consent:consentor':{resourceType:'Patient',reference:'patient'}
            },
            revinclude:{}
        }
    },
    Encounter:
    {
        searchParameters:[
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
                indexProperty:'tag',
                property:'tag',
                searchProperty:'_tag',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'class',
                property:'class',
                searchProperty:'class',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'condition',
                property:'condition',
                searchProperty:'diagnosis',
                type:'reference',
                indexType:'reference'
            },
            {
                indexProperty:'episodeOfCare',
                property:'episodeOfCare',
                searchProperty:'episode-of-care',
                type:'reference',
                indexType:'reference'
            },
            {
                indexProperty:'identifier',
                property:'identifier',
                searchProperty:'identifier',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'location',
                property:'location',
                searchProperty:'location',
                type:'reference',
                indexType:'reference'
            },
            {
                //This form allows complex types to be 'split' into separate indexTypes... participant-type is a codeableConcept/token (type) and participant is a reference (individual)
                //The participant index handler knows where to pick out the codeable concept and reference from the participant object.
                property:'participant',
                searchProperty:['participant-type','participant'],
                type:'participant',
                indexType:['token','reference'],
                indexPropertyIndexTypes:{
                    'participant-type':'token',
                    'participant':'reference'
                }
            },
            {
                indexProperty:'partOf',
                property:'partOf',
                searchProperty:'part-of',
                type:'reference',
                indexType:'reference'
            },
            {
                indexProperty:'date',
                property:'period',
                searchProperty:'date',
                type:'period',
                indexType:'period'
            },
            {
                indexProperty:'type',
                property:'type',
                searchProperty:'type',
                type:'codeableConcept',
                indexType:'token',
                allowMultiple:false
            },
            {
                indexProperty:'subject',
                property:'subject',
                searchProperty:'patient',
                type:'reference',
                indexType:'reference'
            },
            {
                indexProperty:'status',
                property:'status',
                searchProperty:'status',
                type:'string',
                indexType:'string'
            }
        ],
        searchResultParameters:
        {
            sort:{
                _id:'id',
                _lastUpdated:'lastUpdated'
            },
            include:{
                'Encounter:patient':{resourceType:'Patient',reference:'subject'}
            },
            revinclude:{
                'Condition:encounter':{resourceType:'Condition',reference:'Context', referenceType:'Encounter'},
                'MedicationStatement:encounter':{resourceType:'MedicationStatement',reference:'Context',referenceType:'Encounter'},
                'Observation:encounter':{resourceType:'Observation',reference:'Context',referenceType:'Encounter'},
                'Procedure:encounter':{resourceType:'Procedure',reference:'Context',referenceType:'Encounter'}
            }
        }
    },
    Location:{
        searchParameters:[
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
                indexProperty:'tag',
                property:'tag',
                searchProperty:'_tag',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty: 'identifier',
                property:'identifier',
                searchProperty:'identifier',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'name',
                property:'name',
                searchProperty:'name',
                type:'string',
                indexType:'string',
            },
            {
                indexProperty:'postalCode',
                property:'postalCode',
                searchProperty:'address-postalcode',
                type:'string',
                indexType:'string'
            }
        ],
        searchResultParameters:
        {
            sort:{
                _id:'id',
                _lastUpdated:'lastUpdated',
                name:'name',
                'address-postalcode':'address[0].postalCode',
                identifier:'identifier[0].value'
            },
            include:{
                'Location:organization':{resourceType:'Organization',reference:'managingOrganization'}
            },
            revinclude:{}
        }
    },
    Medication:{
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
                indexProperty:'tag',
                property:'tag',
                searchProperty:'_tag',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'code',
                property:'code',
                searchProperty:'code',
                type:'codeableConcept',
                indexType:'token'
            },
        ],
        searchResultParameters:
        {
            sort:{
                _id:'id',
                _lastUpdated:'lastUpdated'
            },
            include:{},
            revinclude:{
                'MedicationStatement:medicationReference':{resourceType:'Medication',reference:'medicationReference'}
                    
            }
        }
    },
    MedicationStatement:{
        searchParameters:[
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
                indexProperty:'tag',
                property:'tag',
                searchProperty:'_tag',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'context',
                property:'context',
                searchProperty:'encounter',
                type:'reference',
                indexType:'reference'
            },
            {
                indexProperty: 'identifier',
                property:'identifier',
                searchProperty:'identifier',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'effectiveDateTime',
                property:'effectiveDateTime',
                searchProperty:'date',
                type:'datetime',
                indexType:'datetime'
            },
            {
                indexProperty:'status',
                property:'status',
                searchProperty:'status',
                type:'string',
                indexType:'string'
            },
            {
                indexProperty:'subject',
                property:'subject',
                searchProperty:'patient',
                type:'reference',
                indexType:'reference'
            }
        ],
        searchResultParameters:
        {
            sort:{
                _id:'id',
                _lastUpdated:'lastUpdated',
                date:'effectiveDateTime',
                identifier:'identifier[0].value'
            },
            include:{
                'MedicationStatement:medication':{resourceType:'Medication',reference:'medicationReference'},
                'MedicationStatement:patient':{resourceType:'Patient',reference:'subject'}
            },
            revinclude:{}
        }
    },
    Observation:{
        searchParameters:[
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
                indexProperty:'tag',
                property:'tag',
                searchProperty:'_tag',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'code',
                property:'code',
                searchProperty:'code',
                type:'codeableConcept',
                indexType:'token'
            },
            {
                indexProperty:'category',
                property:'category',
                searchProperty:'category',
                type:'codeableConcept',
                indexType:'token'
            },
            {
                indexProperty: 'status',
                property:'status',
                searchProperty:'status',
                type:'string',
                indexType:'string'
            },
            {
                indexProperty: 'identifier',
                property:'identifier',
                searchProperty:'identifier',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'effectiveDateTime',
                property:'effectiveDateTime',
                searchProperty:'date',
                type:'datetime',
                indexType:'datetime'
            },
            {
                indexProperty:'effective',
                property:'effective',
                searchProperty:'date',
                type:'datetime',
                indexType:'datetime'
            },
            {
                indexProperty:'context',
                property:'context',
                searchProperty:'encounter',
                type:'reference',
                indexType:'reference'
            },
            {
                indexProperty:'subject',
                property:'subject',
                searchProperty:'patient',
                type:'reference',
                indexType:'reference'
            }
        ],
        searchResultParameters:
        {
            sort:{
                _id:'id',
                _lastUpdated:'lastUpdated',
                date:'effectiveDateTime',
                identifier:'identifier[0].value'
            },
            include:{
                'Observation:encounter':{resourceType:'Encounter',reference:'context'},
                'Observation:patient':{resourceType:'Patient',reference:'subject'}
            },
            revinclude:{}
        }
    },
    Organization: {
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
                indexProperty: 'identifier',
                property:'identifier',
                searchProperty:'identifier',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'postalCode',
                property:'postalCode',
                searchProperty:'address-postalcode',
                type:'string',
                indexType:'string'
            },
            {
                indexProperty:'name',
                property:'name',
                searchProperty:'name',
                type:'string',
                indexType:'string',
            },
            {
                indexProperty: 'tag',
                property:'tag',
                searchProperty:'_tag',
                type:'token',
                indexType:'token'
            }
        ],
        searchResultParameters:
        {
            sort:{
                _id:'id',
                _lastUpdated:'lastUpdated',
                name:'name',
                'address-postalcode':'address[0].postalCode',
                identifier:'identifier[0].value'
            },
            include:{},
            revinclude:{
                'Patient:organization':{resourceType:'Organization',reference:'managingOrganization'}
            }
        }
    },
    Patient:{
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
                indexProperty:'tag',
                property:'tag',
                searchProperty:'_tag',
                type:'token',
                indexType:'token'
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
                indexProperty:'name',
                property:'name',
                searchProperty:'name',
                type:'name',
                indexType:'name',
            },
            {
                indexProperty:'family',
                property:'family',
                searchProperty:'family',
                type:'string',
                indexType:'string'
            }, 
            {
                indexProperty:'given',
                property:'given',
                searchProperty:'given',
                type:'string',
                indexType:'string'
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
            sort:{
                _id:'id',
                _lastUpdated:'lastUpdated',
                family:'name[0].family',
                given:'name[0].given[0]',
                birthDate:'birthDate',
                gender:'gender',
                identifier:'identifier[0].value'
            },
            include:{
                'Patient:general-practitioner':{resourceType:'Practitioner',reference:'generalPractitioner'},
                'Patient:organization':{resourceType:'Organization',reference:'managingOrganization'}
            },
            revinclude:{
                'AllergyIntolerance:patient':{resourceType:'AllergyIntolerance',reference:'Patient',referenceType:'Patient'},
                'Condition:patient':{resourceType:'Condition',reference:'Subject',referenceType:'Patient'},
                'Consent:consentor':{resourceType:'Consent',reference:'Patient',referenceType:'Patient'},
                'Consent:patient':{resourceType:'Consent',reference:'Patient',referenceType:'Patient'},
                'Encounter:patient':{resourceType:'Encounter',reference:'Subject',referenceType:'Patient'},
                'MedicationStatement:patient':{resourceType:'MedicationStatement',reference:'Subject',referenceType:'Patient'},
                'Observation:patient':{resourceType:'Observation',reference:'Subject',referenceType:'Patient'},
                'Procedure:patient':{resourceType:'Procedure',reference:'Subject',referenceType:'Patient'}
            }
        }
    },
    Policy:{
        searchParameters:[
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
                indexProperty:'tag',
                property:'tag',
                searchProperty:'_tag',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'end',
                property:'end',
                searchProperty:'end',
                type:'datetime',
                indexType:'datetime'
            },
            {
                indexProperty: 'identifier',
                property:'identifier',
                searchProperty:'identifier',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'name',
                property:'name',
                searchProperty:'name',
                type:'string',
                indexType:'string'
            },
            {
                indexProperty:'from',
                property:'from',
                searchProperty:'rule-context-from',
                type:'reference',
                indexType:'reference'
            },
            {
                indexProperty:'organization',
                property:'organization',
                searchProperty:'rule-context-organization',
                type:'reference',
                indexType:'reference'
            },
            {
                indexProperty:'reason',
                property:'reason',
                searchProperty:'rule-context-reason',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'role',
                property:'role',
                searchProperty:'rule-context-userRole',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'relationship',
                property:'relationship',
                searchProperty:'rule-context-userRelationship',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'status',
                property:'status',
                searchProperty:'status',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'start',
                property:'start',
                searchProperty:'start',
                type:'datetime',
                indexType:'datetime'
            }
        ],
        searchResultParameters:{
            sort:{
                _id:'id',
                _lastUpdated:'lastUpdated',
                name:'name',
            },
            include:{},
            revinclude:{}
        }
    },
    Practitioner: {
        searchParameters:[
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
            }
        ],
        searchResultParameters:{
            sort:{
                _id:'id',
                _lastUpdated:'lastUpdated',
                family:'name[0].family',
                given:'name[0].given[0]'
            },
            include:{},
            revinclude:{}
        }
    },
    PractitionerRole:{
        searchParameters:[
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
                indexProperty:'tag',
                property:'tag',
                searchProperty:'_tag',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'organization',
                property:'organization',
                type:'reference',
                indexType:'reference',
                searchProperty:'organization'
            },
            {
                indexProperty:'practitioner',
                property:'practitioner',
                type:'reference',
                indexType:'reference',
                searchProperty:'practitioner'
            },
            {
                indexProperty:'code',
                property:'code',
                searchProperty:'role',
                type:'codeableConcept',
                indexType:'token',
                allowMultiple:false
            }
        ],
        searchResultParameters:
        {
            sort:{
                _id:'id',
                _lastUpdated:'lastUpdated',
                identifier:'identifier[0].value'
            },
            include:{
                'PractitionerRole:practitioner':{resourceType:'Practitioner',reference:'practitioner'},
                'PractitionerRole:organization':{resourceType:'Organization',reference:'organization'}
            },
            revinclude:{}
        }
    },
    Procedure: {
        searchParameters:[
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
                indexProperty:'tag',
                property:'tag',
                searchProperty:'_tag',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'category',
                property:'category',
                searchProperty:'category',
                type:'codeableConcept',
                indexType:'token'
            },
            {
                indexProperty:'code',
                property:'code',
                searchProperty:'code',
                type:'codeableConcept',
                indexType:'token'
            },
            {
                indexProperty:'context',
                property:'context',
                searchProperty:'encounter',
                type:'reference',
                indexType:'reference'
            },
            {
                indexProperty:'identifier',
                property:'identifier',
                searchProperty:'identifier',
                type:'token',
                indexType:'token'
            },
            {
                indexProperty:'performedDateTime',
                property:'performedDateTime',
                searchProperty:'date',
                type:'datetime',
                indexType:'datetime'
            },
            {
                indexProperty:'performedDate',
                property:'performedDate',
                searchProperty:'date',
                type:'datetime',
                indexType:'datetime'
            },
            {
                indexProperty:'status',
                property:'status',
                searchProperty:'status',
                type:'string',
                indexType:'string'
            },
            {
                indexProperty:'subject',
                property:'subject',
                searchProperty:'patient',
                type:'reference',
                indexType:'reference'
            }
        ],
        searchResultParameters:
        {
            sort:{
                _id:'id',
                _lastUpdated:'lastUpdated',
                performedDateTime:'performedDateTime'
            },
            include:{
                'Procedure:patient':{resourceType:'Patient',reference:'subject'},
                'Procedure:encounter':{resourceType:'Encounter',reference:'context'}
            },
            revinclude:{}
        }
    },
    Subscription:
        {
            searchParameters:
            [
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
                    indexProperty: 'tag',
                    property:'tag',
                    searchProperty:'_tag',
                    type:'token',
                    indexType:'token'
                }, 
                {
                    indexProperty: 'status',
                    property:'status',
                    type:'string',
                    indexType:'string'
                },
                {
                    indexProperty: 'payload',
                    property:'payload',
                    type:'string',
                    indexType:'string'
                },
                {
                    indexProperty: 'type',
                    property:'type',
                    type:'string',
                    indexType:'string'
                },
                {
                    indexProperty:'endpoint',
                    property:'endpoint',
                    searchProperty:'url',
                    type:'uri',
                    indexType:'uri'
                }
            ],
        searchResultParameters:
        {
            sort:{
                _id:'id',
                _lastUpdated:'lastUpdated',
            },
            include:{},
            revinclude:{}
        }
    }
}

module.exports = {
    resources
};