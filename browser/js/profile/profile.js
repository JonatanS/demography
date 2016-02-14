app.config(function($stateProvider) {
    $stateProvider.state('profile', {
        url: '/profile',
        abstract: true,
        templateUrl: 'js/profile/profile.html',
        controller: 'ProfileCtrl',
        resolve: {
            loggedInUser: function(AuthService, $stateParams) {
                return AuthService.getLoggedInUser()
                    .then(user => {
                        $stateParams.userId = user._id;
                        return user;
                    });
            },
            userDashboards: function(DashboardFactory, loggedInUser) {
                return DashboardFactory.fetchAllByUser(loggedInUser)
                .then(dashboards => dashboards)
                .then(null, console.error);
            },
            userDatasets: function(DatasetFactory, loggedInUser) {
                return DatasetFactory.fetchAllByUser(loggedInUser._id)
                .then(datasets => datasets)
                .then(null, console.error);
            }
        }
    })
    .state('userDashboards', {
        parent: 'profile',
        url: '/dashboards',
        templateUrl: 'js/profile/profile-dashboards.html',
        controller: 'ProfileCtrl'
    })
    .state('userDatasets', {
        parent: 'profile',
        url: '/datasets',
        templateUrl: 'js/profile/profile-datasets.html',
        controller: 'ProfileCtrl'
    });

});

app.controller('ProfileCtrl', function($scope, $state, $uibModal, $timeout, loggedInUser, UserFactory, userDashboards, userDatasets, DashboardFactory, DatasetFactory) {
    $scope.user = loggedInUser;
    $scope.userDashboards = userDashboards;
    $scope.userDatasets = userDatasets;

    // Initialize notice to user as false
    $scope.tellUserToCreateDataset = false;

    // Function to open up the modal for uploading a dataset
    $scope.openDatasetSettings = function (user, userDatasets, currentDataset = null) {
        $scope.tellUserToCreateDataset = false;

        $uibModal.open({
            scope: $scope,
            templateUrl: 'js/profile/profile-datasets.settings.html',
            controller: 'ProfileDatasetsSettingsCtrl',
            resolve: {
                user: function() {
                    return user;
                },
                userDatasets: function() {
                    return userDatasets;
                },
                currentDataset: function() {
                    return currentDataset;
                }
            }
        });
    };

    // // Function to open up the modal for creating a dashboard
    // $scope.openDashboardSettings = function (user, userDatasets, currentDashboard = null) {
    //     // If the user tries to create a dashboard without a dataset, prompt them to upload one
    //     if ($scope.userDatasets.length === 0) $scope.tellUserToCreateDataset = true;
    //     else {
    //         $uibModal.open({
    //             scope: $scope,
    //             templateUrl: 'js/profile/profile-dashboards.settings.html',
    //             controller: 'ProfileDashboardsSettingsCtrl',
    //             resolve: {
    //                 user: function() {
    //                     return user;
    //                 },
    //                 userDatasets: function() {
    //                     return userDatasets;
    //                 },
    //             currentDashboard: function() {
    //                 return currentDashboard;
    //             }
    //             }
    //         });
    //     }
    // };

    $scope.removeDataset = function(dataset) {
        DatasetFactory.delete(dataset)
        .then(deletedDataset => {
            // Remove the dataset from the $scope array
            var userDatasetsIndex = $scope.userDatasets.findIndex(userDataset => {
                return userDataset._id === deletedDataset._id;
            });
            $scope.userDatasets.splice(userDatasetsIndex, 1);

            // Remove the dashboards that associate with the dataset from the $scope array
            var userDashboardsToDelete = $scope.userDashboards.filter(userDashboard => {
                return userDashboard.dataset._id === deletedDataset._id;
            });
            for (var i = 0; i < $scope.userDashboards.length; i++) {
                var currentDashboardToCheck = $scope.userDashboards[i];

                if (userDashboardsToDelete.indexOf(currentDashboardToCheck) > -1) {
                    $scope.userDashboards.splice(i, 1);
                    i--;
                }
            }
        })
        .then(null, console.error);
    };

    $scope.createDashboard = function(dataset) {
        return DashboardFactory.create({ user: $scope.user._id, dataset: dataset._id, title: dataset.title, shortDescription: dataset.shortDescription, isPublic: dataset.isPublic })
        .then(newDashboard => {
            $state.go('dashboard', { userId: newDashboard.user, datasetId: newDashboard.dataset, dashboardId: newDashboard._id });
        })
        .then(null, console.error)
    };

    // $scope.removeDashboard = function(dashboard) {
    //     DashboardFactory.delete(dashboard)
    //     .then(deletedDashboard => {
    //         var userDashboardIndex = $scope.userDashboards.findIndex(userDashboard => {
    //             return userDashboard._id === deletedDashboard._id;
    //         });
    //         $scope.userDashboards.splice(userDashboardIndex, 1);
    //     })
    //     .then(null, console.error);
    // };

    $scope.apiKey = {
        show: false
    };

    $scope.generateAPIkey = function() {
        UserFactory.generateToken(loggedInUser._id)
        .then(token => {
            $scope.apiKey.token = token;
            $scope.apiKey.show = true;

        })
        .then(null, console.error);
    };

    $scope.resetToken = function(e) {
        $scope.apiKey.show = false;
        $scope.apiKey.token = '';
        $scope.$apply();
    }

    var listenerFunc = function(event, newDashboard) {
        var changingIndex = $scope.userDashboards.findIndex(userDashboard => {
            return userDashboard._id === newDashboard._id;
        });
        $scope.userDashboards[changingIndex].screenshot = $scope.userDashboards[changingIndex].screenshot + '?x=' + Math.floor(Math.random() * 1000)
        $scope.$off("screenshotUpdated", listenerFunc)
    }

    $scope.$on("screenshotUpdated", listenerFunc)

});
