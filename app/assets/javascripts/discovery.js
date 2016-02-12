var ndx;
var priceByTimeDimension;
var priceByTimeGroup;

var avgAdd = function (p, v) {
  ++p.count;
  p.total += v.Price;
  p.avg = p.total / p.count;
  return p;
}

var avgRemove = function (p, v) {
  --p.count;
  p.total -= v.Price;
  p.avg = p.count ? p.total / p.count : 0;
  return p;
}

var avgInitial = function () {
  return {count: 0, total: 0, avg: 0};
}

$(function(){
  d3.csv("/TKR0331.csv", function(data) {
    data.forEach(function(d){
      d.Trading_period = (+d.Trading_period - 1) / 2;
      d.Price = +d.Price;
      d.Trading_date = new Date(d.Trading_date);
    });

    console.log(data)

    ndx = crossfilter(data);

    priceByTimeDimension = ndx.dimension(function(d) {
      return d.Trading_period;
    });
    priceByTimeGroup = priceByTimeDimension.group().reduce(avgAdd, avgRemove, avgInitial);

    priceByDomDimension = ndx.dimension(function(d) {
      return d.Trading_date;
    });
    priceByDomGroup = priceByDomDimension.group().reduce(avgAdd, avgRemove, avgInitial);

    var priceByTimeChart = dc.lineChart('#price_by_time_chart')
      .width(768)
      .height(480)
      .x(d3.scale.linear().domain([0,23.5]))
      .renderArea(true)
      .brushOn(true)
      .yAxisLabel("Price ($/GWh)")
      .elasticY(true)
      .dimension(priceByTimeDimension)
      .group(priceByTimeGroup)
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
      //.elasticY(true)
      .dimension(priceByDomDimension)
      .group(priceByDomGroup)
      .valueAccessor(function(d){
        return d.value.avg;
      });
    priceByDomChart.width($('#price_by_dom_chart').width())


    dc.renderAll();


  });
});