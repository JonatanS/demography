/*  GraphService
 *
 *   use this file for most of the graph logic, such as
 *   create and update of all chart types.
 *
 *   'public' functions: this.someFunc = function(){}
 *   'private' functions: function someFunc(){}
 *
 */

app.service('GraphService', function() {
    var self = this;
    var ndx, myData, grp;

    var charts = {}; //Object to store all instances of chart to resize/edit specific chart

    this.populateCharts = function(widgetArr) {
        return;
        widgetArr.forEach(function(widgetObj) {
            var chartObj = widgetObj.chartObject;
            if (chartObj) self.create(chartObj.id, chartObj.chartType, chartObj.xAxis, chartObj.yAxis, chartObj.groupType, chartObj.chartOptions)
        })
    }

    this.create = function(element, id, chartType, xAxis, yAxis, groupType, chartOptions,chartSize) {

    // this.create = function(id, chartType, xAxis, yAxis, groupType, chartOptions) {
        chartOptions = {}; //initialize for now to be empty, users will eventually submit this
        //Gets called after data load, accepts array of chartObjects
        var chartContainer = element;
        var chartWidth = chartSize.width;
        var chartHeight = chartSize.height;
        var chartRadius = chartWidth < chartHeight ? chartWidth / 2 : chartHeight / 2;
        console.log("ARGS: ",arguments)
        var chartObj; //Used for storing all chart options
        var xAxisIsNumber; //Checks if the xAxis is number, and if it needs to be linear or ordinal

        var dim = ndx.dimension(function(d) {
            if (parseInt(d[xAxis])) {
                d[xAxis] = Number(d[xAxis]);
                xAxisIsNumber = true; //Checks if xaxis is ordinal or linear
            };
            return d[xAxis];
        });

        //TODO: Allow for more group types, including 'none'
        if (groupType === "sum") {
            grp = dim.group().reduceSum(function(d) {
                if (parseInt(d[yAxis])) d[yAxis] = Number(d[yAxis]);
                console.log()
                return Number(d[yAxis]);
            });
        } else if (groupType === "count") {
            grp = dim.group().reduceCount(function(d) {
                if (parseInt(d[yAxis])) d[yAxis] = Number(d[yAxis]);

                return d[yAxis];
            });
        }

        // var grp = dim.group().reduceSum(function(d) {
        //     return d.HR;
        // })
        //var chart = dc[chartType](chartContainer);
        console.log(element)
        if (chartType === "pieChart") {

            chartObj = makePieChartObject(chartOptions);
            chartObj.radius = chartRadius;
        } else if (chartType === "barChart") {
            //margins prevents axes labels from being cutoff
            chartObj = makeBarChartObject(chartOptions, xAxis, yAxis, dim, grp, xAxisIsNumber);
            var size = dim.group().size();
            if (chartObj.gap * size >= chartWidth) {
                chartObj.gap = chartWidth * .5 / size;
            }
        } else if (chartType === "rowChart") {
            chartObj = makeRowChartObject(chartOptions, xAxis, yAxis, dim, grp, xAxisIsNumber);
            var size = dim.group().size();
            if (chartObj.gap * size >= chartHeight) {
                chartObj.gap = chartHeight * .5 / size;
            }
        } else if (chartType === "lineChart") {
            chartObj = makeLineChartObject(chartOptions, xAxis, yAxis, dim, grp, xAxisIsNumber)
            var size = dim.group().size();
            if (chartObj.gap * size >= chartHeight) {
                chartObj.gap = chartHeight * .5 / size;
            }
        } else if (chartType === "dataTable") {
            chartObj = makeTableChartObject(chartOptions, id, xAxis, yAxis)

            //modify chartContainer:
            var tableContainer = d3.select(chartContainer)
            .attr('style', 'overflow: auto')
            .append('table')
                .attr('class', 'table table-hover')
                .attr('id', 'dataTable-'+id)
                .attr('style', 'table-layout: fixed')
            //chartContainer = tableContainer[0];
            chartContainer = $('#dataTable-'+id)[0]

        } else if (chartType === "dataCount") {
            chartObj = makeDataCountChartObject(chartOptions, xAxis, yAxis)
        }

        //set default options here if they dont already exist:
        if(!chartObj.width) chartObj.width = chartWidth;
        if(!chartObj.height) chartObj.width = chartHeight;
        if(!chartObj.dimension) chartObj.dimension = dim;
        if(!chartObj.group) chartObj.group = grp;


        var chart = dc[chartType](chartContainer);
        //Add chart to Dictionary with a reference to the chart, and it's specific type (pie,bar,etc)
        //Is there a way to find out what kind of chart it is by checking the instance itself?
        charts['chart' + id] = {
            chart: chart,
            chartType: chartType,
            id: id,
            xAxis: xAxis,
            yAxis: yAxis,
            groupType: groupType,
            chartOptions: chartOptions
        };

        console.log('chartObj: ',chartObj)
        createChart(id, chartObj)

        return charts['chart' + id];
    };

    this.resize = function(id) {
        //http://plnkr.co/edit/kJDKH0?p=preview

        setTimeout(function() {
            //This setTimeout allows the graph to resize once the widget has
            //finished resizing to the set width
            //Alternatively can pass in the size of the widget in the function
            //then grab the gridster-desktop elements offsetWidth and height then
            //divide that by the passed in width and height.

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

            if (!chartObj) return; //Short circuits if resizing empty widget

            var chart = chartObj.chart;

            if (chartObj.chartType === "pieChart") {
                chart
                    .radius(chartRadius * .8)
            } else if (chartObj.chartType === "barChart" || chartObj.chartType === "lineChart") {
                chart
                    .width(chartWidth * .8)
                    .height(chartHeight * .8)
            }

            dc.renderAll();
        }, 500)
    }

    //load data
    this.loadData = function(dataSet) {
        myData = dataSet;
        ndx = crossfilter(dataSet);
    }

    //Function that takes chartId and renders it with all options
    function createChart(id, chartOptions) {
        var chart = charts['chart' + id].chart;
        console.log("CHART",chart)
        var keys = Object.keys(chartOptions);
        //debugger;
        keys.forEach(function(key) {
            console.log("KEY:",key)
            console.log("val:",chartOptions[key])

            chart[key](chartOptions[key])

            if(key==="on"){
                chart[key].apply(null,chartOptions[key])
            }else{
                chart[key](chartOptions[key])
            }
        });

        dc.renderAll();
    };
    //Pie Chart Option creator
    function makePieChartObject(chartOptions) {
        //label and title options are functions, need to figure out how to hard code those based on
        //user input.
        var pieChartOptions = {
            innerRadius: 0,
            slicesCap: 20,
            renderLabel: true,
            label: function(d) { //defaults to Key
                return d.key
            },
            title: function(d) { //defaults to key : value
                return [d.key, d.value].join(' : ');
            }
        };

        Object.keys(chartOptions).forEach(function(key) {
            pieChartOptions[key] = chartOptions[key];
        })

        return pieChartOptions;
    };

    //Bar Chart Option creator-has superfluous parameters for testing
    function makeBarChartObject(chartOptions, x, y, userDimension, userGroup, xAxisIsNumber) {


        var barChartOptions = {
            margins: {
                top: 5,
                left: 10,
                right: 10,
                bottom: 20
            },
            centerBar: false, //'boolean'
            // x: d3.scale.linear().domain([0,50]).range(['white','black']),//defaults to d3.scale.ordinal, if linear, do some math to figure out domain
            x: d3.scale.ordinal(),
            xUnits: dc.units.ordinal,
            title: function(d) { //{ /*Default to both, give option for either*/ }
                return [d.key, d.value].join(' : ');
            },
            yAxisLabel: y, // 'value'
            xAxisLabel: x, //'value'
            elasticY: true, //'value'
            //if linear then domain needs to be specified? Outside of options, in function
            gap: 20,
            renderHorizontalGridLines: true
        };

        //This sets the x axis to be linear if the axis is a number
        if (xAxisIsNumber) {
            var min = userDimension.bottom(1)[0][x];
            var max = userDimension.top(1)[0][x];
            barChartOptions.x = d3.scale.linear().domain([min, max]);
            barChartOptions.xUnits = dc.units.integers;
        }
        // if(chartOptions.x==="linear"){
        //     barChartOptions.x= d3.scale.linear().domain([0,50]).range(["white","black"]);
        //     barChartOptions.xUnits = null;
        //     chartOptions = {};
        //     console.log("ChartOptions",barChartOptions)
        // }

        Object.keys(chartOptions).forEach(function(key) {
            barChartOptions[key] = chartOptions[key];
        });


        return barChartOptions;
    };

    //Row Chart Option creator-has superfluous parameters for testing
    function makeRowChartObject(chartOptions, x, y, userDimension, userGroup) {

        var rowChartOptions = {
            title: function(d) { //defaults to key : value
                return [d.key, d.value].join(' : ');
            },
            elasticX: true,
            gap: 10,
            margins: {
                top: 5,
                left: 10,
                right: 10,
                bottom: 20
            }
        };

        Object.keys(chartOptions).forEach(function(key) {
            rowChartOptions[key] = chartOptions[key];
        })

        return rowChartOptions;
    };

    //Line Chart
    function makeLineChartObject(chartOptions, x, y, userDimension, userGroup, xAxisIsNumber) {
        var lineChartOptions = {
            transitionDuration: 500,
            mouseZoomable: false, //need to better understand
            margins: {
                top: 5,
                left: 20,
                right: 10,
                bottom: 10
            },
            elasticY: true,
            x: d3.scale.ordinal(),
            xUnits: dc.units.ordinal,
            brushOn: false,
            title: function(d) { //{ /*Default to both, give option for either*/ }
                return [d.key, d.value].join(' : ')
            }
        }

        //This sets the x axis to be linear if the axis is a number
        if (xAxisIsNumber) {
            var min = userDimension.bottom(1)[0][x];
            var max = userDimension.top(1)[0][x];
            lineChartOptions.x = d3.scale.linear().domain([min, max]);
            lineChartOptions.xUnits = dc.units.integers;
        }

        Object.keys(chartOptions).forEach(function(key) {
            lineChartOptions[key] = chartOptions[key];
        })

        return lineChartOptions
    };

    //Data Table Chart Option creator-has superfluous parameters for testing
    function makeTableChartObject(chartOptions,id, x,y,numRows) {
        var tableChartOptions = {

            //https://github.com/dc-js/dc.js/blob/master/web/docs/api-1.6.0.md#renderletrenderletfunction
            //ADD CUSTOM CLASS TO LABEL ROWS
            // on: ('renderlet'), function(table) {
            //     table.selectAll('#widget-container-' + id + '> .box-content > .widget-content-container').classed('table table-hover', true);
            //     console.dir(table);
            // },
            //  on: ['renderlet', function(table) {
            //     table.selectAll('#widget-container-' + id + '> .box-content > .widget-content-container').classed('table table-hover', true);
            //     console.dir(table);
            // }],
            sortBy: function(d) {
                return d[y];
            },
            columns: Object.keys(myData[0]),
            group: function(d) {
                return d[x] //create a new header for grouped values
            },
            order: d3.descending, //can be ascending and descending
            size: numRows ? numRows : 10    //how many rows to display - make this dynamic based on widget height
        };

        Object.keys(chartOptions).forEach(function(key) {
            tableChartOptions[key] = chartOptions[key];
        });
        return tableChartOptions;
    };

    function makeDataCountChartObject(chartOptions) {
        var dataCountOptions = {
            group : ndx.groupAll(),
            dimension: ndx,
            html : {
                some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
                    ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'\'>Reset All</a>',
                all: 'All <strong>%total-count</strong> records selected.'
            }
        };

        Object.keys(chartOptions).forEach(function(key) {
            dataCountOptions[key] = chartOptions[key];
        });
        return dataCountOptions;
    }
})
