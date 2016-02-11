app.directive('createLinechart', function(WidgetFactory) {
    return {
        restrict: "E",
        templateUrl: 'js/common/directives/create-linechart/create-linechart.html',
        scope: {
            lineChartCollapsed: '=',
            form: '=',
            axisDropdowns: '=',
            colorOptions: '=',
            graphGroups: '='
        },
        link: function(scope, element, attrs) {
            // BOBBY NOTE: Is this something that needs to be repeated in each create-chart directive??
            scope.addGraphGroup = function() {
                var newGroup = 'Group' + (scope.graphGroups.options.length + 1);
                WidgetFactory.addGraphGroup(newGroup);
                scope.form.graphGroup = newGroup;
                scope.graphGroups.options = WidgetFactory.getGraphGroups();
            };
        }
    }
})