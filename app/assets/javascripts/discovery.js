var ndx;
var dimensions = {};
var groups = {};
var charts = {};

$(function(){
  d3.csv("/data", function(data) {
    data.forEach(function(d){
      d.hour = (+d.period - 1) / 2;
      d.price = +d.price;
      d.date = new Date(d.date);
    });

    ndx = crossfilter(data);

    dimensions.hour = ndx.dimension(function(d) {
      return d.hour;
    });
    groups.hour = average(dimensions.hour, 'price');

    dimensions.date = ndx.dimension(function(d) {
      return d.date;
    });
    groups.date = average(dimensions.date, 'price');

    dimensions.day_of_week = ndx.dimension(function (d) {
      var day = d.date.getDay();
      var name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return day + '. ' + name[day];
    });
    groups.day_of_week = average(dimensions.day_of_week, 'price');

    charts.time = dc.lineChart('#price_by_time_chart')
      .height(480)
      .x(d3.scale.linear().domain([0,23.5]))
      .renderArea(true)
      .brushOn(true)
      .xAxisLabel("Time of day")
      .yAxisLabel("Price ($/GWh)")
      .elasticY(true)
      .dimension(dimensions.hour)
      .group(groups.hour)
      .valueAccessor(function(d){
        return d.value.avg;
      });
    charts.time.width($('#price_by_time_chart').width())

    charts.date = dc.lineChart('#price_by_dom_chart')
      .height(200)
      .x(d3.time.scale().domain([new Date(2015,11,1), new Date(2016,1,0)]))
      .round(d3.time.day.round)
      .renderArea(true)
      .brushOn(true)
      .xAxisLabel("Day of month")
      .yAxisLabel("Price ($/GWh)")
      .elasticY(true)
      .dimension(dimensions.date)
      .group(groups.date)
      .valueAccessor(function(d){
        return d.value.avg;
      });
    charts.date.width($('#price_by_dom_chart').width())

    charts.day_of_week = dc.rowChart('#price_by_day_of_week_chart')
      .height(400)
      .width($('#price_by_day_of_week_chart').width())
      .dimension(dimensions.day_of_week)
      .group(groups.day_of_week)
      .valueAccessor(function(d){
        return d.value.avg;
      });


    dc.renderAll();
  });
});