app.directive('dashboardEntryStream', function(DashboardFactory, DatasetFactory, $state){
    return {
        restrict: "E",
        templateUrl: "js/common/directives/dashboard-entry/dashboard-entry-stream.html",
        scope: {
            dashboard: "=",
            user: "=",
            userDatasets:"="
        },
        link: function(scope, element) {

                scope.forkDataset = function(dataset) {
        // Make sure dataset is public
        if (!dataset.isPublic) return;

        DatasetFactory.fork(dataset._id)
        .then($state.go('userDatasets'));
    };

        scope.forkDashboard = function(dashboard) {
        // Make sure dataset and dashboard are public
        if (!dashboard.dataset.isPublic || !dashboard.isPublic) return;

        DatasetFactory.fork(dashboard.dataset._id)
        .then(forkedDataset => {
            DashboardFactory.fork(dashboard, forkedDataset._id)
            .then(forkedDashboard => {
                $state.go('dashboard', { userId: forkedDashboard.user, datasetId: forkedDashboard.dataset, dashboardId: forkedDashboard._id });
            });
        });
    };
        }
    }
})
