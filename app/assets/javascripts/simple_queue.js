// A quick and dirty implementation of a queue to prevent the UI thread from being tied up for several seconds, and
// allow a progress bar to work. You can push functions onto the queue, and when you call myQueue.start(), it will
// run each function in a chain of window.setTimeout calls.

function SimpleQueue() {
  var queue = [];

  this.getQueue = function() {
    return queue;
  };

  this.push = function(f) {
    var self = this;

    // Push a function onto the queue that executes the user-specified function, then sets a timeout to execute the
    // next function if there is one
    queue.push(function() {
      f();
      var next = queue.shift();
      if(next) window.setTimeout(next, 0);
    });
  };

  this.start = function() {
    var first = queue.shift();
    first();
  };
}
