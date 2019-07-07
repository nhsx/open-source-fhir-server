var meta = {
    CapabilityStatement:
    {
        resourceType:"CapabilityStatement",
        status:"active",
        publisher:"Synanetics Ltd on behalf of Yorkshire and Humber Care Record",
        kind:"instance",
        software:{
            name: "ROQR - fhiR On Qewd and dockeR",
            version: ""
        },
        implementation: {
            description: "YHCR Reference Implementation (Care Connect)",
            url: ""
        },
        implementationGuide:[],
        rest:[
            {
                mode:"server",
                resource:[]
            }
        ]
    },
    AllergyIntolerance:{
        '_id':{
            documentation: "The ID of the resource",
        },
        '_lastUpdated':{
            type:"date",
            documentation: "The date/time the resource was last update date"
        },
        '_tag':{
            documentation:"Any tags that have been applied to the resource"
        },
        'clinical-status':{
            documentation: "active | inactive | resolved",
            type:"token"
        },
        'date':{
            type:"date",
            documentation: "Date record was believed accurate"
        },
        'identifier':{
            documentation: "External/Business ids for this item",
            type:"token"
        },
        'patient':{
            documentation: "Who the sensitivity is for"
        },
        'verification-status':{
            documentation: "unconfirmed | confirmed | refuted | entered-in-error",
            type:"token"
        },
        interaction:[
            'create','read','update','delete','search-type'
        ]
    },
    CarePlan:{
        '_id':{
            documentation: "The ID of the resource"
        },
        '_lastUpdated':{
            type:"date",
            documentation: "The date/time the resource was last update date"
        },
        '_tag':{
            documentation:"Any tags that have been applied to the resource"
        },
        'category':{
            documentation: "Type of plan",
            type:"token"
        },
        'date':{
            documentation:"Time period plan covers",
            type:"date"
        },
        'identifier':{
            documentation: "External/Business ids for this item"
        },
        'patient':{
            documentation: "Who the Care Plan is for"
        },
        interaction:[
            'create','read','update','delete','search-type'
        ]
    },
    Condition:{
        '_id':{
            documentation: "The ID of the resource"
        },
        '_lastUpdated':{
            documentation: "The date/time the resource was last update date",
            type:"date"
        },
        '_tag':{
            documentation:"Any tags that have been applied to the resource"
        },
        'category':{
            documentation: "The category of the condition",
            type:"token"
        },
        'clinical-status':{
            documentation:"The clinical status of the condition",
            type:"token"
        },
        'identifier':{
            documentation: "External/Business ids for this item"
        },
        'patient':{
            documentation: "Who the diagnosis is for"
        },
        interaction:[
            'create','read','update','delete','search-type'
        ]
    },
    Consent:{
        '_id':{
            documentation: "The ID of the resource"
        },
        '_lastUpdated':{
            documentation: "The date/time the resource was last update date",
            type:"date"
        },
        '_tag':{
            documentation:"Any tags that have been applied to the resource"
        },
        'identifier':{
            documentation: "External/Business ids for this item"
        },
        'patient':{
            documentation: "To whom this Consent applies"
        },
        'status':{
            documetation: "draft | proposed | active | rejected | inactive | entered-in-error",
            type:"token"
        },
        interaction:[
            'create','read','update','delete','search-type'
        ]
    },
    Encounter:{
        '_id':{
            documentation: "The ID of the resource"
        },
        '_lastUpdated':{
            documentation: "The date/time the resource was last update date",
            type:"date"
        },
        '_tag':{
            documentation:"Any tags that have been applied to the resource"
        },
        'class':{
            documentation:"inpatient | outpatient | ambulatory | emergency",
            type:"token"
        },
        'diagnosis':{
            documentation:"Reason the encounter takes place (resource)"
        },
        'episode-of-care':{
            documentation:"Episode(s) of care that this encounter should be recorded against"
        },
        'identifier':{
            documentation: "External/Business ids for this item"
        },
        'location':{
            documentation: "Location the encounter takes place"
        },
        'participant':{
            documentation:"Persons involved in the encounter other than the patient",
            type:"reference"
        },
        'participant-type':{
            documentation:"Role of participant in encounter",
            type:"token"
        },
        'part-of':{
            documentation:"Another Encounter this encounter is part of"
        },
        'patient':{
            documentation: "The patient or group present at the encounter"
        },
        'status':{
            documentation: "planned | arrived | triaged | in-progress | onleave | finished | cancelled"
        },
        'type':{
            documentation: "Specific type of encounter"
        },
        interaction:[
            'create','read','update','delete','search-type'
        ]
    },
    Flag:
    {
        '_id':{
            documentation: "The ID of the resource"
        },
        '_lastUpdated':{
            documentation: "The date/time the resource was last update date",
            type:"date"
        },
        '_tag':{
            documentation:"Any tags that have been applied to the resource"
        },
        'code':{
            documentation:"Code identifying a specific flagged issue",
            type:"token"
        },
        'date':{
            documentation:"Time period when flag is active",
            type:"date"
        },
        'patient':{
            documentation: "Who the Care Plan is for"
        },
        interaction:[
            'create','read','update','delete','search-type'
        ]
    },
    Location:{
        '_id':{
            documentation: "The ID of the resource"
        },
        '_lastUpdated':{
            documentation: "The date/time the resource was last update date",
            type:"date"
        },
        '_tag':{
            documentation:"Any tags that have been applied to the resource"
        },
        'address-postalcode':{
            documentation:"A postal code specified in an address"
        },
        'identifier':{
            documentation: "External/Business ids for this item (e.g. ODS Code)"
        },
        'name':{
            documentation: "A portion of the location's name or alias"
        },
        interaction:[
            'create','read','update','delete','search-type'
        ]
    },
    Medication:{
        '_id':{
            documentation: "The ID of the resource"
        },
        '_lastUpdated':{
            documentation: "The date/time the resource was last update date",
            type:"date"
        },
        '_tag':{
            documentation:"Any tags that have been applied to the resource"
        },
        'code':{
            documentation:"Codes that identify this medication",
            type:"token"
        },
        interaction:[
            'create','read','update','delete','search-type'
        ]
    },
    MedicationStatement:{
        '_id':{
            documentation: "The ID of the resource"
        },
        '_lastUpdated':{
            documentation: "The date/time the resource was last update date",
            type:"date"
        },
        '_tag':{
            documentation:"Any tags that have been applied to the resource"
        },
        'context':{
            documentation:"Returns statements for a specific context (episode or episode of Care)."
        },
        'effective':{
            documentation:"Date when patient was taking (or not taking) the medication",
            type:"date"
        },
        'identifier':{
            documentation: "External/Business ids for this item"
        },
        'status':{
            documentation: "Return statements that match the given status",
            type:"token"
        },
        'patient':{
            documentation: "Returns statements for a specific patient"
        },
        interaction:[
            'create','read','update','delete','search-type'
        ]
    },
    Observation: {
        '_id':{
            documentation: "The ID of the resource"
        },
        '_lastUpdated':{
            documentation: "The date/time the resource was last update date",
            type:"date"
        },
        '_tag':{
            documentation:"Any tags that have been applied to the resource"
        },
        'category':{
            documentation:"The classification of the type of observation",
            type:"token"
        },
        'code':{
            documentation:"The code of the observation type",
            type:"token"
        },
        'context':{
            documentation:"Returns observations for a specific context (episode or episode of Care)."
        },
        'identifier':{
            documentation: "External/Business ids for this item"
        },
        'date':{
            documentation:"Obtained date/time. If the obtained element is a period, a date that falls in the period",
            type:"date"
        },
        'identifier':{
            documentation: "External/Business ids for this item"
        },
        'patient':{
            documentation: "Who the Observation is about"
        },
        'status':{
            documentation:"The status of the observation",
            type:"token"
        },
        interaction:[
            'create','read','update','delete','search-type'
        ]
    },
    Organization:{
        '_id':{
            documentation: "The ID of the resource"
        },
        '_lastUpdated':{
            documentation: "The date/time the resource was last update date",
            type:"date"
        },
        '_tag':{
            documentation:"Any tags that have been applied to the resource"
        },
        'address-postalcode':{
            documentation:"A postal code specified in an address"
        },
        'identifier':{
            documentation: "External/Business ids for this item (e.g. ODS Code)"
        },
        'name':{
            documentation: "A portion of the location's name or alias"
        },
        interaction:[
            'create','read','update','delete','search-type'
        ]
    },
    Patient:{
        '_id':{
            documentation: "The ID of the resource"
        },
        '_lastUpdated':{
            documentation: "The date/time the resource was last update date",
            type:"date"
        },
        '_tag':{
            documentation:"Any tags that have been applied to the resource"
        },
        'address-postalcode':{
            documentation:"A postal code specified in an address"
        },
        'birthdate':{
            documentation:"The patient's date of birth",
            type:"date"
        },
        'city':{
            documentation:"A city/town specified in an address"
        },
        'district':{
            documentation:"A county specified in an address"
        },
        'family':{
            documentation:"A portion of the family name of the patient"
        },
        'gender':{
            documentation: "Gender of the patient"
        },
        'given':{
            documentation: "A portion of the given name of the patient"
        },
        'identifier':{
            documentation: "External/Business ids for this item, e.g. Medical Record Number, Hospital Number etc."
        },
        'name':{
            documentation: "A server defined search that may match any of the string fields in the HumanName, including family, give, prefix, suffix, suffix, and/or text"
        },
        'organization':{
            documentation:"The GP Practice of the patient"
        },
        'general-practitioner':{
            documentation:"The Patient's named primary care phyisican/general practitioner"
        },
        interaction:[
            'create','read','update','delete','search-type'
        ]
    },
    Pracitioner:{
        '_id':{
            documentation: "The ID of the resource"
        },
        '_lastUpdated':{
            documentation: "The date/time the resource was last update date",
            type:"date"
        },
        '_tag':{
            documentation:"Any tags that have been applied to the resource"
        },
        'address-postalcode':{
            documentation:"A postal code specified in an address"
        },
        'family':{
            documentation:"A portion of the family name of the patient"
        },
        'given':{
            documentation: "A portion of the given name of the patient"
        },
        'identifier':{
            documentation: "External/Business ids for this item, e.g. GMC Code."
        },
        'name':{
            documentation: "A server defined search that may match any of the string fields in the HumanName, including family, give, prefix, suffix, suffix, and/or text"
        },
        interaction:[
            'create','read','update','delete','search-type'
        ]
    },
    PractitionerRole:{
        '_id':{
            documentation: "The ID of the resource"
        },
        '_lastUpdated':{
            documentation: "The date/time the resource was last update date",
            type:"date"
        },
        '_tag':{
            documentation:"Any tags that have been applied to the resource"
        },
        'identifier':{
            documentation: "External/Business ids for this item"
        },
        'organization':{
            documentation:"The identity of the organization the practitioner represents / acts on behalf of"
        },
        'practitioner':{
            documentation:"Practitioner that is able to provide the defined services for the organization"
        },
        'role':{
            documentation:"The practitioner can perform this role at for the organization",
            type:"token"
        },
        interaction:[
            'create','read','update','delete','search-type'
        ]
    },
    Procedure:{
        '_id':{
            documentation: "The ID of the resource"
        },
        '_lastUpdated':{
            documentation: "The date/time the resource was last update date",
            type:"date"
        },
        '_tag':{
            documentation:"Any tags that have been applied to the resource"
        },
        'category':{
            documentation:"Classification of the procedure",
            type:"token"
        },
        'code':{
            documentation:"A code to identify a procedure",
            type:"token"
        },
        'context':{
            documentation:"Encounter or episode associated with the procedure"
        },
        'date':{
            documentation:"Date/Period the procedure was performed",
            type:"date"
        },
        'identifier':{
            documentation: "External/Business ids for this item"
        },
        'patient':{
            documentation: "To whom the procedure was performed"
        },
        'status':{
            documentation:"preparation | in-progress | suspended | aborted | completed | entered-in-error | unknown",
            type:"token"
        },
        interaction:[
            'create','read','update','delete','search-type'
        ]
    },
    ReferralRequest:{
        '_id':{
            documentation: "The ID of the resource"
        },
        '_lastUpdated':{
            documentation: "The date/time the resource was last update date",
            type:"date"
        },
        '_tag':{
            documentation:"Any tags that have been applied to the resource"
        },
        'context':{
            documentation:"Encounter or episode associated with the procedure"
        },
        'identifier':{
            documentation: "External/Business ids for this item"
        },
        'patient':{
            documentation: "For whom the referral is for (patient)"
        },
        'specialty':{
            documentation:"The specialty that the referral is for",
            type:"token"
        },
        'service':{
            documentation:"Actions requested as part of the referral",
            type:"token"
        },
        'status':{
            documentation:"The status of the referral",
            type:"token"
        },
        'type':{
            documentation:"The type of the referral",
            type:"token"
        },
        interaction:[
            'create','read','update','delete','search-type'
        ]
    },
    Subscription:{
        '_id':{
            documentation: "The ID of the resource"
        },
        '_lastUpdated':{
            documentation: "The date/time the resource was last update date",
            type:"date"
        },
        '_tag':{
            documentation:"Any tags that have been applied to the resource"
        },
        'criteria':{
            documentation:'The search rules used to determine when to send a notification'
        },
        'payload':{
            documentation:'The mime-type of the notification payload'
        },
        'status':{
            documentation:'requested | active | error | off'
        },
        'type':{
            documentation:'The type of channel for the sent notifications'
        },
        'url':{
            documentation:'The uri that will receive the notifications'
        },
        interaction:[
            'create','read','update','delete','search-type'
        ]
    }
};

module.exports = {
    meta
};