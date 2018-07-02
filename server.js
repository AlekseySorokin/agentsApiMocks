// =================================================================
// get the packages we need ========================================
// =================================================================
var express 	= require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var crypto = require('crypto');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model
var UserService  = require('./app/services/UserService');
var userSrv = new UserService('users.json');


var users = [];

// =================================================================
// configuration ===================================================
// =================================================================
var port = process.env.PORT || 4000; // used to create, sign, and verify tokens
//mongoose.Promise = global.Promise;
//mongoose.Promise = require('bluebird');
//mongoose.connect(config.database, { useMongoClient: true }); // connect to database
//mongoose.Promise = require('bluebird');
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-access-token');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

// =================================================================
// routes ==========================================================
// =================================================================
app.post('/register', function(req, res) {
	var hash = crypto.createHash('md5').update(req.body.password).digest('hex');
	
	// create a sample user
	var user = new User({ 
		title: req.body.title,
		username: req.body.username, 
		password: hash,
		parentAgentId: req.body.parentAgentId
	});
	
	userSrv.add(user);
	res.json({ success: true });
});

// ---------------------------------------------------------
// authentication (no middleware necessary since this isnt authenticated)
// ---------------------------------------------------------
// http://localhost:8080/authenticate
app.post('/authenticate', function(req, res) {
	// find the user
	var user = userSrv.getByUsername(req.body.username);
	var hash = crypto.createHash('md5').update(req.body.password).digest('hex');

	if (!user) {
		res.json({ success: false, message: 'Authentication failed. User not found.' });
	} else if (user) {

		// check if password matches
		if (user.password !== hash) {
			res.json({ success: false, message: 'Authentication failed. Wrong password.' });
		} else {

			// if user is found and password is right
			// create a token
			var token = jwt.sign({ admin: true }, app.get('superSecret'), {
				expiresIn: 86400 // expires in 24 hours
			});

			res.json({
				success: true,
				message: 'Enjoy your token!',
				token: token
			});
		}		

	}
});

// ---------------------------------------------------------
// get an instance of the router for api routes
// ---------------------------------------------------------
var apiRoutes = express.Router(); 



// ---------------------------------------------------------
// route middleware to authenticate and check token
// ---------------------------------------------------------
apiRoutes.use(function(req, res, next) {
	// check header or url parameters or post parameters for token
	var token = req.body.token || req.query['token'] || req.headers['x-access-token'];
	if (token) {
		// verifies secret and checks exp
		jwt.verify(token, app.get('superSecret'), function(err, decoded) {			
			if (err) {
				return res.json({ success: false, message: 'Failed to authenticate token.' });		
			} else {
				// if everything is good, save to request for use in other routes
				console.log(decoded);
				req.decoded = decoded;	
				next();
			}
		});

	} else {

		// if there is no token
		// return an error
		return res.status(403).send({ 
			success: false, 
			message: 'No token provided.'
		});
		
	}
	
});

apiRoutes.get('/users', function(req, res) {
	res.json(userSrv.all());
});

apiRoutes.get('/check', function(req, res) {
	res.json(req.decoded);
});

app.use('/api', apiRoutes);

// =================================================================
// start the server ================================================
// =================================================================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);
