angular.module('buttons', [])
    .controller('buttonCtrl', ButtonCtrl)
    .factory('buttonApi', buttonApi)
    .factory('transactionApi', transactionApi)
    .constant('apiUrl', 'http://localhost:1337'); // CHANGED for the lab 2017!


function ButtonCtrl($scope, buttonApi, transactionApi) {

    // Define variables and functions used throughout the web page
    $scope.testOutput = testOutput;
    $scope.buttons = []; //Initially all was still
    $scope.transaction = [];
    $scope.errorMessage = '';
    $scope.isLoading = isLoading;
    $scope.refreshButtons = refreshButtons;
    $scope.buttonClick = buttonClick;
    $scope.buttonRemove = buttonRemove;
    $scope.getButtonDesc = getButtonDesc;
    $scope.getTotal = getTotal;
    $scope.total = [];
    $scope.cancelOrder = cancelOrder;
    $scope.finishOrder = finishOrder;
    $scope.logged_in = true;
    $scope.logIn = logIn;
    $scope.uname = '';
    $scope.pword = '';

    var loading = false;

    // Request the current purchase be voided
    function cancelOrder() {
        $scope.errorMessage = '';
        // Tell the server to void the current cart
        buttonApi.voidOrder()
            .success(function (rows) {
                // If it fails, return what's in the cart
                getTransactionTableData();
            })
            .error(function () {
                // Otherwise display error
                $scope.errorMessage = "Unable click";
            });
    }

    // A simple variable swap log-out system
    function logOut() {
        console.log("Logged out");
        $scope.logged_in = !$scope.logged_in;
    }

    function isLoading() {
        return loading;
    }

    // Load all of the till buttons
    function refreshButtons() {
        loading = true;
        $scope.errorMessage = '';

        // Request all the buttons from the server / DB
        buttonApi.getButtons()
            .success(function (data) {
                // Store all the buttons in an array
                $scope.buttons = data;

                // Say the website is done loading all the elements
                loading = false;
            })
            .error(function () {
                // If fail, say the website is done loading all the elements, and display an error message
                $scope.errorMessage = "Unable to load Buttons:  Database request failed";
                loading = false;
            });
    }

    // What to do when an item button is clicked
    function buttonClick($event) {
        $scope.errorMessage = '';

        // Request the server to update the current transaction with whatever item was selected.
        buttonApi.clickButton($event.target.id)
            .success(function (rows) {

                // If it succeeds, set the columns received to be the json list of the current items in the transaction.
                $scope.transaction = rows;
                $scope.getTotal();
            })
            .error(function () {
                // Else display error
                $scope.errorMessage = "Unable click";
            });
    }

    // A simple login system
    function logIn(uname, pword) {

        // Request the server 'log us in' as a certain user with a password
        buttonApi.logInUser(uname, pword).success(function (rows)
        {
            // On success, change our login status
           $scope.logged_in = rows;
        }).error(function (rows)
        {
            // On fail, display "failed to login"
            $scope.errorMessage = "Username / Password incorrect";
        });
    }

    // Simple function to sum the total of the current transaction
    function getTotal() {
        $scope.total = 0;

        // For every entry in transaction, multiple its price times quantity and add to the total
        $scope.transaction.forEach(function (item) {
            $scope.total += item.price * item.quantity;
        });
    }

    // Simple function to remove an entry from the transaction list
    function buttonRemove($event, id) {
        $scope.errorMessage = '';

        // Request the server remove the item in the transaction list with a given id
        buttonApi.removeButton(id)
            .success(function (rows) {
                // On success, update the transaction
                $scope.transaction = rows;
                $scope.getTotal();
            })
            .error(function () {
                // On fail, display error
                $scope.errorMessage = "Unable to Remove";
            });
    }

    // Function to get information abotu a button
    function getButtonDesc(id) {
        // If there is no label return empty string
        if (!$scope.buttons[id - 1]) {
            return '';
        } else {
            // If there is a label return it
            return $scope.buttons[id - 1].label;
        }
    }

    // Get information about the items in the current transaction table on the server / database
    function getTransactionTableData() {
        loading = true;
        $scope.errorMessage = '';

        // Request the current transaction table entries from the server
        transactionApi.getTransaction()
            .success(function (rows) {

                // On success update the local transaction variable
                $scope.transaction = rows;
                loading = false;

                // Total the transaction table
                $scope.getTotal();
            })
            .error(function () {
                // On Failure, display an error message
                $scope.errorMessage = "Unable to load Transaction Data";
                loading = false;
            });
    }

    // A function to complete a transaction
    function finishOrder(user)
    {
        // Total the transaction table a final time
        $scope.getTotal();

        // Request the server to complete the transaction using the current logged in user and the local total to complete it.
        buttonApi.saleOrder(user, $scope.total)
            .success(function (rows)
            {
                // Get information on the current transaction table from the server
                getTransactionTableData();

                // For every item in the result we get back from the first call (saleOrder), go through and get information about that row
                var items = "";
                for(var i = 0; i < rows.length; i++)
                {
                    // Getting items and adding them to a string such as name, quantity, and price.
                    items += "Item: " + rows[i].notes + " Quantity: " + rows[i].quantity + " Price: " + rows[i].price + "\n";
                }

                // Display a popup receipt for the purchase
                alert("Your CSCI friendly receipt is:\nHappy-to-exist Staff Member: " +
                    rows[0].user + "\nTime: " +
                    rows[0].duration + " \nTransactionID: " +
                    rows[0].transactionID + "\n" + items

                );
            })
            .error(function () {
                // If failure, display an error
                $scope.errorMessage = "Unable to make sale";
            });
    }

    refreshButtons();  // Make sure all the buttons are loaded
    getTransactionTableData(); // Make sure the current transaction table is up to date.
}

// An "API" for our buttons to use, which controls all the server querying.
function buttonApi($http, apiUrl) {
    return {
        // Requests all the buttons from the server
        getButtons: function ()
        {
            // Construct the url
            var url = apiUrl + '/buttons';

            // Actually perform the request at the specific url
            return $http.get(url);
        },

        // Send a button click event to the server -- in this case, to add an item to the transaction
        clickButton: function (id) {
            var url = apiUrl + '/click?id=' + id;
            var result = $http.get(url); // Easy enough to do this way
            return result;
        },

        // Requests the server remove an item from the transaction table
        removeButton: function (id) {
            var url = apiUrl + '/remove?id=' + id;
            return $http.get(url);
        },

        // Request a login from the server using a username and password
        logInUser: function (uname, pword) {
            var url = apiUrl + '/login?uname=' + uname + '&pword=' + pword;
            return $http.get(url);
        },

        // Request the server destroy the current transaction
        voidOrder: function () {
            var url = apiUrl + '/voidOrder';
            return $http.get(url);
        },

        // Request the server complete a transaction
        saleOrder: function (user, total) {
            var url = apiUrl + '/sale?user=' + user + '&total=' + total;
            return $http.get(url);
        }
    };
}

// An API for our transactions
function transactionApi($http, apiUrl) {
    return {
        // Request the server give us information about the transaction
        getTransaction: function () {
            var url = apiUrl + '/transaction';
            return $http.get(url);
        }
    };
}
