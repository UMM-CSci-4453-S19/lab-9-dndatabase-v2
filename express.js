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

		// Then once it's finished...
        pRes.then( function (val)
		{
			// ... send the result to the client
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

// Performs an SQL query to get all information about an item with id and returns the result of the query
var getPriceFromID = function(id)
{
	var sql = "SELECT * FROM prices WHERE id = " + id
	return DoQuery(sql);
}

// Adds an item to the current transaction table and returns the result of the query
var addToTransaction = function(rows)
{
	var id = rows[0].id;
	var price = rows[0].price;

	// This line attempts to insert in whatever value and price of an item into the table
	// If it already exists (ON DUPLICATE KEY UPDATE), instead of adding it, it simply updates that row by adding 1 to the quantity
	var sql = "INSERT INTO transaction (id, quantity, price, timestamp) VALUES (" + id + ", 1, " + price + ", (SELECT NOW())) ON DUPLICATE KEY UPDATE quantity = quantity + 1, `timestamp` = `timestamp`";

	return Promise.resolve(DoQuery(sql));
}

// Performs an SQL query to get everything from the transaction table and returns it
var refreshTransactionTable = function(rows)
{
	var sql = "SELECT * FROM transaction";
	return Promise.resolve(DoQuery(sql));
}

app.get("/click", function(req, res)
{
	// Get an id from a parameter in the request, which looks like https://www.rj.site/click?id=...
	var id = req.param('id');

	// Performs an SQL query getting everything from the inventory table with an id of id
	var sql = "SELECT * FROM inventory WHERE inventory.id = " + id;
	var pResult = DoQuery(sql);

	// Once the query is done...
	var clickResolve = Promise.resolve(pResult);
	clickResolve.then(function(val)
	{
		// Perform a series of functions, one after the other, waiting for the previous to finish before moving on
		getPriceFromID(val[0].id).then(addToTransaction).then(refreshTransactionTable).then(function(rows)
		{
			// Finally send back the result of everything (the last being the updated transaction table) to the client
			res.send(rows);
		});

	});

});

// As its name implies, it removes ALL of an item from the transaction table
app.get("/remove", function(req, res)
{
	// Get an id from a parameter in the request, which looks like https://www.rj.site/click?id=...
	var id = req.param('id');

	// Performs an SQL query to remove a row from transaction with a given id
	var sql = "DELETE FROM transaction WHERE id = " + id;
	var pResult = DoQuery(sql);

	// When the query finishes...
	var pResolve = Promise.resolve(pResult);
	pResolve.then(refreshTransactionTable).then(function(rows)
	{
		//... send the result back to the client
		res.send(rows);
	});;

});

var VoidSale = function()
{
	// Could use TRUNCATE as well, but both function the same
    var sql = 'DELETE FROM transaction';

    // Do the Query
    var pResult = DoQuery(sql);

    // Wait for it to finish
    var pResolve = Promise.resolve(pResult);

    // Return
    return pResolve;
}

app.get("/login", function(req, res)
{
	// Get username and password from the URL
    var uname = req.param('uname');
    var pword = req.param('pword');

    // Generate a statement from the username and password
    var sql = "SELECT * FROM employeeLogin WHERE username = '" + uname + "' AND password = '" + pword + "';";

    // Wait for it to finish
    var pResult = DoQuery(sql);

    // Once it's done, see if we found any rows. If we did, then it's a valid login.
    var pResolve = Promise.resolve(pResult);
    pResolve.then(function(rows)
    {
        //If the result is not null we found a valid login
		if(!rows[0])
		{
			res.send(true);
		}
		else
		{
			// If nothing was found it's invalid
			res.send(false);
		}
    });
});

app.get('/voidOrder', function (req, res)
{
	// Call void sale then...
	VoidSale().then(function()
	{
		// ...send the result
    	res.send('voided');
	});;
});

app.get('/sale', function (req, res)
{
	// Get the current user and the total sale price from the url
	var user = req.param('user');
	var total = req.param('total');

	// This SQL is added into our 'main' sql statement. This specific line gets the difference in time from the beginning of the transaction, and the end
	var timeStampDiff = "(SELECT TIMEDIFF((SELECT NOW()), (SELECT `timestamp` FROM transaction ORDER BY `timestamp` ASC LIMIT 1)))";

	// Construct SQL statement. It's quiet lengthy, but each the main focus is to get all relevant fields of information from the transaction table, as well as generating new fields while the sql is happening (time is done here)
	var sql = "INSERT INTO archive (id, quantity, price, transactionID, user, startTime, stopTime, duration, total) " +
		"SELECT id, quantity, price, (SELECT (MAX(transactionID) + 1) FROM archive) as `maxid`, '" + user + "', (SELECT `timestamp` FROM transaction ORDER BY `timestamp` ASC LIMIT 1), (SELECT NOW()), " + timeStampDiff + ", " + total + " FROM transaction";

	// Run the query, and wait for it to finish.
	var pResult = DoQuery(sql);
	var pResolve = Promise.resolve(pResult);
	pResolve.then(function()
	{
		// Once we have the results from the query, void the transaction...
		VoidSale().then(function()
		{
			// ...then construct another sql statement to get the important bits for a receipt (item name, how many, the cashier, total, etc)
			var sql = "SELECT archive.id, quantity, archive.price, transactionID, user, duration, total, prices.notes FROM archive INNER JOIN prices ON archive.id=prices.id WHERE transactionID=(SELECT MAX(transactionID) from archive)";

			// Do the query
			var pResult = DoQuery(sql);
			var pResolve = Promise.resolve(pResult);

			// Once it's done, send back a json 'recipe' to the client.
			pResolve.then(function(rows)
			{
				res.send(rows)
			})

		});
	});
});

//Enable our 'listeners'
sendTransaction();
getCurrentTransaction().then(processCurrentTransaction);
getDBButtons().then(processDBButtons);
