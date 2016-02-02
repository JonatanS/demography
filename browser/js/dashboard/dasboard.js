app.config(function ($stateProvider) {
    $stateProvider.state('dashboard', {
        url: '/:userId/datasets/:datasetId/dashboards/:dashboardId',
        templateUrl: 'js/dashboard/dashboard.edit.html',
        controller: 'DashboardCtrl',
        resolve: {
            loggedInUser: function(AuthService ) {
                return AuthService.getLoggedInUser()
                .then(function(user) {
                    return user;
                });
            },
            currentDashboard:function(DashboardFactory, $stateParams ) {
                return DashboardFactory.fetchOne($stateParams.dashboardId)
                .then(function(dash){
                    //merge and return stuff??
                    return dash;
                });
            },
            currentDataset: function(DatasetFactory, $stateParams ) {

                return DatasetFactory.fetchById($stateParams.datasetId)
                .then(function(dataset){
                    return dataset;
                })
            }
        }
    });
});

//https://github.com/ManifestWebDesign/angular-gridster/blob/master/demo/dashboard/script.js
app.controller('DashboardCtrl', function (currentDataset, currentDashboard, loggedInUser, $scope, $timeout, GraphService, DashboardFactory, WidgetFactory){
    $scope.user = loggedInUser;
    $scope.dashboard = currentDashboard;
    if($scope.dashboard.widgets) {
        $scope.dashboard.nextWidgetId = $scope.dashboard.widgets.length ?
            Math.max.apply(Math, $scope.dashboard.widgets.map(function(w){return w.id; }))+1
            : 1;
    }
    else {
        $scope.dashboard.widgets = [];
        $scope.dashboard.nextWidgetId = 0;
    }

    $scope.editMode = false;

    //change this:
    $scope.data = GraphService.data;

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
                //Probably want to pass in the widget size vs finding size inside of the function
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

    $scope.toggleEditMode = function() {
        $scope.editMode = !$scope.editMode;
        $scope.gridsterOptions.resizable.enabled = !$scope.gridsterOptions.resizable.enabled;
        $scope.gridsterOptions.draggable.enabled = !$scope.gridsterOptions.draggable.enabled;
    };

    $scope.addWidget = function(widgetType) {

        var _graphType, _widgetType;
        var wType = function() {
            if(widgetType.split('-')[1] === 'graph') {
                _graphType = widgetType.split('-')[0];
                _widgetType = 'graph';
            }
            else return widgetType;
        };

        $scope.editMode = false;
        var newWidget = {
            //default widget settings
            id: $scope.dashboard.nextWidgetId,
            title: "New " + widgetType,
            type: wType(),
            graphType: graphType,
            sizeX: widgetType === 'widget' ? 2 : 4,
            sizeY: widgetType === 'widget' ? 2 : widgetType === 'text' ? 1 : 4
        };
        $scope.dashboard.widgets.push(newWidget);
        $scope.dashboard.nextWidgetId = $scope.dashboard.nextWidgetId + 1;
        newWidget.dashboard = $scope.dashboard._id;
        WidgetFactory.create(newWidget)
        .then(function(createdWidget){
            for(var i = 0; i < $scope.dashboard.widgets.length; i++) {
                if ($scope.dashboard.widgets[i].id === newWidget.id) {
                    $scope.dashboard.widgets[i] = createdWidget;
                }
            }
        });
    }

    var renderGraphs = function(){
        console.log('rendering in 800ms')
        setTimeout(function(){
            console.log('now');
            GraphService.populateCharts($scope.dashboard.widgets.filter(function(widget){
                return widget.type === 'graph';
            }));

        }, 800);
    };

    renderGraphs();
});