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
	var login = req.body.username;
		
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
					req.session.user_id = row.id;
				}
			});
				
			query.on('end', () => {
				done();
				if(exist)
				{
					console.log("You successfuly log in web store");

					res.render('welcomePage', {user: req.session.user});
				}
				else
				{
					req.session.destroy();
					res.render('loginPage');
				}
			});
		});
});

app.get('/registr', function(req, res){
	res.render('registration');
});
app.post('/registrations', function (req, res) {
	var auth = false;


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
		pg.connect(conStr, (err, client, done) => {

			if(err) {
		  		done();
		  		console.log(err);
		  		return res.status(500).json({success: false, data: err});
			}
		
			var values = {user_name: "", is_admin: false, thing_names: [], thing_prices: []};
			values.user_name = req.session.user;
			values.is_admin  = req.session.admin;

			const query = client.query('SELECT orders.user_id, things.name, things.price FROM orders, things WHERE orders.thing_id = things.id;', function(err, result) {

				var j = 0;
				for (var i =  0; i < result.rows.length ; i++) {
						
					if(result.rows[i].user_id ==  req.session.user_id)
					{
						values.thing_prices[j] = result.rows[i].price;
						values.thing_names[j++]  = result.rows[i].name;
					}
				};
			});

			query.on('end', () => {
		  		done();

		  		if(req.session.admin)
					res.render('adminPage', values);
				else
					res.render('userPage', values);
		  	});
		
		});
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
				for (var i =  0; i < end_point ; i++) {
						
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


		const query = client.query(('SELECT * FROM things WHERE things.id = ' + req.params.id+ ';'), function(err, result) {

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

			if(err) {
			  	done();
			  	console.log(err);
			  	return res.status(500).json({success: false, data: err});
			}


			const query = client.query('SELECT * FROM things WHERE things.id = '+req.params.id+ ';', function(err, result) {

				if(result.rows[0].count > 0)
				{
					if(!req.session.store)
					{
						req.session.store = [];
						req.session.store[0] = result.rows[0].id;
					}
					else
						req.session.store[req.session.store.length+1] = result.rows[0].id;
				}
				else
					res.send("Sorry. These things are over!");
					
			});

			query.on('end', () => {
				done();

				res.send("You buy this thing");
			});
		});
	}
});

app.get('/bucket', function(req,res)
{
		var values = { user: "", isAdmin: false, costs: [], names: [], srcs: []};
		values.user = req.session.user;
		values.isAdmin = req.session.admin;

	pg.connect(conStr, (err, client, done) => {
		if(err) {
			done();
			console.log(err);
			return res.status(500).json({success: false, data: err});
		}

		const query = client.query('SELECT * FROM things;', function(err, result) {

			var j = 0;
			if(req.session.store)
			{
				for (var k = 0; k <= req.session.store.length; k++) 
				{
					for (var i =  0; i < result.rows.length; i++) 
					{
						if(result.rows[i].id == req.session.store[k])
						{
							values.costs [j]   = result.rows[i].price;
							values.names [j]   = result.rows[i].name;
							values.srcs  [j++] = result.rows[i].img_src;
						}
					}
				}
			}

		});
			
		query.on('end', () => {
			done();
			res.render('bucket', values);
		});
	});
});

app.use(function(req, res, next) {
	res.send(404, "Page not found, Sorry");
});


http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + config.get('port'));
});