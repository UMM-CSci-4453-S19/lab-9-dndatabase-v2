mysql = require('mysql'),
dbf = require('./gamemaster.dbf-setup.js');
var express=require('express'),
app = express(),
port = process.env.PORT || 1337;

app.use(express.static(__dirname + '/public'));
app.listen(port);

// Performs an SQL query and returns the result in json
var getDBButtons = function(temp)
{
	var sql = "SELECT * FROM till_buttons";
	return dbf.query(mysql.format(sql));	
}

// Takes in json from an previous SQL query and returns it to the client
var processDBButtons = function(rows)
{
	app.get("/buttons",function(req, res)
	{
	  res.send(rows);
	});
}

// Sends, to the client, the current items in the transaction 
var sendTransaction = function()
{
    app.get("/transaction", function(req, res)
    {
	// Promise.resolve will wait until getCurrentTransaction() finishes...
    	var pRes = Promise.resolve(getCurrentTransaction());
		
	// Then once it's finished, send the values to the client
        pRes.then( function (val)
	{
            res.send(val);
	});
    });
}

// Gets the current items in the transactions and returns it as json
var getCurrentTransaction = function()
{
	var sql = "SELECT * FROM transaction";
	return dbf.query(mysql.format(sql));
}

// Sends the current items in the transaction back to the client
var processCurrentTransaction = function(rows)
{
	app.get("/list", function(req, res)
	{
		res.send(rows);
	});
}

//Shortcut function so that we don't have to type dbf.query(mysql.format(sql)) each time
var DoQuery = function(sql)
{
	return dbf.query(mysql.format(sql));
}

// Performs an SQL query to get all information about an item with id
var getPriceFromID = function(id)
{
	var sql = "SELECT * FROM prices WHERE id = " + id
	return DoQuery(sql);
}

var addToTransaction = function(rows)
{
	var id = rows[0].id;
	var price = rows[0].price;

	var sql = "INSERT INTO transaction VALUES (" + id + ", 1, " + price + ") ON DUPLICATE KEY UPDATE quantity = quantity + 1;";

	return Promise.resolve(DoQuery(sql));
}

var refreshTransactionTable = function(rows)
{
	var sql = "SELECT * FROM transaction";
	return Promise.resolve(DoQuery(sql));
}


var onClick = function()
{
	app.get("/click", function(req, res)
	{
		//www.rj.site/click?id= 
		var id = req.param('id');
		
		var sql = "SELECT * FROM inventory WHERE inventory.id = " + id;

		var pResult = DoQuery(sql);
		var clickResolve = Promise.resolve(pResult);
		clickResolve.then(function(val)
		{
			getPriceFromID(val[0].id).then(addToTransaction).then(refreshTransactionTable).then(function(rows)
			{
				res.send(rows);
			});

		});
		
	});
}

var removeItem = function()
{
	//Takes an ?id = , which may or may not be helpful?..
	app.get("/remove", function(req, res)
	{
		var id = req.param('id');
		
		var sql = "DELETE FROM transaction WHERE id = " + id;
		var pResult = DoQuery(sql);
		
		var pResolve = Promise.resolve(pResult);
		
		pResolve.then(refreshTransactionTable).then(function(rows)
		{
			res.send(rows);
		});;
		
	});
}

onClick();
removeItem();
sendTransaction();
getCurrentTransaction().then(processCurrentTransaction);
getDBButtons().then(processDBButtons);








