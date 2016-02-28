var ndx;
var dimensions = {};
var groups = {};
var charts = {};
var display_value = 'average-only';
var generationSources = [
  { code: "Wind", name: "Wind", colour: "lightblue" },
  { code: "Hydro", name: "Hydro-electric", colour: "blue" },
  { code: "Geo", name: "Geothermal", colour: "orange" },
  { code: "Cogen", name: "Co-generation", colour: "yellow" },
  { code: "Gas", name: "Gas", colour: "red" },
  { code: "Coal", name: "Coal", colour: "brown" },
  { code: "Diesel", name: "Diesel", colour: "gray" }
];
var periodsPerDay = 48;

// A quick and dirty implementation of a queue to prevent the UI thread from being tied up for several seconds, and
// allow a progress bar to work. Will tidy this up later.
var loadQueue = [];
function continueQueue(){
  NProgress.inc();
  var nextFunction = loadQueue.shift();
  if(nextFunction) window.setTimeout(nextFunction, 0);
}

// This page contains the (currently unused) logic from the Spot Prices page, which would allow for switching between
// different types of stacking for standard deviation or min/max views. If I decide not to implement these, this code
// can get a bit simpler.
$(function(){
  NProgress.configure({ trickle: false });
  NProgress.start();
  d3.csv("/data/generation", function(data) {
    NProgress.inc();

    loadQueue.push(function() {
      data.forEach(function (d) {
        d.hour = (+d.period - 1) / 2;
        d.quantity = +d.quantity / 1000000; // GWh
        d.date = new Date(d.date);
      });
      continueQueue();
    });

    loadQueue.push(function() {
      ndx = crossfilter(data);
      continueQueue();
    });

    loadQueue.push(function() {
      dimensions.hour = ndx.dimension(function (d) {
        return d.hour;
      })
      continueQueue();
    });

    loadQueue.push(function() {
      dimensions.date = ndx.dimension(function (d) {
        return d.date;
      });
      continueQueue();
    });

    loadQueue.push(function() {
      dimensions.day_of_week = ndx.dimension(function (d) {
        var day = d.date.getDay();
        var name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return day + '. ' + name[day];
      });
      groups.day_of_week = reductio().avg(function (d) {
        return d.quantity;
      })(dimensions.day_of_week.group());
      continueQueue();
    });

    loadQueue.push(function() {
      updateDisplayValue();
      continueQueue();
    });

    loadQueue.push(function() {
      charts.day_of_week = dc.rowChart('#price_by_day_of_week_chart')
        .height(250)
        .width($('#price_by_day_of_week_chart').width())
        .dimension(dimensions.day_of_week)
        .group(groups.day_of_week)
        .valueAccessor(function (d) {
          // Hacky but should work well enough... gives us the average per day
          return d.value.avg * generationSources.length * periodsPerDay;
        })
        .transitionDuration(0);
      charts.day_of_week.xAxis().ticks($('#price_by_day_of_week_chart').width() / 95);
      charts.day_of_week.renderlet(function (chart) {
        chart.selectAll("g.row rect").attr("fill", function (d) {
          return "#337AB7";
        });
      });
      continueQueue();
    });

    loadQueue.push(function() {
      dc.renderAll();
      NProgress.done();
    });

    // Start the queue off
    loadQueue.shift()();
  });

  $('#gxp-select').click(function(){
    $('#gxp-modal').modal('show');
  });

  $('input[name="display_value"]').change(function(){
    display_value = $(this).val();
    updateDisplayValue();
    dc.renderAll();
  });

  function updateDisplayValue() {
    var timeFilters = [];
    if(charts.time) {
      timeFilters = charts.time.filters();
      charts.time.filterAll();
      dc.deregisterChart(charts.time);
    }
    buildTimeChart();

    var dateFilters = [];
    if(charts.date) {
      dateFilters = charts.date.filters();
      charts.date.filterAll();
      dc.deregisterChart(charts.date);
    }
    buildDateChart();

    switch(display_value) {
      case 'average-only':
        var hourGroups = generationSources.map(function(technology){
          return reductio().filter(function(d){ return d.fuel == technology.code; })
            .avg(function(d) { return d.quantity; })(dimensions.hour.group());
        });

        charts.time.group(hourGroups[0], generationSources[0].name).valueAccessor(function(d){
          return d.value.avg * 2; // to get MWh per hour, rather than half hour
        });
        for(var i=1; i<hourGroups.length; i++){
          charts.time.stack(hourGroups[i], generationSources[i].name, function(d) {
            return d.value.avg * 2;
          })
        }

        $(charts.time.anchor()).removeClass('stacked');

        var dateGroups = generationSources.map(function(technology){
          return reductio().filter(function(d){ return d.fuel == technology.code; })
            .avg(function(d) { return d.quantity; })(dimensions.date.group());
        });

        charts.date.group(dateGroups[0], generationSources[0].name). valueAccessor(function(d){
          return d.value.sum;
        });
        for(var i=1; i<dateGroups.length; i++){
          charts.date.stack(dateGroups[i], generationSources[i].name, function(d) {
            return d.value.sum;
          })
        }
        $(charts.date.anchor()).removeClass('stacked');

        break;
      case 'typical-range':
        // Not yet implemented

        break;
      case 'min-max':
        // Not yet implemented

        break;
    };

    if(timeFilters.length == 1) {
      charts.time.replaceFilter(new dc.filters.RangedFilter(timeFilters[0][0], timeFilters[0][1]));
      charts.time.extendBrush();
    }

    if(dateFilters.length == 1) {
      charts.date.replaceFilter(new dc.filters.RangedFilter(dateFilters[0][0], dateFilters[0][1]));
      charts.date.render(); // necessary only for date chart
      charts.date.extendBrush();
    }

  }

});

function buildTimeChart() {
  charts.time = dc.lineChart('#price_by_time_chart')
    .height(400)
    .width($('#price_by_time_chart').width())
    .margins({top: 40, right: 50, bottom: 30, left: 30})
    .x(d3.scale.linear().domain([0,23.5]))
    .renderArea(true)
    .brushOn(true)
    .xAxisLabel("Time of day")
    .yAxisLabel('Generation (GW)')
    .elasticY(true)
    .dimension(dimensions.hour)
    .legend(dc.legend().x(50).y(10).autoItemWidth(true).gap(10).horizontal(true))
    .colors(d3.scale.ordinal().range(generationSources.map(function(t) { return t.colour; })));
}

function buildDateChart() {
  charts.date = dc.lineChart('#price_by_dom_chart')
    .height(160)
    .width($('#price_by_dom_chart').width())
    .x(d3.time.scale().domain([new Date(2015,1,1), new Date(2016,1,0)]))
    .round(d3.time.day.round)
    .renderArea(true)
    .brushOn(true)
    .xAxisLabel("Date")
    .yAxisLabel("Generation (GWh)")
    .elasticY(true)
    .dimension(dimensions.date)
    .colors(d3.scale.ordinal().range(generationSources.map(function(t) { return t.colour; })));
  charts.date.xAxis().ticks($('#price_by_dom_chart').width() / 95);
}