/*  GraphService
*
*   use this file for most of the graph logic, such as
*   create and update of all chart types.
*
*   'public' functions: this.someFunc = function(){}
    'private' functions: function someFunc(){}
*
*/

app.service('GraphService', function(DashboardFactory) {
    var self = this;
    var ndx, myData;
    //Object to store all instances of chart to resize/edit specific chart
    var charts = {};

    this.create = function(id, chartType, xAxis, yAxis, groupType) {

        var chartContainer = $('#widget-container-' + id + '> .box-content > .widget-content-container')[0];
        var chartWidth = chartContainer.offsetWidth;
        var chartHeight = chartContainer.offsetHeight;
        var chartRadius = chartWidth < chartHeight ? chartWidth / 2 : chartHeight / 2;
        console.log(chartWidth, chartHeight, chartRadius);
        ///var all = ndx.groupAll()

        var dim = ndx.dimension(function(d) {
            return d[xAxis];
        })


        var grp = dim.group().reduceSum(function(d) {
            return d[yAxis];
        })

        // var grp = dim.group().reduceSum(function(d) {
        //     return d.HR;
        // })

        //var chart = dc[chartType](chartContainer);
        var chart = dc[chartType]('#widget-container-' + id + '> .box-content > .widget-content-container');

        //Add chart to Dictionart with a reference to the chart, and it's specific type (pie,bar,etc)
        //Is there a way to find out what kind of chart it is by checking the instance itself?
        charts['chart' + id] = {
            chart: chart,
            chartType: chartType
        };

        if (chartType === "pieChart") {
            chart
                .width(chartWidth)
                .height(chartHeight)
                .radius((chartWidth < chartHeight ? chartWidth / 2 : chartHeight / 2) * .8)
                .innerRadius(chartWidth / 6)
                .dimension(dim)
                .group(grp)
        } else if (chartType === "barChart") {
            //margins prevents axes labels from being cutoff
            chart
                .width(chartWidth)
                .height(chartHeight * .8)
                .margins({
                    top: 10,
                    right: 10,
                    bottom: 20,
                    left: 20
                })
                .dimension(dim)
                .group(grp)
                .elasticY(true)
                .centerBar(false)
                .x(d3.scale.ordinal())
                .xUnits(dc.units.ordinal)
                .renderHorizontalGridLines(true)
        }
        dc.renderAll();
    };

    this.resize = function(id) {
        //http://plnkr.co/edit/kJDKH0?p=preview
        var chartContainer = $('#widget-container-' + id + '> .box-content > .widget-content-container')[0];
        var chartWidth = chartContainer.offsetWidth;
        var chartHeight = chartContainer.offsetHeight;
        var chartRadius = chartWidth < chartHeight ? chartWidth / 2 : chartHeight / 2;
        // var newWidth = document.getElementById('box-test').offsetWidth;
        // chart.width(newWidth)
        //   .transitionDuration(0);
        // pie.transitionDuration(0);
        // dc.renderAll();
        // chart.transitionDuration(750);
        // pie.transitionDuration(750);

        var chartObj = charts["chart" + id]
        var chart = chartObj.chart;

        if (chartObj.chartType === "pieChart") {
            chart
                .radius(chartRadius * .8)
                .innerRadius(chartRadius / 3)
        } else if (chartObj.chartType === "barChart") {
            chart
                .width(chartWidth * .8)
                .height(chartHeight * .8)
        }

        dc.renderAll();
    }

    //load data
    function loadData() {
        d3.csv('../data/baseballData.csv', function(data) {

            data.forEach(function(d) {
                d.Player = d.PLAYER,
                    d.Team = d.TEAM
            });

            myData = data
            ndx = crossfilter(myData);
            //console.log("NDX:", data)
            //$scope.optionArray = Object.keys(data[0])
            //$scope.$apply()
        });
    };

    //for now init data here
    loadData();
})
