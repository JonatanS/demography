app.config(function ($stateProvider) {
    $stateProvider.state('dashboard', {
        url: '/users/:userId/datasets/:datasetId/dashboards/:dashboardId',
        templateUrl: 'js/dashboard/dashboard.edit.html',
        controller: 'DashboardCtrl',
        resolve: {
            loggedInUser: function(AuthService ) {
                return AuthService.getLoggedInUser()
                .then(function(user) {
                    return user;
                })
                .then(null, console.error)
            },
            currentDashboard:function(DashboardFactory, $stateParams ) {
                return DashboardFactory.fetchOne($stateParams.dashboardId)
                .then(function(dash){
                    return dash;
                })
                .then(null, console.error)
            },
            currentDataset: function(DatasetFactory, $stateParams ) {
                return DatasetFactory.fetchOne($stateParams.datasetId)//This was fetchById but that function no longer exists
                .then(function(dataset){
                    return dataset;
                })
                .then(null, console.error)
            }
        }
    });
});

//https://github.com/ManifestWebDesign/angular-gridster/blob/master/demo/dashboard/script.js
app.controller('DashboardCtrl', function (currentDataset, currentDashboard, loggedInUser, $scope, $timeout, $uibModal, DatasetFactory, DashboardFactory, WidgetFactory, $stateParams, $rootScope, ChartService){

    $scope.dashboard = currentDashboard;
    $scope.dataset = currentDataset;  //dont want to expose this

    if($scope.dashboard.widgets) {
        $scope.dashboard.nextWidgetId = $scope.dashboard.widgets.length ?
            Math.max.apply(Math, $scope.dashboard.widgets.map(function(w){return w.id; }))+1
            : 1;
    }
    else {
        $scope.dashboard.widgets = [];
        $scope.dashboard.nextWidgetId = 0;
    }

    //set name for display
    if(currentDashboard.user.firstName && currentDashboard.user.lastName) {
        $scope.dashboard.user.name = currentDashboard.user.firstName + ' ' + currentDashboard.user.lastName;
    }
    else $scope.dashboard.user.name = currentDashboard.user.email;


    //tons of options: https://github.com/ManifestWebDesign/angular-gridster
    $scope.gridsterOptions = {
        margins: [12, 12],  //spacing between widgets
        columns: 12,        // min widget size
        draggable: {
            handle: '.box-header'   // optional if you only want a specific element to be the drag handle
            //enabled: true
        },
        rowHeight: 'match',
        resizable:{
            enabled: true,
            handles: ['s', 'w', 'se', 'sw']
        },
        maxSizeX: 12, // maximum column width of an item
        minSizeX: 2, // minimum column width of an item
        minSizeY: 1, // minimum column height of an item
        minRows: 1, // the minimum height of the grid, in rows

        mobileBreakPoint: 600, // if the screen is not wider that this, remove the grid layout and stack the items
        mobileModeEnabled: true, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
    };

    $scope.$on('$destroy', function () {
        if(!!$scope.dashboard.widgets.length) {
            DashboardFactory.takeScreenshot($stateParams)
        }
    });

    $scope.addWidget = function() {

        // Create a new widget
        var newWidget = {
            // Default widget settings
            id: $scope.dashboard.nextWidgetId,
            title: "New Graph",
            type: 'graph',
            sizeX: 4,
            sizeY: 4,
            chartObject: {}
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
    };

    var configureViewOnlyMode = function(){
        $scope.gridsterOptions.resizable.enabled = false;
        $scope.gridsterOptions.draggable.enabled = false;
        $scope.viewOnlyMode = true;
    }

    // $scope.$on('gridster-resized', function(sizes, gridster) {
    // // sizes[0] = width
    // // sizes[1] = height
    // // gridster.
    // })

    $scope.viewOnlyMode = false;
    if(!loggedInUser) {
        configureViewOnlyMode()
    };

    ChartService.loadData(currentDataset.jsonData)
});
