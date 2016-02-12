// Averaging

function average(dimension, field) {
  var avgAdd = function (p, v) {
    ++p.count;
    p.total += v.price;
    p.avg = p.total / p.count;
    return p;
  }

  var avgRemove = function (p, v) {
    --p.count;
    p.total -= v.price;
    p.avg = p.count ? p.total / p.count : 0;
    return p;
  }

  var avgInitial = function () {
    return {count: 0, total: 0, avg: 0};
  }

  return dimension.group().reduce(avgAdd, avgRemove, avgInitial);
}
