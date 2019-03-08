mysql = require('mysql');
dbf = require('./gamemaster.dbf-setup.js');

var express = require('express'),
app = express(),
port = process.env.PORT || 1337;

app.use(express.static(__dirname + '/public'));
app.listen(port);

var getDBButtons = function(temp)
{	
	var sql = "SELECT * FROM till_buttons";
	return dbf.query(mysql.format(sql));	
}

var processDBButtons = function(rows)
{
	app.get("/buttons",function(req, res)
	{
	  res.send(rows);
	});
}

var clickButton = function()
{
	app.get("/click", function(req, res))
	{
		var sql = "SELECT price FROM prices WHERE id = " + button.buttonID; 
	}
}

dbf = getDBButtons().then(processDBButtons);
