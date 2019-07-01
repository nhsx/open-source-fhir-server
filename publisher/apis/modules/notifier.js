var request = require('request');

var notifier = {
    'rest-hook':function(subscriber, subject, callback)
    {
        var requestParameters = {
            uri:subscriber.channel.endpoint,
            method:'POST',
            body:JSON.stringify(subject)
        };
        //Parse the Subscription headers...
        requestParameters.headers = {};
        subscriber.channel.header.forEach(function(header) {
            var keyValuePair = header.split(':');
            var key = keyValuePair[0];
            var value = keyValuePair[1];
            requestParameters.headers[key]=value;
        });
        //Add the content/accept headers...
        requestParameters.headers["accept"] = subscriber.channel.payload;
        requestParameters.headers["content-type"] = subscriber.channel.payload;
        //Send to rest hook...
        request(requestParameters, function(error,response,body) {
            if(response.statusCode !== 200) {
                callback({error: 'Unable to send rest-hook notification: ' + error + ' ' + body})
            } else {
                callback(false);
            }
        });
    },
    notify:function(subscriber, subject, callback) {
        var notifier = this[subscriber.channel.type] || undefined
        if(typeof notifier !== 'undefined') {
            //Copy any tags in this subscription to meta._tag in the subject...
            if(typeof subscriber.tag !== 'undefined' && _.isArray(subscriber.tag) && subscriber.tag.length > 0)
            {
                subject.meta.tag = subject.meta.tag || [];
                subscriber.tag.forEach(function(t) {
                    subject.meta.tag.push(t);
                });
            }
            notifier(subscriber,subject,callback);
        } else {
            callback({error: 'Unsupported channel type ' + subscriber.channel.type});
        };
    }
}

module.exports = {
    notifier
}