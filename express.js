mysql = require('mysql'),
dbf = require('./gamemaster.dbf-setup.js');

var express=require('express'),
app = express(),
port = process.env.PORT || 1337;

app.use(express.static(__dirname + '/public'));
app.listen(port);

// Lol commenting
var getDBButtons = function(temp)
{
	var sql = "SELECT * FROM till_buttons";
	return dbf.query(mysql.format(sql));	
}

//RJ
var processDBButtons = function(rows)
{
	app.get("/buttons",function(req, res)
	{
	  res.send(rows);
	});
}

var getCurrentTransaction = function()
{
	var sql = "SELECT * FROM transaction";
	return dbf.query(mysql.format(sql));
}

var processCurrentTransaction = function(rows)
{
	app.get("/list", function(req, res)
	{
		res.send(rows);
	});
}

// On button click
// query information about item
// put information about item into transaction table
// refresh transaction table
// :)

var getInventoryItemInfo = function(sql)
{
	return dbf.query(mysql.format(sql));
}


var onClick = function()
{
	app.get("/click", function(req, res)
	{
		//www.rj.site/click?id= 
		var id = req.param('id');

		var sql = "SELECT * FROM inventory WHERE inventory.id = " + id;

		console.log(sql);
		var result = getInventoryItemInfo(sql);

		console.log(result);
		res.send(result);
		
	});
}

/*app.get("/click",function(req,res){
  var id = req.param('id');
  var sql = 'YOUR SQL HERE'
  console.log("Attempting sql ->"+sql+"<-");

  connection.query(sql,(function(res){return function(err,rows,fields){
     if(err){console.log("We have an insertion error:");
             console.log(err);}
     res.send(err); // Let the upstream guy know how it went
  }})(res));
});*/


// Your other API handlers go here!

onClick();
getCurrentTransaction().then(processCurrentTransaction);
getDBButtons().then(processDBButtons);








