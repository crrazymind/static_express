module.exports = function(app)
{
	fs = require('fs');

	nconf = require('nconf'),
	Recaptcha = require('recaptcha').Recaptcha;

	// home page
	app.get('/', function(req, res)
	{
		res.render('index', { title: 'Currency Chart' })
		console.log(1);
		//res.render('index.html');
	});


	var stockData = {
		x : [],
		y: []
	}
	for (var i = 500; i >= 0; i--) {
		stockData.x.push(new Date().setSeconds(new Date().getSeconds() - i));
		stockData.y.push(Math.random());
	};


	var scaleCoeff = 0.5;
	setInterval(function(){
		scaleCoeff = Math.random()*2;
	},5000);
	setInterval(function(){
		var val = Math.random()*0.5 + scaleCoeff;
		stockData.y.push(val);
		stockData.x.push(new Date().getTime());
	},1000);

	/*var stockData = {
		x: [new Date().setSeconds(new Date().getSeconds() - 5), new Date().setSeconds(new Date().getSeconds() - 4), new Date().setSeconds(new Date().getSeconds() - 3), new Date().setSeconds(new Date().getSeconds() - 2), new Date().setSeconds(new Date().getSeconds() - 1)],
		y: [0.5, 0.75, 0.01, 0.99, 1]
	}*/
	app.get('/getData', function(req, res)
	{
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.write(JSON.stringify(stockData));
		res.end();
	});
}
