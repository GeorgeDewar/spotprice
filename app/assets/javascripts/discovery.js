var ndx;
var priceByTimeDimension;
var priceByTimeGroup;

$(function(){
  d3.csv("/TKR0331.csv", function(data) {
    data.forEach(function(d){
      d.Trading_period = +d.Trading_period;
      d.Price = +d.Price;
    });

    ndx = crossfilter(data);

    priceByTimeDimension = ndx.dimension(function(d) {
      return d.Trading_period;
    });
    priceByTimeGroup = priceByTimeDimension.group().reduce(
      function (p, v) {
        ++p.count;
        p.total += v.Price;
        p.avg = p.total / p.count;
        return p;
      },
      function (p, v) {
        --p.count;
        p.total -= v.Price;
        p.avg = p.count ? p.total / p.count : 0;
        return p;
      },
      function () {
        return {count: 0, total: 0, avg: 0};
      }
    );

    var priceByTimeChart = dc.lineChart('#price_by_time_chart')
      .width(768)
      .height(480)
      .x(d3.scale.linear().domain([0,48]))
      .renderArea(true)
      .brushOn(true)
      .yAxisLabel("Price ($/GWh)")
      //.elasticY(true)
      .dimension(priceByTimeDimension)
      .group(priceByTimeGroup)
      .valueAccessor(function(d){
        return d.value.avg;
      });

    priceByTimeChart.render();
    dc.renderAll();
    dc.redrawAll();

  });
});