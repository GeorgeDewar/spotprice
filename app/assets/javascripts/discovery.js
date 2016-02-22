var ndx;
var dimensions = {};
var groups = {};
var charts = {};

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
    groups.date = reductio().avg(function(d) { return d.price; })(dimensions.date.group());

    dimensions.day_of_week = ndx.dimension(function (d) {
      var day = d.date.getDay();
      var name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return day + '. ' + name[day];
    });
    groups.day_of_week = average(dimensions.day_of_week, 'price');

    charts.time = dc.lineChart('#price_by_time_chart')
      .height(400)
      .x(d3.scale.linear().domain([0,23.5]))
      .renderArea(true)
      .brushOn(true)
      .xAxisLabel("Time of day")
      .yAxisLabel("Price ($/GWh)")
      .elasticY(true)
      .dimension(dimensions.hour)
      .group(groups.hour)
      .valueAccessor(function(d){
        return d.value.avg - d.value.std;
      });
    charts.time.stack(groups.hour, function(d) {
      return d.value.std;
    }).stack(groups.hour, function(d) {
      return d.value.std;
    });
    charts.time.width($('#price_by_time_chart').width())

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
      .group(groups.date)
      .valueAccessor(function(d){
        return d.value.avg;
      })
      .xAxis().ticks($('#price_by_dom_chart').width() / 95);

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

  $('#gxp-dropdown').change(function(){
    //$('form').submit();
  });
});