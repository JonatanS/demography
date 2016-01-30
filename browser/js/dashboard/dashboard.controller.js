//https://github.com/ManifestWebDesign/angular-gridster/blob/master/demo/dashboard/script.js
app.controller('DashboardCtrl', function ($scope, $timeout, GraphService){
    $scope.editMode = false;
    //tons of options: https://github.com/ManifestWebDesign/angular-gridster
    $scope.gridsterOptions = {
        margins: [12, 12],  //spacing between widgets
        columns: 12,        // min widget size
        draggable: {
            handle: '.box-header',    // optional if you only want a specific element to be the drag handle
            enabled: false
        },
        resizable:{
            enabled: false,
            stop: function(a,b,c){  //On resize stop, this call back fires (relabel a,b,c)
                GraphService.resize(c.id);
            }
            //handles: ['n', 'e', 's', 'w', 'se', 'sw']
        },
        maxSizeX: 6, // maximum column width of an item
        minSizeX: 2, // minimum column width of an item
        minSizeY: 2, // minimum column width of an item
        minRows: 2, // the minimum height of the grid, in rows

        mobileBreakPoint: 600, // if the screen is not wider that this, remove the grid layout and stack the items
        mobileModeEnabled: true, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
    };

    $scope.dashboard = {
            id: 1,
            name: 'My First Dashboard',
            widgets: [{
                id: 1,
                col: 0,
                row: 0,
                sizeY: 2,
                sizeX: 2,
                name: "Widget 1",
                type: 'widget'
            }, {
                id: 2,
                col: 2,
                row: 1,
                sizeY: 4,
                sizeX: 4,
                name: "Graph 2",
                type: 'graph'
            }]
    };

    $scope.dashboard.nextWidgetId = 3;

    $scope.chartTypes = {
        graphs:[
            {id:'barChart', name:'Bar Chart'},
            {id:'pieChart', name:'Pie Chart'}
        ]
    };

    $scope.toggleEditMode = function() {
        $scope.editMode = !$scope.editMode;
        $scope.gridsterOptions.resizable.enabled = !$scope.gridsterOptions.resizable.enabled;
        $scope.gridsterOptions.draggable.enabled = !$scope.gridsterOptions.draggable.enabled;
    };

    $scope.clear = function() {
        $scope.dashboard.widgets = [];
    };

    $scope.addWidgetPlaceholder = function() {
        $scope.dashboard.widgets.push({
            //default widget settings
            id: $scope.dashboard.nextWidgetId,
            name: "New Widget",
            type: 'widget',
            sizeX: 2,
            sizeY: 2
        });
        $scope.dashboard.nextWidgetId ++;
    };

    $scope.addGraphPlaceholder = function() {
        $scope.dashboard.widgets.push({
            id: $scope.dashboard.nextWidgetId,
            name: "New Graph",
            type: 'graph',
            sizeX: 4,
            sizeY: 4
        });
        $scope.dashboard.nextWidgetId ++;
    };

    $scope.addTextPanelPlaceholder = function() {
        $scope.dashboard.widgets.push({
            id: $scope.dashboard.nextWidgetId,
            name: "New Text Panel",
            type: 'text',
            sizeX: 4,
            sizeY: 1
        });
        $scope.dashboard.nextWidgetId ++;
    };

    $scope.addGraph = function(graphId) {
        if($scope.chartTypes.selectedType) {
            GraphService.create(graphId,$scope.chartTypes.selectedType, 'League','HR','sum')
        }
    }

    // $scope.$watch('selectedDashboardId', function(newVal, oldVal) {
    //     if (newVal !== oldVal) {
    //         $scope.dashboard = $scope.dashboards[newVal];
    //     } else {
    //         $scope.dashboard = $scope.dashboards[1];
    //     }
    // });
});
