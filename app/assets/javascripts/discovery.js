var ndx;
var dimensions = {};
var groups = {};
var charts = {};
var display_value = 'average-only';
var price_scale = 'dollars-per-mwh';

$(function(){
  var loadQueue = new LoadChain();
  NProgress.configure({ trickle: true });
  NProgress.start();

  d3.csv("/data?node=" + NODE, function(data) {
    NProgress.inc();

    loadQueue.push(function() {
      data.forEach(function (d) {
        d.hour = (+d.period - 1) / 2;
        d.price = +d.price;
        d.date = new Date(d.date);
      });
      NProgress.inc();
    });

    loadQueue.push(function() {
      ndx = crossfilter(data);
      NProgress.inc();
    });

    loadQueue.push(function() {
      dimensions.hour = ndx.dimension(function(d) {
        return d.hour;
      });
      groups.hour = reductio()
        .min(function(d) { return d.price; })
        .max(function(d) { return d.price; })
        .avg(function(d) { return d.price; })
        .std(function(d) { return d.price; })(dimensions.hour.group());

      dimensions.date = ndx.dimension(function(d) {
        return d.date;
      });
      groups.date = reductio()
        .min(function(d) { return d.price; })
        .max(function(d) { return d.price; })
        .avg(function(d) { return d.price; })
        .std(function(d) { return d.price; })(dimensions.date.group());

      dimensions.day_of_week = ndx.dimension(function (d) {
        var day = d.date.getDay();
        var name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return day + '. ' + name[day];
      });
      groups.day_of_week = reductio().avg(function(d) { return d.price; })(dimensions.day_of_week.group());
      NProgress.inc();
    });

    loadQueue.push(function() {
      updateDisplayValue();

      charts.day_of_week = dc.rowChart('#price_by_day_of_week_chart')
        .height(250)
        .width($('#price_by_day_of_week_chart').width())
        .dimension(dimensions.day_of_week)
        .group(groups.day_of_week)
        .valueAccessor(function(d){
          return d.value.avg;
        })
        .transitionDuration(0);
        charts.day_of_week.renderlet(function(chart) {
        chart.selectAll("g.row rect").attr("fill", function (d) {
          return "#337AB7";
        });
      });
      NProgress.inc();
    });

    loadQueue.push(function() {
      dc.renderAll();
      NProgress.done();
    });

    loadQueue.start();
  });

  $('#gxp-select').click(function(){
    $('#gxp-modal').modal('show');
  });

  $('input[name="display_value"]').change(function(){
    display_value = $(this).val();
    updateDisplayValue();
    dc.renderAll();
  });

  $('input[name="price_scale"]').change(function(){
    price_scale = $(this).val();
    dc.redrawAll();
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
        charts.time.valueAccessor(function(d){
          return d.value.avg * priceMultiplier();
        });
        $(charts.time.anchor()).removeClass('stacked');

        charts.date.valueAccessor(function(d){
          return d.value.avg * priceMultiplier();
        });
        $(charts.date.anchor()).removeClass('stacked');

        break;
      case 'typical-range':
        charts.time.valueAccessor(function(d){
          return (d.value.avg - d.value.std) * priceMultiplier();
        }).stack(groups.hour, function(d) {
          return d.value.std * priceMultiplier();
        }).stack(groups.hour, function(d) {
          return d.value.std * priceMultiplier();
        });
        $(charts.time.anchor()).addClass('stacked');

        charts.date.valueAccessor(function(d){
          return (d.value.avg - d.value.std) * priceMultiplier();
        }).stack(groups.date, function(d) {
          return d.value.std * priceMultiplier();
        }).stack(groups.date, function(d) {
          return d.value.std * priceMultiplier();
        });
        $(charts.date.anchor()).addClass('stacked');

        break;
      case 'min-max':
        charts.time.valueAccessor(function(d){
          return d.value.min * priceMultiplier();
        }).stack(groups.hour, function(d) {
          return (d.value.avg - d.value.min) * priceMultiplier();
        }).stack(groups.hour, function(d) {
          return (d.value.max - d.value.avg) * priceMultiplier();
        });
        $(charts.time.anchor()).addClass('stacked');

        charts.date.valueAccessor(function(d){
          return d.value.min * priceMultiplier();
        }).stack(groups.date, function(d) {
          return (d.value.avg - d.value.min) * priceMultiplier();
        }).stack(groups.date, function(d) {
          return (d.value.max - d.value.avg) * priceMultiplier();
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

  function priceMultiplier() {
    return price_scale == 'dollars-per-mwh' ? 1.0 : 0.1;
  }

  function priceScaleName() {
    return price_scale == 'dollars-per-mwh' ? '$/MWh' : '&cent/kWh';
  }

});

function buildTimeChart() {
  charts.time = dc.lineChart('#price_by_time_chart')
    .height(400)
    .x(d3.scale.linear().domain([0,23.5]))
    .renderArea(true)
    .brushOn(true)
    .xAxisLabel("Time of day")
    .yAxisLabel('Price')
    .elasticY(true)
    .dimension(dimensions.hour)
    .group(groups.hour);
  charts.time.width($('#price_by_time_chart').width());
}

function buildDateChart() {
  var from = new Date(FROM);
  from.setHours(0);
  from.setMinutes(0);
  from.setSeconds(0);
  from.setMilliseconds(0);
  var to = new Date(TO);
  to.setHours(0);
  to.setMinutes(0);
  to.setSeconds(0);
  to.setMilliseconds(0);
  to.setDate(to.getDate() + 1);
  charts.date = dc.lineChart('#price_by_dom_chart')
    .height(160)
    .width($('#price_by_dom_chart').width())
    .x(d3.time.scale().domain([from, to]))
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