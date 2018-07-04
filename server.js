var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var User = require('./app/models/user');
var UserService = require('./app/services/UserService');
var userSrv = new UserService('users.json');
var port = process.env.PORT || 4000; 
app.set('superSecret', 'test_task'); 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));

app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8085');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-access-token');
	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
});

app.post('/register', function (req, res) {
	var id = Math.max.apply(null, userSrv.all().map(u => u.id));
	var isSubagent = !!req.body.parentAgentId;
	var password = req.body.password;
	var username = req.body.username;
	if (isSubagent) {
		username = `subagent${id + 1}`;
		password = '123456';
	}
	var hash = crypto.createHash('md5').update(password).digest('hex');
	var user = new User({
		id: id + 1,
		title: req.body.title,
		username: username,
		password: hash,
		parentAgentId: +req.body.parentAgentId
	});

	userSrv.add(user);
	res.json({ success: true, user: user });
});

app.post('/authenticate', function (req, res) {
	var user = userSrv.getByUsername(req.body.username);
	var hash = crypto.createHash('md5').update(req.body.password).digest('hex');

	if (!user) {
		res.status(403).send({ success: false, message: 'Ошибка аутентификации. Такого логина не существует.' });
	} else if (user) {
		if (user.password !== hash) {
			res.status(403).send({ success: false, message: 'Ошибка аутентификации. Неверный пароль.' });
		} else {
			var token = jwt.sign(
				{ admin: true }, 
				app.get('superSecret'), 
				{ expiresIn: 86400 });
			res.json({
				success: true,
				user: user,
				token: token
			});
		}
	}
});

var apiRoutes = express.Router();

apiRoutes.use(function (req, res, next) {
	var token = req.body.token || req.query['token'] || req.headers['x-access-token'];
	if (token) {
		jwt.verify(token, app.get('superSecret'), function (err, decoded) {
			if (err) {
				return res.json({ success: false, message: 'Ошибка аутентификации.' });
			} else {
				req.decoded = decoded;
				next();
			}
		});
	} else {
		return res.status(403).send({
			success: false,
			message: 'Отсутствует токен.'
		});
	}
});

apiRoutes.get('/users', function (req, res) {
	var users = userSrv.all();
	if (req.query.parentAgentId) {
		users = userSrv.all(req.query.parentAgentId);
	} else if (req.query.title) {
		users = userSrv.getByTitle(req.query.title);
	}
	res.json(users);
});

apiRoutes.get('/users/:id', function (req, res) {
	res.json(userSrv.getById(req.params.id));
});

apiRoutes.post('/pay', function (req, res) {
	var user = userSrv.getById(req.body.agentId);
	var userAuthor = userSrv.getById(req.body.authorAgentId);
	if (user === userAuthor) {
		//Пополняем счет
		userAuthor.balance += +req.body.summ;
		res.json({
			success: true,
			agent: user
		});
	} else if (userAuthor.balance > 0 && (userAuthor.balance - req.body.summ) >= 0) {
		//Переводим на счет
		user.balance += +req.body.summ;
		userAuthor.balance -= req.body.summ;
		res.json({
			success: true,
			agent: user,
			author: userAuthor
		});
	} else {
		res.json({ success: false, message: 'Недостаточной средств.' })
	}
});

app.use('/api', apiRoutes);
app.listen(port);
console.log('Magic happens at http://localhost:' + port);
