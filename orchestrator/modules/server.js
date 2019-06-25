var server = {
    host:'localhost',
    isProxied:false,
    httpPort:'8080',
    httpsPort:'8443',
    path:'/fhir/stu3/',
    setResourceLocation:function(req,res,resourceType,resourceId) {
        //TODO: Version headers... ETag etc...
        var location = (this.isProxied ? 'https' : 'http') + '://' + this.host + ':' + 
            (this.isProxied ? this.httpPort : this.httpsPort) + this.path;

        res.set('Location', location + resourceType + '/'+ resourceId);
    }
}

module.exports = {
    server
}