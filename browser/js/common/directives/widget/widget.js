app.directive('widgetView', function (WidgetFactory, $uibModal, DatasetFactory, GraphService) {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/widget/widget.html',
        scope: {
            widget: '=',
            dataset: '=',
            dashboard: '='
        },
        link: function (scope, element, attrs) {
            var grid = $('.gridster')[0];
            var gridWidth = grid.offsetWidth;
            //Temporary size stuff
            var graphSize = {
                width: gridWidth/scope.widget.sizeX,
                height: gridWidth/scope.widget.sizeY
            }            
            var c = scope.widget.chartObject;
            if (c && c.chart) {
                GraphService.create($(element).find('.widget-content-container')[0], c.id, c.chartType, c.xAxis, c.yAxis, c.groupType, c.chartOptions,graphSize);
            }
            scope.remove = function (widget) {
                if(widget._id) WidgetFactory.delete(widget._id);
                scope.dashboard.widgets.splice(scope.dashboard.widgets.indexOf(widget), 1);
            };

            scope.createDatacountWidget = function(widget, datasetId) {

                //set title
                widget.title = "Statistics";
                widget.sizeX = 4;
                widget.sizeY = 1;
                //set width and height

                var chartObj = GraphService.create(widget.id,'dataCount');
                widget.chartObject = chartObj;
                WidgetFactory.update(widget);
            }

            scope.element = element;

            scope.openSettings = function (widget, datasetId, graphTypeToCreate) {
                $uibModal.open({
                    scope: scope,
                    templateUrl: 'js/widget/widget.settings.html',
                    controller: 'WidgetSettingsCtrl',
                    resolve: {
                        widget: function() {
                            return widget;
                        },
                        graphTypeToCreate: function() {
                            return graphTypeToCreate || null;
                        },
                        dataset: function() {
                            return DatasetFactory.fetchOne(datasetId);
                        },
                        element: function(){
                            return $(element).find('.widget-content-container')[0]
                        },
                        graphSize: function(){
                            return graphSize;
                        }
                    }
                });
            };

            //used to ng-hide new-widget-selector
            scope.noGraph = function (widget){
                return widget.chartObject && widget.chartObject!={};
            }

            scope.$on('gridster-item-transition-end', function (item) {
                var updatedWidget = {
                    col: item.targetScope.widget.col,
                    row: item.targetScope.widget.row,
                    sizeX: item.targetScope.widget.sizeX,
                    sizeY: item.targetScope.widget.sizeY,
                    _id: item.targetScope.widget._id
                };
                WidgetFactory.update(updatedWidget);    //no ().then necessary here
            });

        }
    };
});
