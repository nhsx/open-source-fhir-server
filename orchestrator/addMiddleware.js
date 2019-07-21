module.exports = function(bodyParser, app) {
    app.use(bodyParser.json({limit: '10mb'}));
    app.use(bodyParser.json({type: 'application/fhir+json'}));
    app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));
  };