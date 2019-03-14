angular.module('buttons',[])
  .controller('buttonCtrl',ButtonCtrl)
  .factory('buttonApi',buttonApi)
  .constant('apiUrl','http://localhost:1337'); // CHANGED for the lab 2017!

function ButtonCtrl($scope,buttonApi){
   $scope.buttons=[]; //Initially all was still
   $scope.transaction=[];
   $scope.errorMessage='';
   $scope.isLoading=isLoading;
   $scope.refreshButtons=refreshButtons;
   $scope.buttonClick=buttonClick;
   $scope.buttonRemove=buttonRemove;
   $scope.getButtonDesc = getButtonDesc;

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
		})
        	.error(function(){$scope.errorMessage="Unable click";});
 	}
	
	function buttonRemove($event, id)
	{	
		$scope.errorMessage='';
     		buttonApi.removeButton(id)
        	.success(function(rows){
		console.log('got remove!!!')		
		console.log(rows);			
		transaction = rows;
		})
        	.error(function(){$scope.errorMessage="Unable click";});
	}

	function getButtonDesc(id) {
	  if(id > $scope.buttons.length){
	    return '';		
	      } else {
		return $scope.buttons[id-1].label;
	      }
	}

  	refreshButtons();  //make sure the buttons are loaded
	
	
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

