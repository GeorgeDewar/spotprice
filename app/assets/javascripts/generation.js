var ndx;
var dimensions = {};
var groups = {};
var charts = {};
var display_value = 'average-only';
var technologies = ["Wind", "Geo", "Cogen", "Thrml", "Hydro"];
var periodsPerDay = 48;

$(function(){
  d3.csv("/data/generation", function(data) {
    data.forEach(function(d){
      d.hour = (+d.period - 1) / 2;
      d.quantity = +d.quantity / 1000; // MWh
      d.date = new Date(d.date);
    });

    ndx = crossfilter(data);

    dimensions.hour = ndx.dimension(function(d) {
      return d.hour;
    });
    groups.hour = reductio()
      .min(function(d) { return d.quantity; })
      .max(function(d) { return d.quantity; })
      .avg(function(d) { return d.quantity; })
      .std(function(d) { return d.quantity; })(dimensions.hour.group());

    dimensions.date = ndx.dimension(function(d) {
      return d.date;
    });
    groups.date = reductio()
      .min(function(d) { return d.quantity; })
      .max(function(d) { return d.quantity; })
      .avg(function(d) { return d.quantity; })
      .std(function(d) { return d.quantity; })(dimensions.date.group());

    dimensions.day_of_week = ndx.dimension(function (d) {
      var day = d.date.getDay();
      var name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return day + '. ' + name[day];
    });
    groups.day_of_week = reductio().avg(function(d) { return d.quantity; })(dimensions.day_of_week.group());

    updateDisplayValue();

    charts.day_of_week = dc.rowChart('#price_by_day_of_week_chart')
      .height(250)
      .width($('#price_by_day_of_week_chart').width())
      .dimension(dimensions.day_of_week)
      .group(groups.day_of_week)
      .valueAccessor(function(d){
        // Hacky but should work well enough... gives us the average per day
        return d.value.avg * technologies.length * periodsPerDay;
      })
      .transitionDuration(0);
    charts.day_of_week.xAxis().ticks($('#price_by_day_of_week_chart').width() / 95);;
    charts.day_of_week.renderlet(function(chart) {
      chart.selectAll("g.row rect").attr("fill", function (d) {
        return "#337AB7";
      });
    });

    dc.renderAll();
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
        var groups = technologies.map(function(g){
          return reductio().filter(function(d){ return d.technology == g; })
            .avg(function(d) { return d.quantity; })(dimensions.hour.group());
        });

        charts.time.group(groups[0]).valueAccessor(function(d){
          return d.value.avg;
        }).stack(groups[1], function(d) {
          return d.value.avg;
        }).stack(groups[2], function(d) {
          return d.value.avg;
        }).stack(groups[3], function(d) {
          return d.value.avg;
        }).stack(groups[4], function(d) {
          return d.value.avg;
        });
        $(charts.time.anchor()).removeClass('stacked');

        charts.date.valueAccessor(function(d){
          return d.value.sum;
        });
        $(charts.date.anchor()).removeClass('stacked');

        break;
      case 'typical-range':
        charts.time.valueAccessor(function(d){
          return (d.value.avg - d.value.std);
        }).stack(groups.hour, function(d) {
          return d.value.std;
        }).stack(groups.hour, function(d) {
          return d.value.std;
        });
        $(charts.time.anchor()).addClass('stacked');

        charts.date.valueAccessor(function(d){
          return (d.value.avg - d.value.std);
        }).stack(groups.date, function(d) {
          return d.value.std;
        }).stack(groups.date, function(d) {
          return d.value.std;
        });
        $(charts.date.anchor()).addClass('stacked');

        break;
      case 'min-max':
        charts.time.valueAccessor(function(d){
          return d.value.min;
        }).stack(groups.hour, function(d) {
          return (d.value.avg - d.value.min);
        }).stack(groups.hour, function(d) {
          return (d.value.max - d.value.avg);
        });
        $(charts.time.anchor()).addClass('stacked');

        charts.date.valueAccessor(function(d){
          return d.value.min;
        }).stack(groups.date, function(d) {
          return (d.value.avg - d.value.min);
        }).stack(groups.date, function(d) {
          return (d.value.max - d.value.avg);
        });
        $(charts.date.anchor()).addClass('stacked');

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
    .x(d3.scale.linear().domain([0,23.5]))
    .renderArea(true)
    .brushOn(true)
    .xAxisLabel("Time of day")
    .yAxisLabel('Quantity (MWh per 30min period)')
    .elasticY(true)
    .dimension(dimensions.hour)
    .group(groups.hour);
  charts.time.width($('#price_by_time_chart').width());
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
    .yAxisLabel(" ")
    .elasticY(true)
    .dimension(dimensions.date)
    .group(groups.date);
  charts.date.xAxis().ticks($('#price_by_dom_chart').width() / 95);
}