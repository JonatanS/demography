//https://github.com/ManifestWebDesign/angular-gridster/blob/master/demo/dashboard/script.js
app.controller('WidgetSettingsCtrl', function ($scope, $timeout, $rootScope, $uibModalInstance, widget, graphTypeToCreate, WidgetFactory, GraphService, dataset,element,graphSize) {
    $scope.widget = widget;
    $scope.chartType = graphTypeToCreate;
    //TODO: dropdown for labels from dataset once we have data loaded
    $scope.axisDropdowns = {
        availableOptions : Object.keys(dataset.jsonData[0])
        .map(function(key){
            return {key: key};
        })
    };

    //$scope.groupOptions = [{val:'sum'}, {val:'count'}];

    var selection = {
        group:'count'
    }
    //2-way binding!
    $scope.form = {
        title: widget.title,    //update title
        labelX: widget.labelX,  //update data on X
        labelY: widget.labelY,   //update data on Y
        group: selection.group
    };

    $scope.dismiss = function() {
        $uibModalInstance.dismiss();
    };

    $scope.remove = function() {
        $scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
        $uibModalInstance.close();
    };

    $scope.submit = function() {
        angular.extend(widget, $scope.form); //update widget with settings from form
        $uibModalInstance.close(widget);
        //this widget is used to both create and update graphs. hence this logic:
        if(graphTypeToCreate) {
            //'TEAM', 'AB'
           console.log('graphSize: ',graphSize)
           var chartObj = GraphService.create(element,widget.id,graphTypeToCreate, widget.labelX.key, widget.labelY.key,$scope.form.group,{},graphSize);
           widget.chartObject = chartObj;
        }
        WidgetFactory.update(widget);
    };

});
