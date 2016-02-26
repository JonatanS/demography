app.factory('DashboardFactory', function ($http, $rootScope) {
    return {

        //save new dashboard upon creation
        create: function(dashboard) {
           return $http.post('/api/dashboards', dashboard)
           .then(response => response.data)
           .then(null, console.error);
        },

        fetchAll: function() {
            //route makes sure to only return public dashboards
            //and those created by current user
            return $http.get('/api/dashboards')
            .then(response => response.data)
            .then(null, console.error);
        },

        fetchAllByUser: function(user) {
            return $http.get('/api/dashboards?user=' + user._id)
            .then(response => response.data)
            .then(null, console.error);
        },

        fetchOne: function(id) {
            //route makes sure to only return public dashboards
            //and those created by current user
            return $http.get('api/dashboards/' + id)
            .then(response => response.data)
            .then(null, console.error);
        },

        update: function(dashboard, dashboardId) {
            return $http.put('/api/dashboards/' + dashboardId, dashboard)
            .then(response => response.data)
            .then(null, console.error);
        },

        delete: function(dashboard) {
            return $http.delete('/api/dashboards/' + dashboard._id)
            .then(response => response.data)
            .then(null, console.error);
        },

        takeScreenshot: function(stateParams) {
            return $http.post('/api/screenshots', stateParams)
            .then(response => {
                $rootScope.$broadcast("screenshotUpdated", response.data)
                return response.data
            })
            .then(null, console.error);
        },

        fork: function(dashboard, datasetId) {
            // Assign the forked datasetId to the dashboard
            delete dashboard.dataset;
            dashboard.dataset = datasetId;

            return $http.post('/api/dashboards/' + dashboard._id + '/fork', dashboard)
            .then(response => response.data)
            .then(null, console.error)
        }
    };
});
