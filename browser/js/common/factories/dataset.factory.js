app.factory('DatasetFactory', function($http, Upload) {
    return {

        //save new dashboard upon creation
        create: function(datasetFile, datasetMetaData) {
            return Upload.upload({
                url: '/api/datasets/uploadFile',
                method: 'POST',
                data: {
                    file: datasetFile,
                    user: datasetMetaData.user,
                    title: datasetMetaData.title,
                    shortDescription: datasetMetaData.shortDescription,
                    isPublic: datasetMetaData.isPublic,
                }
            }).success(function(data, status, headers, config) {
            }).error(function(data, status, headers, config) {
                console.log('error status: ', status);
            });
        },

        fetchAll: function() {
            return $http.get('/api/datasets')
            .then(response => response.data)
            .then(null, console.error);
        },

        fetchAllByUser: function(userId) {
            return $http.get('/api/datasets?user=' + userId)
            .then(response => response.data)
            .then(null, console.error);
        },

        fetchOne: function(id) {
            return $http.get('api/datasets/' + id)
            .then(response => response.data)
            .then(null, console.error);
        },

        update: function(datasetFile, datasetMetaData) {
            return Upload.upload({
                url: '/api/datasets/' + datasetMetaData.id + '/replaceDataset',
                method: 'POST',
                data: {
                    file: datasetFile,
                    title: datasetMetaData.title,
                    shortDescription: datasetMetaData.shortDescription,
                    isPublic: datasetMetaData.isPublic
                }
            }).success(function(data, status, headers, config) {
            }).error(function(data, status, headers, config) {
                console.log('error status: ', status);
            });
        },

        delete: function(dataset) {
            return $http.delete('/api/datasets/' + dataset._id)
            .then(response => response.data)
            .then(null, console.error);
        },

        fork: function(datasetId) {
            return $http.post('/api/datasets/' + datasetId + '/fork')
            .then(response => response.data)
            .then(null, console.error)
        }
    };
});
