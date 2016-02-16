app.service('ChartService', function (ChartUtilsService){
    var ndx, myData;   //public variables shared between all chart instances
    var chartDict = {}; //Object to store all instances of chartDict

    this.create = function(chartConfig) {
        return new Chart(chartConfig);
    }

    //use to both resize and update config. For resize, size must be specified:
    this.update = function(chartConfig) {
        //find chart from chart dict and call _update method
        var thisChart = chartDict[chartConfig.id];
        thisChart._update(chartConfig);
    };

    //same as this.update
    this.resize = function(chartConfig) {
        if (chartConfig.width || chartConfig.height) this.update(chartConfig);
    };

    //load data is called when a dashboard is initialized
    this.loadData = function(dataSet) {
        myData = dataSet;
        ndx = crossfilter(dataSet);
    };

    //Chart Constructor
    class Chart {
        constructor(chartConfig) {
            //default settings that every dc chart needs regardless of type:
            this.id = chartConfig.id;
            if(chartConfig.groupType) this.groupType = chartConfig.groupType;
            if(chartConfig.xAxis) this.xAxis = chartConfig.xAxis;
            if(chartConfig.yAxis) this.yAxis = chartConfig.yAxis;
            if(chartConfig.colorSettings) this.colorSettings = chartConfig.colorSettings;
            this.chartType = chartConfig.chartType;
            this.height = chartConfig.height;
            this.width = chartConfig.width;
            this.chartGroup = chartConfig.chartGroup || 'Group1';
            var chartSpecificConfig = ChartUtilsService.createChartOptions(chartConfig, ndx, myData); //configure with chart specific properties and user settings such as colors
            this.chart = dc[this.chartType](chartSpecificConfig.container,this.chartGroup);
            this._applyToChart(chartSpecificConfig);
            this._createChart();    //render the new chart
        };

        //attaches properties to the DC chart instance
        _applyToChart(chartConfig) {
            for (var key in chartConfig) {
                if(key === "on"){
                    this.chart[key].apply(null,chartConfig[key]) //not sure this still works. check table formatting to find out if this is the right syntax
                }
                else {
                    if (this.chart[key]) {//temporary fix to make sure if a chart is called with a function it can't take, it doesn't break anything
                        this.chart[key](chartConfig[key])
                    }
                }
            };
        };

        _createChart() {
            chartDict[this.id] = this;   //add new chart to dict
            dc.renderAll(this.chartGroup);  //render all connected charts
        };

        _update(chartConfig) {
            if(this.chartType==='pieChart'){
                chartConfig.radius = chartConfig.width < chartConfig.height ? chartConfig.width / 2 : chartConfig.height / 2
            }
            for (var key in chartConfig) {
                if(this.chart[key]) this.chart[key](chartConfig[key]);
            }
            chartDict[this.id] = this;
            dc.renderAll(this.chartGroup);  //render all connected charts
        };
    };
});
