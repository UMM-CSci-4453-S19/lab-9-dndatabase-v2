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

// On Button Click...
// Get information on the price of an item based on ID
// Get information about the item ID in the context of transactions (If there already an ID? If so, how many items are in it)
// Attempt to insert into the tranaction table (If ID already exists, do something differently)
// Send the updated transaction table back to Client

var DoQuery = function(sql)
{
	return dbf.query(mysql.format(sql));
}

var getPriceFromID = function(id)
{
	var sql = "SELECT * FROM prices WHERE id = " + id
	return DoQuery(sql);

	//Know: ID and Price
	//Missing: Quantity
}

var doesItemExistInTransaction = function(rows)
{
	var id = rows[0].id;
	
	var sql = "SELECT * FROM transaction WHERE id = " + id;
	var result = Promise.resolve(DoQuery(sql));

	result.then(function(val)
	{
		if(val[0] == null)
		{
			//Item does not exist in transactions
			return addToTransaction(rows);
			
		}
		else
		{
			return updateTransactionTable(rows);
		}
	});
}

var addToTransaction = function(rows)
{
	var id = rows[0].id;
	var price = rows[0].price;
	
	var sql = "INSERT INTO transaction VALUES (" + id + ", 1, " + price + ")";
	return Promise.resolve(DoQuery(sql));
}

var updateTransactionTable = function(rows)
{
	var id = rows[0].id;
	
	var sql = "UPDATE transaction SET quantity = quantity + 1 WHERE id = " + id;
	return Promise.resolve(DoQuery(sql));
}

var refreshTransactionTable = function()
{
	sql = "SELECT * FROM transaction";
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
			//console.log(val[0].item);
			//val = JSON.stringify(val);
			
			var result = getPriceFromID(val[0].id).then(doesItemExistInTransaction).then(refreshTransactionTable).then(function(rows)
			{
				console.log(rows);
				res.send(rows);
			});
			
		});
		
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








