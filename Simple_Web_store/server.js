const express = require('express');
const engine = require('ejs-locals');
const http = require('http');
const path = require('path');
const pg = require('pg');
const session = require('express-session');
var bodyParser = require('body-parser');

const config = require('./config/conf.js');
const conStr = config.get('connection_string');

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.use('/css',express.static(path.join(__dirname, 'public/css')));
app.use('/scripts',express.static(path.join(__dirname, 'public/jsFile')));
app.use('/img',express.static(path.join(__dirname, 'resources/things_images')));
app.use('/layouts',express.static(path.join(__dirname, 'views/layouts')));

app.set('port', config.get('port'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('ejs', engine);


app.use(session({
    secret: config.get('session:secret'),
    key: config.get('session:key'),
    cookie: config.get('session:cookie')
}));


app.get('/login', function(req,res) {
	req.session.destroy();
	res.render('loginPage');
})
app.post('/signup', function (req, res) {
	var exist = false;

	var pas1 = req.body.password;
	var pas2 = req.body.password_repeat;
	var login = req.body.username;
		
	if(pas1 == pas2)
	{
		pg.connect(conStr, (err, client, done) => {
			if(err) {
				done();
				console.log(err);
				return res.status(500).json({success: false, data: err});
			}
			const query = client.query('SELECT * FROM users where user_name=($1)', [req.body.username]);

			query.on('row', (row) => {
				if(row.user_password == req.body.password)
				{
					exist = true;
					req.session.user = row.user_name;
					req.session.admin = row.is_admin;
					req.session.store = [];
				}
			});
				
			query.on('end', () => {
				done();
				if(exist)
				{
					console.log("You successfuly log in web store");

					res.render('personalCabinet', {user_name: req.session.user, is_admin: req.session.admin});
				}
				else
				{
					req.session.destroy();
					res.render('loginPage');
				}
			});
		});
	}
	else
	{
		req.session.destroy();
		res.render('loginPage');
	}
});

app.get('/registr', function(req, res){
	res.render('registration');
});
app.post('/registrations', function (req, res) {
	var auth = false;
	console.log(req.body.username);
	console.log(req.body.password);
	console.log(req.body.user_surname);

	if (!req.body.username || !req.body.password || !req.body.user_surname) {
		console.log('failed registration');
	}
	else 
	{
		pg.connect(conStr, (err, client, done) => {

			if(err) {
		  		done();
		  		console.log(err);
		  		return res.status(500).json({success: false, data: err});
			}

			const query = client.query('INSERT INTO users VALUES(($1), ($2), ($3));', [req.body.username, req.body.password, false]);

			query.on('end', () => {
		 		done();
		  		
		  		res.send("You successfuly register in our web store")
			});
		});	
	} 
});

app.get('/myPage', function(req, res){
	if(!req.session.user)
	{
		console.log("At first you must sign in");
		req.session.destroy();
		res.render('loginPage');
	}
	else
	{
		res.render('personalCabinet', {user_name: req.session.user, is_admin: req.session.admin})
	}
});


app.get('/', function(req,res){

		pg.connect(conStr, (err, client, done) => {

			if(err) {
		  		done();
		  		console.log(err);
		  		return res.status(500).json({success: false, data: err});
			}

			if(!req.query.page)
			{
				req.query.page= 0;
			}

			var values = { costs: [], names: [], srcs: [], indexes: [], user: "", length: +0,  page: +0, k: +0, p1: +0};
			values.user = req.session.user;
			values.k = +2;
			values.page = +(req.query.page);
			values.p1 = ((values.page) + +1);

			const query = client.query('SELECT * FROM things;', function(err, result) {

				values.length = result.rows.length;

				var start_point = (+(req.query.page) * +(values.k));
				var end_point = (+(start_point) + +(values.k));


				if(end_point > result.rows.length)
				{
					end_point = result.rows.length;
				}

				var j = +0;
				for (var i =  start_point; i < end_point ; i++) {
						
					values.costs[j] = result.rows[i].price;
					values.names[j] = result.rows[i].name;
					values.srcs[j] = result.rows[i].img_src;
					values.indexes[j] = result.rows[i].id;

					j++;
				};
			});
			
			query.on('end', () => {
		  		done();

		  		res.render('catalog', values);
		  	});
		});
});


app.get('/items/:id', function(req,res){
	
	pg.connect(conStr, (err, client, done) => {
		var value = { cost_: "", name_: "", src_: "", user: ""};
		value.user = req.session.user;

		if(err) {
			done();
			console.log(err);
			return res.status(500).json({success: false, data: err});
		}


		const query = client.query(('SELECT * FROM things WHERE things.id = '+req.params.id+ ';'), function(err, result) {
			
			value.cost_ = result.rows[0].price;
			value.name_ = result.rows[0].name;
			value.src_ = result.rows[0].img_src;
		});

		query.on('end', () => {
			done();

			res.render('items', value);
		});
	});
});


app.post('/buyThink/:id', function(req,res){
	if(!req.session.user)
		res.send("At first you must registr");
	else
	{
		pg.connect(conStr, (err, client, done) => {
			var value = { cost_: "", name_: "", src_: "", count: 0};

			if(err) {
			  	done();
			  	console.log(err);
			  	return res.status(500).json({success: false, data: err});
			}


			const query = client.query('SELECT * FROM things WHERE things.id = '+req.params.id+ ';', function(err, result) {
				value.cost_ = result.rows[0].price;
				value.name_ = result.rows[0].name;
				value.src_ = result.rows[0].img_src;
				value.count = result.rows[0].count;

				if(value.count > 0)
					client.query("UPDATE things SET count = " + (value.count - 1) +" WHERE id = " + req.params.id + ";");
			});

			query.on('end', () => {
				done();

				if(value.count <= 0 )
					res.send("Sorry. These things are over!");
				else
				{	

					res.send("You buy this thing");
				}
			});
		});
	}
});

app.use(function(req, res, next) {
	res.send(404, "Page not found, Sorry");
});


http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + config.get('port'));
});
