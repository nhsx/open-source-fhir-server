var messageMap = require('../../../configuration/messages/messageMap.js').messageMap;

module.exports = function(message, jwt, forward, sendBack) {
    console.log('FHIR API service READ message in: ' + JSON.stringify(message));
    //This service should always operates in pipeline mode but has very limited functionality as a standalone, however, check whether it should forward...
    if(message.serviceMode !== "pipeline" || message.routes.length === 0) return false;
    //Create the local repo request (could be a search or read)...
    var localRepoRequest = messageMap.request.getRequestMessage(message);
    //Forward...
    console.log("FHIR API service READ message out: " + JSON.stringify(localRepoRequest,null,2));
    forward(localRepoRequest, jwt, function(responseObj) {
        sendBack(responseObj);
    });
}
