var graph;
var graphctx;

var all = [];
var big = [];
var maxnum = 300;
var maxvala = 1e-6;
var maxvalb = 1e-6;
var temp = 0;
var pushes = 0;
var increment = 50;

var data   = [];
var order  = [];
var maxvs  = 40000;
var bins   = 500;
var maxvel = 1;
var maxbin = 1;

function graph_push(d){
    all.push(d);
    pushes++;
    if (pushes % increment == 0) {
        var v = temp/increment;
        temp = 0;
        big.push(v); 
        if (Math.abs(v) > maxvala) {
            maxvala = Math.abs(v);
        }
    }
    else {
        temp += d;
    }
    if (Math.abs(d) > maxvalb) {maxvalb = Math.abs(d);}
    if (big.length > maxnum){ big.shift(); }
    if (all.length > maxnum){ all.shift(); }
}

function graph_vel(v){
    if (v < maxvel){
        var ind = Math.floor(bins*v/maxvel);
        order.push(ind);
        if (order.length > maxvs){
            if (data[order[0]] == maxbin){maxbin--;}
            data[order[0]]--;
            order.shift();
        }
        data[ind] += 1;
        if (data[ind] > maxbin){
           maxbin = data[ind];
        }
    }
}

function graph_del(){
    data = [];
    all = [];
    big = [];
    pushes = 0;
    order = [];
    maxvala = 1e-6;
    maxvalb = 1e-6;
    maxbin = 1;
    for (var i=0; i<bins; i++){
        data.push(0);
    }
}

function graph_clear(){
    graphctx.fillStyle = 'rgba(200,200,200,0.2)';
    graphctx.clearRect(0, 0, graph.width, graph.height);
    graphctx.fillRect(0,0, graph.width, graph.height);
}

function calcx1a(i){return ((graph.width/4 / big.length) * i);}
function calcy1a(d){return graph.height/2 + ((graph.height/2) / maxvala) * d; }
function calcx1b(i){return graph.width/4 + ((graph.width/4 / all.length) * i);}
function calcy1b(d){return graph.height/2 + ((graph.height/2) / maxvalb) * d; }
function calcx2(i){return ((graph.width/2 / bins) * i) + graph.width/2;}
function calcy2(d){return graph.height - ((graph.height) / maxbin) * d; }

function graph_draw(){
    graphctx.beginPath();
    graphctx.moveTo(0, graph.height/2);
    graphctx.lineTo(graph.width/2, graph.height/2);
    graphctx.stroke();

    graphctx.beginPath();
    graphctx.moveTo(graph.width/2, 0); 
    graphctx.lineTo(graph.width/2, graph.height);
    graphctx.stroke();

    graphctx.beginPath();
    graphctx.moveTo(graph.width/4, 0); 
    graphctx.lineTo(graph.width/4, graph.height);
    graphctx.stroke();

    for (var i=0; i<data.length-1; i++){
        graphctx.beginPath();   
        graphctx.moveTo(calcx2(i),   calcy2(data[i])  );
        graphctx.lineTo(calcx2(i+1), calcy2(data[i+1]));
        graphctx.stroke();
    }
    for (var i=0; i<all.length-1; i++){
        graphctx.beginPath();   
        graphctx.moveTo(calcx1b(i),   calcy1b(all[i])  );
        graphctx.lineTo(calcx1b(i+1), calcy1b(all[i+1]));
        graphctx.stroke();
    }
    for (var i=0; i<big.length-1; i++){
        graphctx.beginPath();   
        graphctx.moveTo(calcx1a(i),   calcy1a(big[i])  );
        graphctx.lineTo(calcx1a(i+1), calcy1a(big[i+1]));
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


