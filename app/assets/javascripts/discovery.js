var ndx;
var dimensions = {};
var groups = {};

$(function(){
  d3.csv("/TKR0331.csv", function(data) {
    data.forEach(function(d){
      d.hour = (+d.Trading_period - 1) / 2;
      d.price = +d.Price;
      d.date = new Date(d.Trading_date);
    });

    console.log(data)

    ndx = crossfilter(data);

    dimensions.hour = ndx.dimension(function(d) {
      return d.hour;
    });
    groups.hour = average(dimensions.hour, 'price');

    dimensions.date = ndx.dimension(function(d) {
      return d.date;
    });
    groups.date = average(dimensions.date, 'price');

    var priceByTimeChart = dc.lineChart('#price_by_time_chart')
      .width(768)
      .height(480)
      .x(d3.scale.linear().domain([0,23.5]))
      .renderArea(true)
      .brushOn(true)
      .yAxisLabel("Price ($/GWh)")
      .elasticY(true)
      .dimension(dimensions.hour)
      .group(groups.hour)
      .valueAccessor(function(d){
        return d.value.avg;
      });
    priceByTimeChart.width($('#price_by_time_chart').width())

    var priceByDomChart = dc.lineChart('#price_by_dom_chart')
      .width(768)
      .height(200)
      .x(d3.time.scale().domain([new Date(2016,0,1), new Date(2016,1,0)]))
      .round(d3.time.day.round)
      .renderArea(true)
      .brushOn(true)
      .yAxisLabel("Price ($/GWh)")
      .elasticY(true)
      .dimension(dimensions.date)
      .group(groups.date)
      .valueAccessor(function(d){
        return d.value.avg;
      });
    priceByDomChart.width($('#price_by_dom_chart').width())


    dc.renderAll();


  });
});