angular.module('buttons',[])
  .controller('buttonCtrl',ButtonCtrl)
  .factory('buttonApi',buttonApi)
    .factory('transactionApi',transactionApi)
  .constant('apiUrl','http://localhost:1337'); // CHANGED for the lab 2017!

function ButtonCtrl($scope,buttonApi,transactionApi){
   $scope.buttons=[]; //Initially all was still
   $scope.transaction=[];
   $scope.errorMessage='';
   $scope.isLoading=isLoading;
   $scope.refreshButtons=refreshButtons;
   $scope.buttonClick=buttonClick;
   $scope.buttonRemove=buttonRemove;
   $scope.getButtonDesc = getButtonDesc;
   $scope.getTotal = getTotal;
   $scope.total = []

   var loading = false;

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

