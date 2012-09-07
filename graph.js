var graph;
var graphctx;
var all = [];
var data = [];
var maxlen = 100;
var maxval = 1e-6;

function graph_push(d){
    data.push(d);
    all.push(d);
    if (data.length > maxlen){data.shift();}
    if (Math.abs(d) > maxval) {maxval = Math.abs(d);}
}

function graph_del(){
    data = [];
    all = [];
    maxval = 1e-6;
}

function graph_clear(){
    graphctx.fillStyle = 'rgba(200,200,200,0.2)';
    graphctx.clearRect(0, 0, graph.width, graph.height);
    graphctx.fillRect(0,0, graph.width, graph.height);
}

function calcx1(i){return ((graph.width/2 / all.length) * i);}
function calcy1(d){return graph.height/2 + ((graph.height/2) / maxval) * d; }
function calcx2(i){return ((graph.width/2 / maxlen) * i) + graph.width/2;}
function calcy2(d){return graph.height/2 + ((graph.height/2) / maxval) * d; }

function graph_draw(){
    graphctx.beginPath();
    graphctx.moveTo(0, graph.height/2);
    graphctx.lineTo(graph.width, graph.height/2);
    graphctx.stroke();

    graphctx.beginPath();
    graphctx.moveTo(graph.width/2, 0); 
    graphctx.lineTo(graph.width/2, graph.height);
    graphctx.stroke();

    for (var i=0; i<data.length-1; i++){
        graphctx.beginPath();   
        graphctx.moveTo(calcx2(i),   calcy2(data[i])  );
        graphctx.lineTo(calcx2(i+1), calcy2(data[i+1]));
        graphctx.stroke();
    }
    for (var i=0; i<all.length-1; i++){
        graphctx.beginPath();   
        graphctx.moveTo(calcx1(i),   calcy1(all[i])  );
        graphctx.lineTo(calcx1(i+1), calcy1(all[i+1]));
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


