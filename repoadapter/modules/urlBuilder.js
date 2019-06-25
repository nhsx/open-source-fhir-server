var _ = require('underscore');

var urlBuilder = {
    createUrlFromQuery:function(resourceType, queryParameters) {
        /*
            NOTE: Query String Key/Value pairs are grouped by Key (so, _include=x&_include=y will be present in query params as "_include":["x","y"])
            This could cause problems when creating, for example, link resources, especially self, as the link.url will be incorrect (_include=x,y)
        */
        var rawSearchUrl = resourceType + "?";
        
        for(key in queryParameters)
        {
            var value = queryParameters[key];
            if(_.isArray(value))
            {
                value.forEach(function(item) {
                    rawSearchUrl = rawSearchUrl + key + "=" + item + "&";
                });
            }
            else 
            {
                rawSearchUrl = rawSearchUrl + key + "=" + value + "&";
            }
        }
        //Strip off trailing &
        rawSearchUrl = rawSearchUrl.substring(0,rawSearchUrl.length-1);
    
        return rawSearchUrl;
    }
}

module.exports = {
    urlBuilder
}