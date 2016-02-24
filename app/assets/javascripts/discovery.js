var ndx;
var dimensions = {};
var groups = {};
var charts = {};
var display_value = 'typical-range';
var price_scale = 'dollars-per-mwh';

$(function(){
  d3.csv("/data?node=" + NODE, function(data) {
    data.forEach(function(d){
      d.hour = (+d.period - 1) / 2;
      d.price = +d.price;
      d.date = new Date(d.date);
    });

    ndx = crossfilter(data);

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

    //buildTimeChart();
    //charts.time.valueAccessor(function(d){
    //    return (d.value.avg - d.value.std) * priceMultiplier();
    //}).stack(groups.hour, function(d) {
    //  return d.value.std * priceMultiplier();
    //}).stack(groups.hour, function(d) {
    //  return d.value.std * priceMultiplier();
    //});
    //
    //buildDateChart();
    //charts.date.valueAccessor(function(d){
    //  return d.value.min * priceMultiplier();
    //}).stack(groups.date, function(d) {
    //  return (d.value.avg - d.value.min) * priceMultiplier();
    //}).stack(groups.date, function(d) {
    //  return (d.value.max - d.value.avg) * priceMultiplier();
    //});

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

  $('input[name="price_scale"]').change(function(){
    price_scale = $(this).val();
    dc.redrawAll();
  });

  function updateDisplayValue() {
    switch(display_value) {
      case 'average-only':
        if(charts.time) dc.deregisterChart(charts.time);
        buildTimeChart();
        charts.time.valueAccessor(function(d){
          return d.value.avg * priceMultiplier();
        });
        $(charts.time.anchor()).removeClass('stacked');

        if(charts.date) dc.deregisterChart(charts.date);
        buildDateChart();
        charts.date.valueAccessor(function(d){
          return d.value.avg * priceMultiplier();
        });
        $(charts.date.anchor()).removeClass('stacked');

        break;
      case 'typical-range':
        if(charts.time) dc.deregisterChart(charts.time);
        buildTimeChart();
        charts.time.valueAccessor(function(d){
          return (d.value.avg - d.value.std) * priceMultiplier();
        }).stack(groups.hour, function(d) {
          return d.value.std * priceMultiplier();
        }).stack(groups.hour, function(d) {
          return d.value.std * priceMultiplier();
        });
        $(charts.time.anchor()).addClass('stacked');

        if(charts.date) dc.deregisterChart(charts.date);
        buildDateChart();
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
        if(charts.time) dc.deregisterChart(charts.time);
        buildTimeChart();
        charts.time.valueAccessor(function(d){
          return d.value.min * priceMultiplier();
        }).stack(groups.hour, function(d) {
          return (d.value.avg - d.value.min) * priceMultiplier();
        }).stack(groups.hour, function(d) {
          return (d.value.max - d.value.avg) * priceMultiplier();
        });
        $(charts.time.anchor()).addClass('stacked');

        if(charts.date) dc.deregisterChart(charts.date);
        buildDateChart();
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