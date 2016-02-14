app.directive('dashboardEntry', function($uibModal, DashboardFactory) {
    return {
        restrict: "E",
        templateUrl: "js/common/directives/dashboard-entry/dashboard-entry.html",
        scope: {
            dashboard: "=",
            user: "="
        },
        link: function(scope, element) {
            scope.removeDashboard = function(dashboard) {
                DashboardFactory.delete(dashboard)
                    .then(deletedDashboard => {
                        var userDashboardIndex = scope.$parent.$parent.userDashboards.findIndex(userDashboard => {
                            return userDashboard._id === deletedDashboard._id;
                        });
                        scope.$parent.$parent.userDashboards.splice(userDashboardIndex, 1);
                    })
                    .then(null, console.error);
            };

            // Function to open up the modal for creating a dashboard
            scope.openDashboardSettings = function(user, currentDashboard = null) {
                // If the user tries to create a dashboard without a dataset, prompt them to upload one
                if (scope.$parent.$parent.userDatasets.length === 0) scope.$parent.$parent.tellUserToCreateDataset = true;
                else {
                    $uibModal.open({
                        scope: scope,
                        templateUrl: 'js/profile/profile-dashboards.settings.html',
                        controller: 'ProfileDashboardsSettingsCtrl',
                        resolve: {
                            user: function() {
                                return user;
                            },
                            userDatasets: function() {
                                return scope.$parent.$parent.userDatasets;
                            },
                            currentDashboard: function() {
                                return currentDashboard;
                            }
                        }
                    });
                }
            };
        }
    }
})
