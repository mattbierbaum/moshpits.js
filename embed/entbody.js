// all of the global variables for dynamics
var x=[];
var y=[];
var vx=[];
var vy=[];
var fx=[];
var fy=[];
var r=[];
var type=[];
var col=[];
var colavg;
var ivor=[];
var ivoravg;

// things we can change
var n = 500;
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
var flock   = 1.00;
var noise   = 0.3;

// some other constants that are 1
var vhappy = 1.0;
var damp   = 1.0;
var frac   = 0.15;

// display variables
var c;
var ctx;
var empty;
var frame = 0;
var keys = [0,0,0,0];
var frameskip = 2;
var colscale=25;
var dodraw = true;
var docircle = true;
var dovorticity = false;
var showforce = false;
var playmusic = false;
var showcontrol = false;

var MONITOR_GLOBALS=false;

function rgb(r,g,b) {
    return 'rgb('+r+','+g+','+b+')';
}

function toFixed(value, precision) {
    var precision = precision || 0,
    neg = value < 0,
    power = Math.pow(10, precision),
    value = Math.round(value * power),
    integral = String((neg ? Math.ceil : Math.floor)(value / power)),
    fraction = String((neg ? -value : value) % power),
    padding = new Array(Math.max(precision - fraction.length, 0) + 1).join('0');

    return precision ? integral + '.' +  padding + fraction : integral;
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


function calc_vorticity(){
    var vor = 0.0;
    var cmx = 0.0;
    var cmy = 0.0;
    var count = 0;

    for (var i=0; i<n; i++){
        if (type[i] == 1){
            cmx += x[i];
            cmy += y[i];
            count++;
        }
    }
    cmx /= count;
    cmy /= count;

    for (var i=0; i<n; i++){
        if (type[i] == 1){
            var tx = x[i] - cmx;
            var ty = y[i] - cmy;
            var tvx = vx[i];
            var tvy = vy[i];
            var tv = tvx*ty - tvy*tx;
            vor += tv;//sqrt(tx*tx+ty*ty);
            ivor[i] = tv;
        }
    }

    ivoravg = vor/count;
    return -vor/count;
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
    colavg = 0.0;
    var image = [0,0];
    for (var i=0; i<n; i++) {
        col[i] = 0.0;
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

                        var tcol = c0*c0*dx*dx + c0*c0*dy*dy;//fx[i]*fx[i] + fy[i]*fy[i];
                        col[i] += tcol;
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

        if (type[i] == 1){
            if (keys[0] == 1) {fy[i] -= 5.0;}
            if (keys[1] == 1) {fy[i] += 5.0;}
            if (keys[2] == 1) {fx[i] -= 5.0;}
            if (keys[3] == 1) {fx[i] += 5.0;}
        }

        //var tcol = fx[i]*fx[i] + fy[i]*fy[i];
        //col[i] += tcol;
        colavg += col[i];
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
    colavg /= n;
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

        var cr,cg,cb;
        if (type[i] == 0){
            if (showforce == true){
                //cr = Math.floor(255*col[i]/(4*colavg+1e-5)+10);
                //if (cr > 255) {cr = 255;}
                cr = Math.abs(col[i]/colscale);
                if (cr < 0) {cr = 0.0;}
                if (cr > 1) {cr = 1.0;}
                cr = Math.floor(255*cr);
                cg = cr;
                cb = cr;
            } else {
                cr = 50;
                cg = 50;
                cb = 50;
            }
        } else {
            /*if (dovorticity == true){
                if (ivor[i] < 0){
                    cr = Math.floor(Math.abs(255*ivor[i]/(4*ivoravg)));
                    cb = 0;
                } else {
                    cb = Math.floor(Math.abs(255*ivor[i]/(4*ivoravg)));
                    cr = 0;
                }
                cg = 0;
            } else {*/
            cr = 255;
            cg = 0;
            cb = 0;
        }
        ctx.fillStyle = rgb(cr,cg,cb);
        ctx.fill();
    }
}

function calc_sidelength(){
    return Math.floor(1.03*Math.sqrt(Math.PI*radius*radius*n));
}

function init_sidelength(L){
    lx = L;//
    ly = lx;
    update_boxslider();

    /* initialize the neighborlist */
    size[0] = Math.floor(lx / FR);
    size[1] = Math.floor(ly / FR);
    for (var i=0; i<size[0]*size[1]*NMAX; i++){
        cells[i] = 0;
    }
    for (var i=0; i<size[0]*size[1]; i++){
        count[i] = 0;
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
        fx.push(0.0);
        fy.push(0.0);
        col.push(0.0);
    }
}

function init_circle(){
    for (var i=0; i<n; i++) {
        var tx = lx*Math.random();
        var ty = ly*Math.random();
        var tt = 2*Math.PI*Math.random();

        type[i] = 0;
        r[i] = radius;
        x[i] = tx;
        y[i] = ty;
        var dd = Math.sqrt((tx-lx/2)*(tx-lx/2) + (ty-ly/2)*(ty-ly/2));
        var rad = Math.sqrt(frac*lx*ly/Math.PI);
        if (docircle==true){
            if (frac==0.01){type[0] =1;} 
            else if (frac==1.0) {type[i] = 1;}
            else { if (dd<rad){ type[i] = 1; }else{ type[i] = 0; } }
        } else {
            if (frac==0.01){type[0] =1;} 
            else if (frac==1.0) {type[i] = 1;}
            else { if (Math.random() < frac){ type[i] = 1;} else {type[i]=0;} }
        }
        vx[i] = vhappy*(Math.random()-0.5);
        vy[i] = vhappy*(Math.random()-0.5);
    }
}


/*======================================================================
  the javascript interface stuff
=========================================================================*/
function update_epsilon(){
    epsilon = document.getElementById('epsilon').value;
    document.getElementById('label_epsilon').innerHTML = toFixed(epsilon,2);
}
function update_flock(){
    flock = document.getElementById('flock').value;
    document.getElementById('label_flock').innerHTML = toFixed(flock,2);
}
function update_noise(){
    noise = document.getElementById('noise').value;
    document.getElementById('label_noise').innerHTML = toFixed(noise,2);
}
function update_speed(){
    vhappy = document.getElementById('speed').value;
    document.getElementById('label_speed').innerHTML = toFixed(vhappy,2);
}
function update_damp(){
    damp = document.getElementById('damp').value;
    document.getElementById('label_damp').innerHTML = toFixed(damp,2);
}
function update_boxsize(){
    lx = ly = document.getElementById('boxsize').value;
    document.getElementById('label_boxsize').innerHTML = toFixed(lx, 2);
}
function update_dt(){
    gdt = document.getElementById('dt').value;
    document.getElementById('label_dt').innerHTML = toFixed(gdt, 2);
}
function update_frames(){
    frameskip = document.getElementById('frames').value;
    document.getElementById('label_frames').innerHTML = toFixed(frameskip, 2);
}
function update_frac(){
    frac = document.getElementById('frac').value;
    document.getElementById('label_frac').innerHTML = toFixed(frac, 2);
}
function update_colscale(){
    colscale = document.getElementById('colscale').value;
    document.getElementById('label_colscale').innerHTML = toFixed(colscale, 2);
}
function update_pbcx(){  pbc[0] = document.getElementById('periodicx').checked;    }
function update_pbcy(){  pbc[1] = document.getElementById('periodicy').checked;    }
function update_force(){ showforce = document.getElementById('showforce').checked; }
function update_circle(){docircle = document.getElementById('docircle').checked;   }

/*function update_music() {
    playmusic = document.getElementById('music').checked;
    if (playmusic == true) { 
        var yt = document.getElementById('yt')
        if (yt.playVideo) {
            yt.playVideo();
        } 
    }
    else { 
        var yt = document.getElementById('yt')
        if (yt.pauseVideo) {
            yt.pauseVideo(); 
        }  
    }
}*/

function update_vorticity(){
    dovorticity = document.getElementById('vorticity').checked;   
}

function update_restart(){ 
    init_empty(); 
    init_circle(frac); 
    if (dodraw == false){ update_pause(); }
}

function update_pause(){
    if (dodraw == true){
        document.getElementById('pause').value = 'Start';
        dodraw = false;
    } else {
        document.getElementById('pause').value = 'Pause';
        requestAnimationFrame(tick, c);
        dodraw = true;
    }
}

function update_controls(){
    if (showcontrol == true){
        document.getElementById('controls').value = 'Show controls';
        document.getElementById('entbody').style.width = '400px';
        document.getElementById('canvas').style.dislpay = 'block';
        document.getElementById('panelcontainer').style.width = '0px';
        document.getElementById('panelcontainer').style.display = 'none';
        showcontrol = false;
    } else {
        document.getElementById('controls').value = 'Hide controls';
        document.getElementById('entbody').style.width = '0px';
        document.getElementById('canvas').style.dislpay = 'none';
        document.getElementById('panelcontainer').style.width = '400px';
        document.getElementById('panelcontainer').style.display = 'block';
        showcontrol = true;
    }
}

function update_boxslider(){
/*    var box = document.getElementById('boxsize');
    var boxsize = Math.floor(lx);
    var frac = 0.15
    box.min = Math.floor(boxsize*(1-frac));
    box.max = Math.floor(boxsize*(1+frac));
    box.step = (2*frac*boxsize/20);
    box.value = boxsize;
    document.getElementById('label_boxsize').innerHTML = toFixed(lx, 2);*/
}

function update_num(){
    n = document.getElementById('num').value;
    init_sidelength(lx);//calc_sidelength());
    update_restart();
    update_boxslider();
}

/*===============================================================================
    initialization and drawing 
================================================================================*/
var tick = function(T) {
    if (dodraw == true) {
        ctx.fillStyle = 'rgba(200,200,200,0.2)';
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillRect(0,0,c.width,c.height);
        
        if (showcontrol == false){
            for (var i=0; i<frameskip; i++){
                frame++;
                nbl_bin();
                update();
            }
 
            draw_all(x, y, r, lx, ly, c.width, c.height, ctx);
        }
        requestAnimationFrame(tick, c);
    }
};

function update_allcontrols(){
    document.getElementById('num').value = n;
    document.getElementById('periodicx').checked = pbc[0];
    document.getElementById('periodicy').checked = pbc[1];
    document.getElementById('docircle').checked = docircle
    document.getElementById('showforce').checked = showforce;
    document.getElementById('epsilon').value = epsilon;
    document.getElementById('flock').value = flock;
    document.getElementById('noise').value = noise;
    document.getElementById('speed').value = vhappy;
    document.getElementById('damp').value = damp;
    document.getElementById('boxsize').value = lx;
    document.getElementById('dt').value = gdt;
    document.getElementById('frames').value = frameskip;
    document.getElementById('frac').value = frac;
    document.getElementById('colscale').value = colscale;
    document.getElementById('label_epsilon').innerHTML  = toFixed(epsilon,2);
    document.getElementById('label_flock').innerHTML    = toFixed(flock,2);
    document.getElementById('label_noise').innerHTML    = toFixed(noise,2);
    document.getElementById('label_speed').innerHTML    = toFixed(vhappy,2);
    document.getElementById('label_damp').innerHTML     = toFixed(damp,2);
    document.getElementById('label_boxsize').innerHTML  = toFixed(lx,2);
    document.getElementById('label_dt').innerHTML       = toFixed(gdt,2);
    document.getElementById('label_frames').innerHTML   = toFixed(frameskip,2);
    document.getElementById('label_frac').innerHTML     = toFixed(frac,2);
    document.getElementById('label_colscale').innerHTML = toFixed(colscale,2);
    
    /*document.getElementById('music').value = playmusic;
    if (playmusic == true) { 
        var yt = document.getElementById('yt')
        if (yt.playVideo) {
            yt.playVideo();
        } 
    }
    else { 
        var yt = document.getElementById('yt')
        if (yt.pauseVideo) {
            yt.pauseVideo(); 
        }  
    }*/
}

function create_moshpit(){
     init_empty();
    n=500; frac=0.15; frameskip = 2;
    vhappy=1.0; noise=2.0;  flock=0.1; epsilon=100; damp=1.0;dt=0.1;
    init_sidelength(calc_sidelength()); init_circle(frac);   dovorticity = true; dodraw=false;update_pause();
    showforce = false; update_allcontrols(); 
}

function create_circlepit(){
     init_empty();
    n=500; frac=0.15; frameskip = 2; 
    vhappy=1.0; noise=0.3;  flock=1.0; epsilon=100; damp=1.0;dt=0.1;
    init_sidelength(calc_sidelength()); init_circle(frac);   dovorticity = true; dodraw=false;update_pause();
    showforce = false; update_allcontrols(); 
}

function create_chains(){
    init_empty();
    n=500; frac=0.01; frameskip=3;
    vhappy=1.0; noise=0.0;  flock=0.0; epsilon=150; damp=1.0;dt=0.1;
    init_sidelength(48); init_circle(frac);   showforce = true; dodraw=false;update_pause();
    dovorticity = false; update_allcontrols(); 
}

function create_crystal(){
    init_empty();
    n=500; frac=0.01; frameskip=2;
    vhappy=0.0; noise=0.0;  flock=0.0; epsilon=100; damp=1.0;dt=0.1;
    init_sidelength(39.0); init_circle(frac);   showforce = true; dodraw=false;update_pause();
    dovorticity = false; update_allcontrols(); 
}

function reverse() { for (var i=0; i<n; i++){ vx[i] = -vx[i]; vy[i] = -vy[i];} }

var init = function() {
    // create the canvas element
    empty = document.createElement('canvas');
    empty.width = empty.height = 1;
    c = document.getElementById('canvas');
    c.style.cursor = 'url('+empty.toDataURL()+')';
    ctx = c.getContext('2d');

    init_empty();
    init_sidelength(calc_sidelength());
    init_circle(frac);
    update_allcontrols();

    document.body.addEventListener('keyup', function(ev) {
        if (ev.keyCode == 87){ keys[0] = 0; } //up
        if (ev.keyCode == 83){ keys[1] = 0; } //down
        if (ev.keyCode == 65){ keys[2] = 0; } //left
        if (ev.keyCode == 68){ keys[3] = 0; } //right
        if (ev.keyCode == 32){ ev.preventDefault(); update_pause(); } //space is pause
        if (ev.keyCode == 82){ update_restart(); } //r is restart
        if (ev.keyCode == 84){ reverse();  } //t reverses time
    }, false);

    document.body.addEventListener('keydown', function(ev) {
        if (ev.keyCode == 87){ keys[0] = 1; } //up
        if (ev.keyCode == 83){ keys[1] = 1; } //down
        if (ev.keyCode == 65){ keys[2] = 1; } //left
        if (ev.keyCode == 68){ keys[3] = 1; } //right
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

