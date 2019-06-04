# ROQR (fhiR On Qewd and dockeR) - Open Source Fhir Server
4th June 2019, [Yorkshire and Humber Care Record](https://yhcr.org)

Twitter: [@YHCareRecord](https://twitter.com/YHCareRecord/)

---

# What is the ROQR?
ROQR (pronounced 'rocker') is an open source fhir server which is being built by the Yorkshire and Humber Care Record (YHCR) project team as part of their work with the [NHS England Local Health and Care Record Exampler](https://www.england.nhs.uk/publication/local-health-and-care-record-exemplars/) (LHCRE) programme. The name ROQR reflects the stack of open source software and health care interoperability standards that the server has been built upon, namely:

[Fast Healthcare Interoperable Resources - FHIR](https://fhir.hl7.org.uk)

[Quick and Easy Web API Development - QEWD-Up](https://github.com/robtweed/qewd/tree/master/up)

[YottaDB](https://yottadb.com)

[Docker](https://www.docker.com)

ROQR is being developed in accordance with a series of [technical papers](https://yhcr.org/downloads/) produced by the YHCR. Each design paper describes a set of "model" software components and architectures that, when realised, can enable health and social care organisations to share data using [FHIR](https://www.hl7.org/fhir/STU3/). 

ROQR is very much a work in progress and will keep evolving in step with both the LHCRE and YHCR programmes. The overall aim, however, is that the server will provide an out of the box, open source solution to health and social care organisations who require the ability to share data using FHIR. 

---

# Current Features
The source code available here is pre-alpha and very much under development - this is a working an active project, however. At the time of writing, the server supports:

* A local FHIR store/repository
* Resource creation and reads for FHIR [Encounter](https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Encounter-1), [Patient](https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Patient-1), [Practitioner](https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Practitioner-1), [Organization](https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Organization-1) resources.
* _id, _lastUpdated and _tag search support for each resource type
* include search support for:
   * [Encounter](https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Encounter-1) - can include the referenced [Patient](https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Patient-1) resource.
   * [Patient](https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Patient-1) - can include both [General Practitioner](https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Practitioner-1) and [General Practice](https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Organization-1) resources
* revinclude search support Patient (can rev include Encounters)

To see these features in action, refer to the "Getting Started" section below.

---

# Architecture Summary
ROQR componentry and microservices are aligned to the process model as described in page 19 of the [YHCR](https://yhcr.org) technical design paper: [Design Paper 003 - A Conceptual Design for A FHIR Proxy Server](https://yhcr.org/wp-content/uploads/2019/05/YHCR_Design_Paper_003__Conceptual_Design_for_a_FHIR_Proxy_Server_v2.0.docx). The server is currently comprised of the following services, each of which are self-contained, executes within their own Docker container and are able to run in isolation or as part of a ROQR FHIR interaction service pipeline (fisp):

* FHIR API - this service encapsulates both the [FHIR REST API](https://www.hl7.org/fhir/STU3/http.html) and [FHIR Search API](https://www.hl7.org/fhir/STU3/search.html). Currently supported are Create (POST), READ (GET) and a limited Search (GET). The services receives FHIR API requests and then maps those requests onto an interaction service pipeline. An interaction service pipeline configures the route that the request should navigate through the ROQR internal microservices in order to be fulfilled. The interaction pipelines are configurable so that future additional services which are required to process a request can be added, e.g. Pub/Sub, Asynchronous Query Processing etc.


* Index - this service provides methods to create and delete searchable indices for each resource in addition to a method that affords the ability to execute index queries/lookups. Each ROQR index table maps each property within a FHIR resource onto the specified [FHIR Search Parameter type](https://www.hl7.org/fhir/STU3/searchparameter-registry.html).


* Repo Adapter - this service provides a facade to the local FHIR store service. The service further transforms messages recieved by the public facing FHIR API into the message format needed by the local FHIR store.


* Repo - this service provides database Create, Read, Update and Delete operations that interact with the local database. The service also acts a facade to the Search service.


* Search - this services provides a series of API methods which, when executed as part of a request pipeline, provide result set caching, sorting and paging against data within the local FHIR store. The service also provides methods that include and revinclude search results.


* Responder - this service transforms received messages forwarded to it from the server's internal services into a FHIR response (partially implemented).


* Tests - this service makes each of the ROQR internal microservices accesible via a HTTP API that affords developers with the ability to execute requests against a single service in isolation which is very useful for testing and development (i.e. not part of any interaction service pipeline). In production, this microservice should **NOT** be deployed.

---

# Getting Started
The following steps describe how to get the current version of ROQR up and running on your local development machine. Please note that although QEWD-Up supports Open Authentication and JWT out of the box, this is currently disabled in order to speed up development and testing of the services and APIs. The [QEWD-Up]](https://github.com/robtweed/qewd/tree/master/up#dockerised-qewd-microservices) documentation does describe how to enable this feature - it goes without saying that authentication **SHOULD** be enabled in staging/production environments.

## Pre-requisites

### Docker
Docker is required to run ROQR. There are lots of documents which describe the installation of [Docker Desktop](https://www.docker.com/products/docker-desktop) and this is all that is needed to run the server on your local machine.

### Docker Compose (optional)
[Docker Compose](https://docs.docker.com/compose/) affords the ability to "spin up" an entire stack of Docker containers in one simple command. The ROQR repo includes a docker-compose.yml file which defines each service along with the docker command to get the container up and running.

### Development Environment/Editor
The flavour of dev enviroment is of course entirely up to you... ROQR ultimately doesn't care! [VS Code](https://code.visualstudio.com), [Atom](https://atom.io) and [Sublime](https://www.sublimetext.com), are extensible, open source and free. Each environment does have decent Docker integration which can be installed via the usual plugin/extension management features.

### A note on data persistence
The docker compose file and commands listed below do not persist data. Once the containers are torn down, the data is lost - it is ephemeral to aid in the development and rapid testing of the microservices. That said, if you wish your data to be persisted then the documentation [here](https://github.com/robtweed/qewd/blob/master/up/docs/MicroServices.md#persisting-data-in-the-integrated-yottadb-database) describes what you need to do. At some point in the future an alternative docker-compose file will be provided that will enable data to be persisted.

---

## Launching ROQR

### Get the source
1. Either navigate to your local repo directory or create one, e.g. `C:\myrepos\` or `~/Repos`
2. In your command line type (followed by enter): `git clone https://github.com/nhsx/open-source-fhir-server.git`
3. Open the folder in your development environment and take a few minutes to have a look at the code (if you wish).

### Docker (command line)
ROQR currently consists of 8 services - each of which needs to be launched. This can be labourious using the Docker command line and subverting this process is where docker-compose comes into its own. However, the following instructions are provided for completeness:

1. Launch the [QEWD-Up](https://github.com/robtweed/qewd/tree/master/up#dockerised-qewd-microservices) Orchestrator: `docker run -d --name orchestrator --rm -p8080:8080 -v <file-path-to-the-ROQR-source>:/opt/qewd/mapped -e microservice=orchestrator rtweed/qewd-server`
2. Launch the FHIR API Service: `docker run -d --name fhir --rm -p8081:8080 -v <file-path-to-the-ROQR-source>:/opt/qewd/mapped -e microservice=fhir rtweed/qewd-server`
3. Launch the Repo Adapter Service: `docker run -d --name repoadapter --rm -p9001:8080 -v<file-path-to-the-ROQR-source>:/opt/qewd/mapped -e microservice=repoadapter rtweed/qewd-server`
4. Launch the Repo Service: `docker run -d --name repo --rm -p9002:8080 -v <file-path-to-the-ROQR-source>:/opt/qewd/mapped -e microservice=repo rtweed/qewd-server`
5. Launch the Index Service: `docker run -d --name index --rm -p9003:8080 -v <file-path-to-the-ROQR-source>:/opt/qewd/mapped -e microservice=index rtweed/qewd-server`
6. Launch the Search Service: `docker run -d --name search --rm -p9004:8080 -v <file-path-to-the-ROQR-source>:/opt/qewd/mapped -e microservice=search rtweed/qewd-server`
7. Launch the Responder Service: `docker run -d --name responder --rm -p9005:8080 -v <file-path-to-the-ROQR-source>:/opt/qewd/mapped -e microservice=responder rtweed/qewd-server`
8. Launch the (Optional) Tests Service: `docker run -d --name tests --rm -p6666:8080 -v <file-path-to-the-ROQR-source>:/opt/qewd/mapped -e microservice=tests rtweed/qewd-server`

Each of the above commands will launch the services in "headless" or "daemon" mode. If you wish to run the containers in "interactive" mode then replace `-d` with `-it` (see [here](https://docs.docker.com/engine/reference/commandline/run/) for more information on the Docker command line options).

### Docker Compose
This process is significantly less of a pain! Before running these commands, please check that the file/directory paths in the Docker compose file match your local environment. *Note* steps 1 and 2 are only required to be completed once - on first run:

1. `docker run -it --name fhir --rm -p8081:8080 -v <file-path-to-the-ROQR-source>:/opt/qewd/mapped -e microservice=fhir rtweed/qewd-server` to bring up the orchestrator service and ensure that the additional node packages required by ROQR are installed. 
2. Kill the container `docker stop fhir`
3. Bring up ROQR: `docker-compose up -d` 
4. To tear the containers down, simply enter `docker-compose down`

### Postman Collection and Environment
Once ROQR is up and running, you can try out the FHIR API by executing the following Postman collection (and environment). The process for importing [collections](https://learning.getpostman.com/docs/postman/collections/intro_to_collections) and [environments](https://learning.getpostman.com/docs/postman/environments_and_globals/intro_to_environments_and_globals) into Postman is very well documented [here](https://learning.getpostman.com/docs/postman/collections/data_formats/)

1. Postman Environment
2. Postman Collection

---

## Roadmap
The following outlines the current remaining development of work before the server is considered to be beta:

### Short Term (June/July 2019)
1. Configure ROQR to support [Observation](https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Observation-1), [AllergyIntolerance](https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-AllergyIntolerance-1), [Procedure](https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Procedure-1), [Condition](https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Condition-1), [Medication](https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Medication-1), [MedicationStatement](https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-MedicationStatement-1), [Location](https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Location-1) and [PractitionerRole](https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Practitioner-1) resources.
3. Implement [FHIR capability](http://hl7.org/fhir/STU3/capabilitystatement.html) statement API
4. Subscription Processing - create a [subscription](http://hl7.org/fhir/STU3/subscription.html) service which is to slot into the create and update interaction service pipeline.
5. Versioning - create a versioning service [FHIR Versioning/History](https://www.hl7.org/fhir/STU3/http.html#history) which will be slotted into the create and update interaction service pipeline.
6. Validation - create a [validation](http://hl7.org/fhir/STU3/validation.html) service which will be slotted into the create interaction service pipeline.

### Medium Term (July/August 2019)
1. Add support to construct and transmit [ITK3 Inpatient and Emergency Transfer of Care](https://digital.nhs.uk/services/interoperability-toolkit/developer-resources/transfer-of-care-specification-versions) FHIR resources via MESH.





