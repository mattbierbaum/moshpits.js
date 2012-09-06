// all of the global variables for dynamics
var x=[];
var y=[];
var vx=[];
var vy=[];
var fx=[];
var fy=[];
var r=[];
var type=[];

// things we can change
var n = 1000;
var pbc = [1,1];

// neighborlist stuff
var lx, ly;
var size = [0,0];
var NMAX = 50;
var cells = [];
var count = [];

var radius = 1.0;
var R = 2*radius;
var FR= 2*R;
var gdt = 0.1;

// the variables we change
var epsilon = 100;
var flock   = 0.55;
var noise   = 0.0;

// some other constants that are 1
var vhappy = 1.0;
var damp   = 1.0;

// display variables
var c;
var ctx;
var empty;
var frame = 0;
var dodraw = true;

var MONITOR_GLOBALS=false;

function rgb_to_color(r,g,b) {
    return 'rgb('+r+','+b+','+g+')';
}

function mymod(a, b){
  return a - b*Math.floor(a/b) + b*(a<0);
}

function mod_rvec(a, b, p, image, iind){
    image[iind] = 1;
    if (b==0) {if (a==0) {image[iind]=0;} return 0;}
    if (p != 0){
        if (a>b)  {return a-b-1;}
        if (a<0)  {return a+b+1;}
    } else {
        if (a>b)  {return b;}
        if (a<0)  {return 0;}
    }
    image[iind] = 0;
    return a;
}


function nbl_bin(){
    for (var i=0; i<size[0]*size[1]; i++){
        count[i] = 0;
    }
    for (var i=0; i<n; i++){
        var indx = Math.floor(x[i]/lx * size[0]);
        var indy = Math.floor(y[i]/ly * size[1]);
        var tt = indx + indy*size[0];
        cells[NMAX*tt + count[tt]] = i;
        count[tt]++;
    }
}


function update(){
    var image = [0,0];
    for (var i=0; i<n; i++) {
        fx[i] = 0.0; 
        fy[i] = 0.0;
        var wx = 0.0; 
        var wy = 0.0;
        var neigh = 0;

        var indx = Math.floor(x[i]/lx * size[0]);
        var indy = Math.floor(y[i]/ly * size[1]);
        for (var ttx=-1; ttx<=1; ttx++){
        for (var tty=-1; tty<=1; tty++){ 
            var goodcell = 1;
            var tixx = mod_rvec(indx+ttx, size[0]-1, pbc[0], image, 0);
            var tixy = mod_rvec(indy+tty, size[1]-1, pbc[1], image, 1);
            if (pbc[0] < image[0]){ goodcell = 0; }
            if (pbc[1] < image[1]){ goodcell = 0; }
            
            if (goodcell){
                var cell = tixx + tixy*size[0];
                for (var cc=0; cc<count[cell]; cc++){
                    var j = cells[NMAX*cell + cc]; 
                    var dx = x[j] - x[i]; if (image[0]) {dx += lx*ttx;}
                    var dy = y[j] - y[i]; if (image[1]) {dy += ly*tty;}
                    var l = Math.sqrt(dx*dx + dy*dy);
                    if (l > 1e-6 && l < R){
                        var r0 = (r[i]+r[j]);
                        var f = (1-l/r0);
                        var c0 = -epsilon * f*f * (l<r0);
                        fx[i] += c0*dx;
                        fy[i] += c0*dy;
                    }
                    if (type[i] == 1 && type[j] == 1 && l > 1e-6 && l < FR){
                        wx += vx[j]; wy += vy[j];
                        neigh++;
                    }
                }
            }   
        } }
        var wlen = (wx*wx + wy*wy);
        if (type[i] == 1 && neigh > 0 && wlen > 1e-6){
            fx[i] += flock * wx / wlen;
            fy[i] += flock * wy / wlen;
        }
   
        var vlen = (vx[i]*vx[i] + vy[i]*vy[i]);
        var vhap = 0.0;
        if (type[i]==1) { vhap = vhappy; } else { vhap = 0.0; }
        if (vlen > 1e-6){
            fx[i] += damp*(vhap - vlen)*vx[i]/vlen;
            fy[i] += damp*(vhap - vlen)*vy[i]/vlen;
        }

        if (type[i] == 1){
            fx[i] += noise * (Math.random()-0.5);
            fy[i] += noise * (Math.random()-0.5);
        }
    }

    for (var i=0; i<n; i++){
        vx[i] += fx[i] * gdt;
        vy[i] += fy[i] * gdt;

        x[i] += vx[i] * gdt;
        y[i] += vy[i] * gdt;
    
        if (pbc[0] == 0){
            if (x[i] >= lx){x[i] = 2*lx-x[i]; vx[i] *= -1;}
            if (x[i] < 0)  {x[i] = -x[i];     vx[i] *= -1;}
        } else {
            if (x[i] >= lx || x[i] < 0) {x[i] = mymod(x[i], lx);}
        }
        if (pbc[1] == 0){
            if (y[i] >= ly){y[i] = 2*ly-y[i]; vy[i] *= -1;}
            if (y[i] < 0)  {y[i] = -y[i];     vy[i] *= -1;}
        } else {
            if (y[i] >= ly || y[i] < 0) {y[i] = mymod(y[i], ly);}
        } 
    }
}

function draw_all(x, y, r, lx, ly, cw, ch, ctx) {
    var sx = cw/lx;
    var sy = ch/ly;
    var ss = Math.sqrt(sx*sy);
    for (var i=0; i<x.length; i++) {
        var indx = Math.floor(x[i]/lx * size[0]);
        var indy = Math.floor(y[i]/ly * size[1]);
        ctx.beginPath();
        ctx.arc(sx*x[i], sy*y[i], ss*r[i], 0, 2*Math.PI, true);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000000";
        ctx.stroke();

        if (type[i] == 0){
            ctx.fillStyle = "#333333";
        } else {
            ctx.fillStyle = "#ff0000";
        }
        ctx.fill();
    }
}

function init_empty(){
    r = [];
    x = [];
    y = [];
    vx = [];
    vy = [];
    type = [];

    for (var i=0; i<n; i++) {
        r.push(0.0);
        x.push(0.0);
        y.push(0.0);
        type.push(0);
        vx.push(0.0);
        vy.push(0.0);
    }
}

function init_circle(frac){
    for (var i=0; i<n; i++) {
        var tx = lx*Math.random();
        var ty = ly*Math.random();
        var tt = 2*Math.PI*Math.random();

        r[i] = radius;
        x[i] = tx;
        y[i] = ty;
        var dd = Math.sqrt((tx-lx/2)*(tx-lx/2) + (ty-ly/2)*(ty-ly/2));
        var rad = Math.sqrt(frac*lx*ly/Math.PI);
        if (dd<rad){ type[i] = 1; }else{ type[i] = 0; }
        vx[i] = vhappy*(Math.random()-0.5);
        vy[i] = vhappy*(Math.random()-0.5);
    }
}

function update_flock(){
    var v = document.getElementById('flock').value;
    flock = v;
    document.getElementById('label_flock').innerHTML = v;
}

function update_noise(){
    var v = document.getElementById('noise').value;
    noise = v;
    document.getElementById('label_noise').innerHTML = v;
}

function update_pause(){
    if (dodraw == true){
        dodraw = false;
    } else {
        requestAnimationFrame(tick, c);
        dodraw = true;
    }
}

function update_restart(){
    init_empty();
    init_circle(0.15);
}

var tick = function(T) {
    if (dodraw == true) {
        ctx.fillStyle = 'rgba(200,200,200,0.2)';
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillRect(0,0,c.width,c.height);
        for (var i=0; i<2; i++){
            frame++;
            nbl_bin();
            update();
        }
        
        draw_all(x, y, r, lx, ly, c.width, c.height, ctx);
        requestAnimationFrame(tick, c);
    }
};

var init = function() {
    // create the canvas element
    empty = document.createElement('canvas');
    empty.width = empty.height = 1;
    c = document.getElementById('canvas');
    c.style.cursor = 'url('+empty.toDataURL()+')';
    ctx = c.getContext('2d');

    document.getElementById('flock').value = flock;
    document.getElementById('noise').value = noise;
    document.getElementById('label_flock').innerHTML = flock;
    document.getElementById('label_noise').innerHTML = noise;

    lx = 1.03*Math.sqrt(Math.PI*radius*radius*n);
    ly = lx;
    init_empty();
    init_circle(0.15);

    /* initialize the neighborlist */
    size[0] = Math.floor(lx / FR);
    size[1] = Math.floor(ly / FR);
    for (var i=0; i<size[0]*size[1]*NMAX; i++){
        cells.push(0)
    }
    for (var i=0; i<size[0]*size[1]; i++){
        count.push(0)
    }

    /* run the simulation loop */

    c.addEventListener('mousemove', function(ev) {
        mx = ev.clientX;
        my = ev.clientY;
    }, false);

    c.addEventListener('click', function(ev) {
        ev.preventDefault();
    }, false);

    c.addEventListener('mouseout', function(ev) {
        mx = -1;
        my = -1;
    }, false);

    registerAnimationRequest();
    requestAnimationFrame(tick, c);
};
window.onload = init;


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

if (MONITOR_GLOBALS) {
    (function(){
      var globals = {};
      var startGlobals = [];
      for (var j in window) {
        globals[j] = true;
        startGlobals.push(j);
      }
      if (false ) // PRINT_INITIAL_GLOBALS )
        console.log("Initial globals: "+startGlobals.sort().join(', '));
      setInterval(function() {
        var newGlobals = [];
        for (var j in window) {
          if (!globals[j]) {
            globals[j] = true;
            newGlobals.push(j);
          }
        }
        if (newGlobals.length > 0)
          console.log("NEW GLOBALS: "+newGlobals.sort().join(', '));
      }, 1000);
    })();
}

