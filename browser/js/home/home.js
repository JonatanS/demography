app.config(function($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'HomeCtrl'
    });
});

app.controller('HomeCtrl', function($scope) {
    var graphCount = 0;
    var myData;
    var ndx;
    var margin = {
            top: 30,
            right: 20,
            bottom: 30,
            left: 50
        },
        width = 600 - margin.left - margin.right,
        height = 270 - margin.top - margin.bottom;

    //make another pie
    $scope.test3 = function(chartType) {
        var margin = {
                top: 30,
                right: 20,
                bottom: 30,
                left: 50
            },
            width = 600 - margin.left - margin.right,
            height = 270 - margin.top - margin.bottom;

        d3.select('body').append('div')
            .attr("id", "testId")

        console.log(ndx)

        var all = ndx.groupAll()
        var leagueDim = ndx.dimension(function(d) {
            var prop = Object.keys(d)[2]
            return d[prop];
        })

        var playerDim = ndx.dimension(function(d) {
            return d.Player
        })

        var hrGroup = leagueDim.group().reduceSum(function(d) {
            return d.HR;
        })

        var avgGroup = leagueDim.group().reduceSum(function(d) {
            return d.RBI
        })

        var playerHrGroup = playerDim.group().reduceSum(function(d) {
            return d.HR
        })

        var chart = dc[chartType]('#testId2');
        chart
            .width(280)
            .height(180)
            .radius(100)
            .innerRadius(30)
            .dimension(playerDim)
            .group(playerHrGroup)


        dc.renderAll();
    }

    //make pie
    $scope.test2 = function() {
        var margin = {
                top: 30,
                right: 20,
                bottom: 30,
                left: 50
            },
            width = 600 - margin.left - margin.right,
            height = 270 - margin.top - margin.bottom;

        d3.select('body').append('div')
            .attr("id", "testId")


        var all = ndx.groupAll()
        var leagueDim = ndx.dimension(function(d) {
            var prop = Object.keys(d)[2]
            return d[prop];
        })

        var playerDim = ndx.dimension(function(d) {
            return d.Player
        })

        var hrGroup = leagueDim.group().reduceSum(function(d) {
            return d.HR;
        })

        var avgGroup = leagueDim.group().reduceSum(function(d) {
            return d.RBI
        })

        var playerHrGroup = playerDim.group().reduceSum(function(d) {
            return d.HR
        })

        var pieChart = dc.pieChart('#testId');
        pieChart /* dc.pieChart('#quarter-chart', 'chartGroup') */
            .width(180)
            .height(180)
            .radius(80)
            .innerRadius(30)
            .dimension(leagueDim)
            .group(hrGroup);

        dc.renderAll();
    }

    //create graph from function
    $scope.createGraph = function(chartType, x, y, groupType) {
        var id = "testId" + graphCount;
        graphCount++;
        d3.select('body').append('div')
            .attr("id", id);

        var all = ndx.groupAll()

        var userDimension = ndx.dimension(function(d) {
            return d[x];
        })


        var userGroup = userDimension.group().reduceSum(function(d) {
            return d[y];
        })

        // var userGroup = userDimension.group().reduceSum(function(d) {
        //     return d.HR;
        // })

        var chart = dc[chartType]("#" + id)
            // var chart = dc[chartType](id);

        if (chartType === "pieChart") {
            chart
                .width(280)
                .height(180)
                .radius(100)
                .innerRadius(30)
                .dimension(userDimension)
                .group(userGroup)
        } else if (chartType === "barChart") {
            chart
                .width(580)
                .height(180)
                .margins({
                    top: 10,
                    right: 50,
                    bottom: 30,
                    left: 40
                })
                .dimension(userDimension)
                .group(userGroup)
                .elasticY(true)
                .centerBar(false)
                .x(d3.scale.ordinal())
                .xUnits(dc.units.ordinal)
                .renderHorizontalGridLines(true)
        }


        // chart.xAxis().tickFormat(
        //     function(v) {
        //         return v + '%';
        //     });
        // chart.yAxis().ticks(5);

        dc.renderAll();

    }

    //load data
    $scope.test = function(options) {
        d3.csv('../data/baseballData.csv', function(data) {

            data.forEach(function(d) {
                d.Player = d.PLAYER,
                    d.Team = d.TEAM

            });
            myData = data
            ndx = crossfilter(myData);
            console.log("NDX:", data)
            $scope.optionArray = Object.keys(data[0])
            $scope.$apply()
        });
    };

    // function type(d) {
    //     d.frequency = +d.frequency;
    //     return d;
    // };
});
