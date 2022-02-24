var utils = {
  distance: function (p0, p1) {
    var dx = p1.x - p0.x;
    var dy = p1.y - p0.y;
    return Math.sqrt(dx * dx + dy * dy);
  },
  distanceXY: function (x0, y0, x1, y1) {
    var dx = x1 - x0;
    var dy = y1 - y0;
    return Math.sqrt(dx * dx + dy * dy);
  },
  circleCollision: function (c0, c1) {
    return utils.distance(c0, c1) <= c0.radius + c1.radius;
  },
  circlePointCollision: function (x, y, circle) {
    return utils.distanceXY(x, y, circle.x, circle.y) < circle.radius;
  },
};
