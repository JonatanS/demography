app.directive('widgetView', function (WidgetFactory, $uibModal, DatasetFactory, ChartService, $rootScope) {
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
                    width: gridWidth/(12/scope.widget.sizeX)-40,
                    height: gridWidth/(12/scope.widget.sizeY)-74
            }

            var c = scope.widget.chartObject;
            if (c && c.chart) {
                var chartConstructor = {
                    id: c.id,
                    container: $(element).find('.widget-content-container')[0],
                    chartType: c.chartType,
                    chartGroup: c.chartGroup,
                    xAxis: c.xAxis,
                    yAxis: c.yAxis,
                    groupType: c.groupType,
                    colorSettings: c.colorSettings,
                    width: graphSize.width,
                    height: graphSize.height
                };
                ChartService.create(chartConstructor);
                scope.widget.created = true;//Sets boolean to know if the widget is empty or contains a chart
                //GraphService.create($(element).find('.widget-content-container')[0], c.id, c.chartType, c.xAxis, c.yAxis, c.groupType, c.chartOptions,graphSize,c.chartGroup,c.colorSettings);
            } else {
                openSettings(scope.widget, scope.dashboard.dataset._id);
            }

            scope.remove = function (widget) {
                if(widget._id) WidgetFactory.delete(widget._id);
                scope.dashboard.widgets.splice(scope.dashboard.widgets.indexOf(widget), 1);
            };

            // scope.createDatacountWidget = function(widget, datasetId) {
            //     //set title
            //     widget.title = "Statistics";
            //     widget.sizeX = 4;
            //     widget.sizeY = 1;
            //     graphSize = {
            //         width: gridWidth/(12/widget.sizeX)-40,
            //         height: gridWidth/(12/widget.sizeY)-74
            //     };

            //     var chartConstructor = {
            //         id: widget.id,
            //         container: $('#widget-container-'+widget.id).children()[1],
            //         chartType: 'dataCount',
            //         chartGroup: 'Group1',
            //         width: graphSize.width,
            //         height: graphSize.height
            //     };
            //     widget.chartObject = ChartService.create(chartConstructor);
            //     WidgetFactory.update(widget);
            // }

            scope.element = element;

            function openSettings (widget, datasetId) {

                $uibModal.open({
                    scope: scope,
                    templateUrl: 'js/widget/widget.settings.html',
                    controller: 'WidgetSettingsCtrl',
                    resolve: {
                        widget: function() {
                            return widget;
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

            scope.openSettings = function(widget,datasetId){
                openSettings(widget,datasetId)
            }

            //used to ng-hide new-widget-selector
            scope.noGraph = function (widget){
                return widget.chartObject && widget.chartObject!={};
            };

            scope.$on('item-needs-update', function(item) {
                graphSize = {
                    width: gridWidth/(12/scope.widget.sizeX)-40,
                    height: gridWidth/(12/scope.widget.sizeY)-74
                }

                ChartService.resize({id: scope.widget.id, width: graphSize.width, height: graphSize.height});
                var updatedWidget = {
                    col: scope.widget.col,
                    row: scope.widget.row,
                    sizeX: scope.widget.sizeX,
                    sizeY: scope.widget.sizeY,
                    _id: scope.widget._id,
                    chartObject: scope.widget.chartObject
                };
                WidgetFactory.update(updatedWidget);    //no ().then necessary here

              });
        }
    };
});
