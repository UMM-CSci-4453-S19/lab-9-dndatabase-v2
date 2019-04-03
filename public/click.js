angular.module('buttons',[])
  .controller('buttonCtrl',ButtonCtrl)
  .factory('buttonApi',buttonApi)
    .factory('transactionApi',transactionApi)
  .constant('apiUrl','http://localhost:1337'); // CHANGED for the lab 2017!



function ButtonCtrl($scope,buttonApi,transactionApi){
    $scope.testOutput = testOutput;
    $scope.buttons=[]; //Initially all was still
   $scope.transaction=[];
   $scope.errorMessage='';
   $scope.isLoading=isLoading;
   $scope.refreshButtons=refreshButtons;
   $scope.buttonClick=buttonClick;
   $scope.buttonRemove=buttonRemove;
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

   function testOutput(){
       console.log('something happened!!!');
   }

   function cancelOrder() {
       $scope.errorMessage='';
       buttonApi.voidOrder()
           .success(function(rows){
               getTransactionTableData();
           })
           .error(function(){$scope.errorMessage="Unable click";});
   }

   function finishOrder() {
       console.log('order complete!!!');
   }

   function isLoading(){
    return loading;
   }
  function refreshButtons(){
    loading=true;
    $scope.errorMessage='';
    buttonApi.getButtons()
      .success(function(data){
         $scope.buttons=data;
         loading=false;
      })
      .error(function () {
          $scope.errorMessage="Unable to load Buttons:  Database request failed";
          loading=false;
      });
 }
	function buttonClick($event)
	{
    		$scope.errorMessage='';
     		buttonApi.clickButton($event.target.id)
        	.success(function(rows){
		$scope.transaction=rows;
		$scope.getTotal();
		})
        	.error(function(){$scope.errorMessage="Unable click";});
 	}

  function logIn(uname, pword)
  {
    console.log("Trying to log in...");
    buttonApi.logInUser(uname, pword).success(function(rows)
    {
      if(rows)
      {
        console.log(rows);
          $scope.logged_in=rows
      }
      else
      {
          console.log('no success!!!');
          $scope.logged_in=rows
      }
    });
  }

 	function getTotal() {
        $scope.total = 0;
        $scope.transaction.forEach(function(item) {
            $scope.total += item.price * item.quantity;
        });
    }

	function buttonRemove($event, id)
	{
		$scope.errorMessage='';
     		buttonApi.removeButton(id)
        	.success(function(rows){
		$scope.transaction = rows;
		$scope.getTotal();
		})
        	.error(function(){$scope.errorMessage="Unable to Remove";});
	}

	function getButtonDesc(id) {
	  if(!$scope.buttons[id-1]){
	    return '';
	      } else {
	      return $scope.buttons[id-1].label;
	      }
	}
	function getTransactionTableData() {
        loading=true;
        $scope.errorMessage='';
        transactionApi.getTransaction()
            .success(function(rows){
                $scope.transaction=rows;
                loading=false;
                $scope.getTotal();
            })
            .error(function () {
                $scope.errorMessage="Unable to load Transaction Data";
                loading=false;
            });
    }

  	refreshButtons();  //make sure the buttons are loaded
    getTransactionTableData();


}

function buttonApi($http,apiUrl){
  return{
    getButtons: function(){
      var url = apiUrl + '/buttons';
      return $http.get(url);
    },
    clickButton: function(id){
      var url = apiUrl+'/click?id='+id;
      var result = $http.get(url); // Easy enough to do this way
      return result;
    },
	removeButton: function(id){
		var url = apiUrl + '/remove?id='+id;
		return $http.get(url);
	},

  logInUser: function(uname, pword)
  {
    var url = apiUrl + '/login?uname=' + uname + '&pword=' +pword;
    return $http.get(url);
  },
  voidOrder: function() {
	    var url = apiUrl + '/voidOrder';
	    return $http.get(url);
  }
 };
}

function transactionApi($http,apiUrl){
    return{
        getTransaction: function(){
            var url = apiUrl + '/transaction';
            return $http.get(url);
        }
    };
}
