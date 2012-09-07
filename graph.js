var graph;
var graphctx;
var data = [];
var maxlen = 1000;
var maxval = 1e-6;

function graph_push(d){
    data.push(d);
    if (data.length > maxlen){data.shift();}
    if (Math.abs(d) > maxval) {maxval = Math.abs(d);}
}

function graph_del(){
    data = [];
    maxval = 1e-6;
}

function graph_clear(){
    graphctx.fillStyle = 'rgba(200,200,200,0.2)';
    graphctx.clearRect(0, 0, graph.width, graph.height);
    graphctx.fillRect(0,0, graph.width, graph.height);
}

function calcx(i){
    return ((graph.width / maxlen) * i);
}

function calcy(d){
    return graph.height/2 + ((graph.height/2) / maxval) * d; 
}

function graph_draw(){
    graphctx.beginPath();
    graphctx.moveTo(0, graph.height/2);
    graphctx.lineTo(graph.width, graph.height/2);
    graphctx.stroke();

    for (var i=0; i<data.length-1; i++){
        graphctx.beginPath();   
        graphctx.moveTo(calcx(i),   calcy(data[i])  );
        graphctx.lineTo(calcx(i+1), calcy(data[i+1]));
        graphctx.stroke();
    }
}

function graph_init() {
    graph = document.getElementById('graph');
    graphctx = graph.getContext('2d');
};


// Provides requestAnimationFrame in a cross browser way.
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
function registerAnimationRequest() {
if ( !window.requestAnimationFrame ) {
    window.requestAnimationFrame = ( function() {
      return window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame || // comment out if FF4 is slow (it caps framerate at ~30fps)
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
              window.setTimeout( callback, 1 ); /*1000 / 60 );*/
      };
    } )();
}
}


