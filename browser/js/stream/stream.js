app.config(function($stateProvider) {

    $stateProvider.state('stream', {
        url: '/stream',
        templateUrl: 'js/stream/stream.html',
        controller: 'StreamCtrl',
        resolve: {
            dashboards: function(DashboardFactory){
                return DashboardFactory.fetchAll()
            }
        }
    });

});

app.controller('StreamCtrl', function($scope, $state, dashboards, DashboardFactory, DatasetFactory) {
    $scope.allDashboards = dashboards;

    var listenerFunc = function(event, newDashboard) {
        var changingIndex = $scope.allDashboards.findIndex(dashboard => {
            return dashboard._id === newDashboard._id;
        });
        $scope.allDashboards[changingIndex].screenshot = $scope.allDashboards[changingIndex].screenshot + '?x=' + Math.floor(Math.random() * 1000);
        $scope.$off("screenshotUpdated", listenerFunc);
    }

    $scope.$on("screenshotUpdated", listenerFunc);

    // $scope.forkDashboard = function(dashboard) {
    //     // Make sure dataset and dashboard are public
    //     if (!dashboard.dataset.isPublic || !dashboard.isPublic) return;

    //     DatasetFactory.fork(dashboard.dataset._id)
    //     .then(forkedDataset => {
    //         DashboardFactory.fork(dashboard, forkedDataset._id)
    //         .then(forkedDashboard => {
    //             $state.go('dashboard', { userId: forkedDashboard.user, datasetId: forkedDashboard.dataset, dashboardId: forkedDashboard._id });
    //         });
    //     });
    // };

    // $scope.forkDataset = function(dataset) {
    //     debugger;
    //     // Make sure dataset is public
    //     if (!dataset.isPublic) return;

    //     DatasetFactory.fork(dataset._id)
    //     .then($state.go('userDatasets'));
    // };

});
