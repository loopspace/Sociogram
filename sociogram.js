function init() {
    var sociogram = new Sociogram();
    sociogram.setInputs('#list','#text');
    var tbdy = document.querySelector('#list');
    var btn = document.querySelector('#add');
    btn.onclick = function(e) {
	e.preventDefault();
	var n,nrow,ncell,nbox;
	n = tbdy.getElementsByTagName('tr').length;
	nrow = tbdy.insertRow(-1);
	var names = ['name','positive','negative'];
	for (var i = 0; i<3; i++) {
	    ncell = nrow.insertCell(-1);
	    nbox = document.createElement('input');
	    nbox.id = names[i] + n;
	    nbox.name = names[i] + n;
	    nbox.type = 'text';
	    ncell.appendChild(nbox);
	}
	return false;
    }


    var colsels = ['p', 'n', 'nd', 'ndbg'];

    var fname = document.querySelector('#filename');
    fname.onchange = function(e) {
	var a = document.querySelector('#tdownload');
	var fname = document.querySelector('#filename');
	var filename;
	if (fname.value == '') {
	    filename = 'sociogram';
	} else {
	    filename = fname.value;
	}
	a.download = filename + ".txt";

	a = document.querySelector('#gdownload');
	var positive = document.querySelector('#positive').checked;
	var negative = document.querySelector('#negative').checked;
	if (positive && negative) {
	    a.download = filename + "All.svg";
	} else if (positive) {
	    a.download = filename + "Positive.svg";
	} else {
	    a.download = filename + "Negative.svg";
	}

    };

    radio = document.getElementsByName('input');

    var formInput = document.querySelector('#formInput');
    var textInput = document.querySelector('#textInput');
    var fileInput = document.querySelector('#fileInput');
    function setInput (e) {
	setInputAux(e.target.value);
    }

    function setInputAux (v) {
	if (v == 'form') {
	    textInput.style.display = 'none';
	    fileInput.style.display = 'none';
	    formInput.style.display = 'block';
	} else if (v == 'text') {
	    textInput.style.display = 'block';
	    fileInput.style.display = 'none';
	    formInput.style.display = 'none';
	} else if (v == 'file') {
	    textInput.style.display = 'none';
	    fileInput.style.display = 'block';
	    formInput.style.display = 'none';
	}
    }

    var chck = true;
    for (var i=0; i<radio.length; i++) {
	radio[i].onchange = setInput;
	if (radio[i].checked) {
	    chck = false;
	    setInputAux(radio[i].value);
	}
    }
    if (chck) {
	radio[1].checked = true;
	setInputAux(radio[1].value);
    }

    fileInput.innerHTML = fileInput.innerHTML;
    var reader = new FileReader();
    var upload = document.querySelector('#fileUpload');

    upload.onchange = function(f) {
	reader.onload = function(e) {
            sociogram.setFileText(e.target.result);
	}
	reader.readAsText(f.target.files[0]);
    }

    btn = document.querySelector('#generate');
    btn.onclick = function(e) {
	e.preventDefault();
	sociogram.display('#output');
	return false;
    }

    btn = document.querySelector('#gchart');
    btn.onclick = function(e) {
	e.preventDefault();
	sociogram.generateChart('#output');
	return false;
    }

    btn = document.querySelector('#groupgen');
    btn.onclick = function(e) {
	e.preventDefault();
	sociogram.generateGroups(btn,'#output');
	return false;
    }
}

window.onload = init;

function Sociogram() {
    var self = this;
    var vertices = [];
    var labels = {};
    var edges = [];
    var specified = [];
    var gedges; // used for making the groups
    var size = 0;
    var dom = {};
    var mgroups;
    var pgroups;
    var form;
    var text;
    var fileText;
    

    this.setInputs = function(fm,tx) {
	form = fm;
	text = tx;
    }

    this.setFileText = function(fl) {
	fileText = fl;
    }
    
    this.hasData = function() {
	return size !== 0;
    }

    this.clear = function() {
	vertices = [];
	labels = {};
	edges = [];
	size = 0;
    }
    
    /*
      Add a vertex with the given label providing it doesn't already exist.
      Also add the corresponding entries to the matrix of edges.
    */
    this.addVertex = function(l,b) {
	if (!labels.hasOwnProperty(l)) {
	    vertices.push(l);
	    labels[l] = size;
	    edges[size] = [];
	    for (var i = 0; i < size; i++) {
		edges[size][i] = 0;
		edges[i][size] = 0;
	    }
	    edges[size][size] = 0;
	    specified[size] = b;
	    size++;
	} else {
	    var i = labels[l];
	    specified[i] ||= b;
	}
    }

    /*
      Add an edge between two labelled vertices, adding the vertices
      if necessary.
    */
    this.addEdge = function(a,b,e) {
	self.addVertex(a,false);
	self.addVertex(b,false);
	var i = labels[a];
	var j = labels[b];
	if (i != j)
	    edges[i][j] = e;
    }
    
    /*
      Get the data from the form
    */
    this.fromForm = function(tbdy) {
	var rows = tbdy.getElementsByTagName('tr');
	var n = rows.length;
	length = n;
	var i,j;
	var re = /\s*,\s*/;
	var names = [];
	var name;
	
	for (i = 0; i<n; i++) {
	    name = rows[i].children[0].children[0].value;
	    self.addVertex(name,true);

	    if (rows[i].children[1].children[0].value != '' ) {
		names = rows[i].children[1].children[0].value.split(re);
		names.forEach(function(v) {self.addEdge(name,v,1)});
	    }
	    if (rows[i].children[2].children[0].value != '' ) {
		names = rows[i].children[1].children[0].value.split(re);
		names.forEach(function(v) {self.addEdge(name,v,-1)});
	    }
	}
    }

    this.fromText = function(id) {
	var tbox = document.querySelector(id);
	this.parseText(tbox.value);
    }

    this.fromFile = function(txt) {
	this.parseText(txt);
    }

    /*
      Get data from a string, either from a file or a text box
    */
    this.parseText = function(txt) {
	if (typeof txt === 'undefined' || txt == '') {
	    alert("No data specified; either upload a file or enter some data");
	    return false;
	};
	var lines = txt.match(/[^\r\n]+/g);
	var name;

	lines.forEach(function(v,i) {
	    var re = /\s*[;\t]\s*/;
	    var e = v.split(re);
	    if (e.length > 1) {
		re = /\s*,\s*/;
		name = e[0];
		self.addVertex(name,true);
		if (typeof e[1] !== 'undefined' && e[1] != '') {
		    e[1].split(re).forEach(function(v) {self.addEdge(name,v,1)});
		}
		if (typeof e[2] !== 'undefined' && e[2] != '') {
		    e[2].split(re).forEach(function(v) {self.addEdge(name,v,-1)});
		}
	    }
	});
    }

    this.toString = function() {
	var ignore = document.querySelector('#dncreate').checked;

	var ss = [];
	var i;
	var pos;
	var neg;
	for (i = 0; i < size; i++) {
	    if (!dncreate || specified[i]) {
		pos = [];
		neg = [];
		edges[i].forEach(function(v,j) {
		    if (v == 1) {
			pos.push(vertices[j]);
		    } else if (v == -1) {
			neg.push(vertices[j]);
		    }
		});
		ss.push([vertices[i],pos.join(','),neg.join(',')]);
	    }
	};
	var sss = [];
	ss.forEach(function(v) {
	    sss.push(v.join(';'));
	});
	return sss.join("\n");
    }


    this.create = function() {
	self.clear();
	var input = document.querySelector('input[name="input"]:checked').value;

	if (input == "form") {
	    self.fromForm(form);
	} else if (input == "text") {
	    self.fromText(text);
	} else if (input == "file") {
	    self.fromFile(fileText);
	}
	if (size === 0) {
	    return;
	}

	var txt = self.toString();
	var tbox = document.querySelector('#text');
	tbox.value = txt;
	var blob = new Blob([txt], {'type':'text/plain'});
	var a = document.querySelector('#tdownload');
	a.href = window.URL.createObjectURL(blob);
	var fname = document.querySelector('#filename');
	var filename;
	if (fname.value == '') {
	    filename = 'sociogram';
	} else {
	    filename = fname.value;
	}
	a.download = filename + ".txt";
	a.style.display = 'inline';
    }
    
    this.toDot = function() {
	var positive = document.querySelector('#positive').checked;
	var negative = document.querySelector('#negative').checked;
	var pcolsel = document.querySelector('#pcolour');
	var ncolsel = document.querySelector('#ncolour');
	var ndcolsel = document.querySelector('#ndcolour');
	var ndbgcolsel = document.querySelector('#ndbgcolour');
	var ndtxtcolsel = document.querySelector('#ndtxtcolour');
	var nodeshsel = document.querySelector('#nodeshape');
	var ndedcolsel = document.querySelector('#nodeedge');
	var anon = document.querySelector('#anonymous').checked;
	var ignore = document.querySelector('#dncreate').checked;
	
	var title = document.querySelector('#title').value;
	var cell;
	var i,j;

	var svg;

	if (size == 0) {
	    return;
	}
	
	var style = 'style="';
	if (document.querySelector('#filled').checked) {
	    style += 'filled,';
	}
	if (document.querySelector('#rounded').checked) {
	    style += 'rounded,';
	}
	style += ndedcolsel.value;
	style += '",';
	var dot = 'strict digraph Class { splines=true; overlap=orthoyx; label="' + title + '"; labeloc=b; labeljust=center; fontsize=30; colorscheme="svg"; { node [' + style + 'shape=' + nodeshsel.value + ',color="' + ndcolsel.value + '",fillcolor="' + ndbgcolsel.value + '",fontcolor="' + ndtxtcolsel.value + '"]; ';

	for (i=0; i<size; i++) {
	    if (!dncreate || specified[i]) { 
		if (anon) {
		    dot += 'STUDENT' + i + ' [label="STUDENT' + pad(i,2) + '"]; ';
		} else {
		    dot += 'STUDENT' + i + ' [label="' + vertices[i] + '"]; ';
		}
	    }
	}

	dot += '} ';

	if (positive) {
	    dot += '{ edge [color="' + pcolsel.value + '"]; ';
	    dot += '{ edge [dir="both"]; ';
	    for (i=0; i<size; i++) {
		for (j=i; j<size; j++) {
		    if (!dncreate || (specified[i] && specified[j])) {
			if (edges[i][j] == 1 && edges[j][i] == 1) {
			    dot += ' STUDENT' + i + ' -> STUDENT' + j + '; ';
			}
		    }
		}
	    }
	    dot += '} ';
	    for (i=0; i<size; i++) {
		for (j=0; j<size; j++) {
		    if (!dncreate || (specified[i] && specified[j])) {
			if (edges[i][j] == 1 && edges[j][i] != 1) {
			    dot += ' STUDENT' + i + ' -> STUDENT' + j + '; ';
			}
		    }
		}
	    }
	    dot += '} ';
	}
	
	if (negative) {
	    dot += '{ edge [color="' + ncolsel.value + '"]; ';
	    dot += '{ edge [dir="both"]; ';
	    for (i=0; i<size; i++) {
		for (j=i; j<size; j++) {
		    if (!dncreate || (specified[i] && specified[j])) {
			if (edges[i][j] == -1 && edges[j][i] == -1) {
			    dot += ' STUDENT' + i + ' -> STUDENT' + j + '; ';
			}
		    }
		}
	    }
	    dot += '} ';
	    for (i=0; i<size; i++) {
		for (j=0; j<size; j++) {
		    if (!dncreate || (specified[i] && specified[j])) {
			if (edges[i][j] == -1 && edges[j][i] != -1) {
			    dot += ' STUDENT' + i + ' -> STUDENT' + j + '; ';
			}
		    }
		}
	    }
	    dot += '} ';
	}

	dot += '} ';
	var esel = document.querySelector('#engine');
	var engine = esel.options[esel.selectedIndex].value;
	svg = Viz(dot, "svg", engine);
	return svg;
    }

    this.display = function(id) {
	self.create();
	var svg = self.toDot();
	if (typeof svg === 'undefined') {
	    return;
	}
	var out = document.querySelector(id);
	out.innerHTML = svg;
	var blob = new Blob([svg], {'type':'text/svg'});
	var a = document.querySelector('#gdownload');
	a.href = window.URL.createObjectURL(blob);
	var fname = document.querySelector('#filename');
	var filename;
	if (fname.value == '') {
	    filename = 'sociogram';
	} else {
	    filename = fname.value;
	}
	var positive = document.querySelector('#positive').checked;
	var negative = document.querySelector('#negative').checked;
	if (positive && negative) {
	    a.download = filename + "All.svg";
	} else if (positive) {
	    a.download = filename + "Positive.svg";
	} else {
	    a.download = filename + "Negative.svg";
	}
	a.style.display = 'inline';
	a.innerHTML = 'Download the Graph';
    }

    this.generateChart = function(id) {
	self.create();
	if (size == 0) {
	    return;
	}
	var anon = document.querySelector('#anonymous').checked;
	var p,n,mp,mn,svg;
	var scale = 50;
	var ptradius = 5;
	var xoffset = 1.25;
	var yoffset = 1.25;
	mp = 0;
	mn = 0;
	var grid = [];
	var ipos = [];
	var ineg = [];
	var i,j;
	for (i = 0; i < size; i++) {
	    ipos[i] = 0;
	    ineg[i] = 0;
	}
	for (i = 0; i< size; i++) {
	    for (j = 0; j<size; j++) {
		ipos[i] += Math.max(0,edges[j][i]);
		ineg[i] -= Math.min(0,edges[j][i]);
	    }
	}
	for (i=0; i < size; i++) {
	    p = ipos[i];
	    n = ineg[i];
	    if (typeof grid[p + ',' + n] === 'undefined') {
		grid[p + ',' + n] = [];
		grid[p + ',' + n].x = p;
		grid[p + ',' + n].y = n;
	    }
	    grid[p + ',' + n].push(pad(i+1,2));
	    mp = Math.max(mp,p);
	    mn = Math.max(mn,n);
	}
	var width = (mp + 3) * scale + 300;
	var height = (Math.max(mn + 2,size/2) + 1) * scale;
	var transformX = function(x) {
	    return (x + xoffset)*scale;
	};
	var transformDX = function(x) {
	    return x*scale;
	};
	var transformY = function (y) {
	    return height - (y + yoffset)*scale;
	};
	var transformDY = function (y) {
	    return - y*scale;
	};
	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute('style', 'border: 1px solid black');
	svg.setAttribute('width', width);
	svg.setAttribute('height', height);
	svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
	svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns", "http://www.w3.org/2000/svg");
	var arrow = document.createElementNS("http://www.w3.org/2000/svg",'marker');
	arrow.setAttribute('id','triangle');
	arrow.setAttribute('viewBox',"0 0 10 10");
	arrow.setAttribute('refX',"0");
	arrow.setAttribute('refY',"5");
	arrow.setAttribute('markerUnits',"strokeWidth");
	arrow.setAttribute('markerWidth',"20");
	arrow.setAttribute('markerHeight',"15");
	arrow.setAttribute('orient',"auto");
	var apath = document.createElementNS("http://www.w3.org/2000/svg",'path');
	apath.setAttribute('d',"M 0 0 L 10 5 L 0 10 z");
	arrow.appendChild(apath);
	svg.appendChild(arrow);
	/*
	  var gs = document.createElementNS("http://www.w3.org/2000/svg",'g');
	  gs.setAttribute('transform','scale(1,-1) translate(0,-' + height + ') scale(' + scale + ') translate(' + xoffset + ',' + yoffset + ')');
	  svg.appendChild(gs);
	*/
	var xaxis = document.createElementNS("http://www.w3.org/2000/svg",'path');
	xaxis.setAttribute('d','M ' + transformX(-1) + ' ' + transformY(0) + ' L ' + transformX(mp +1) + ' ' + transformY(0));
	xaxis.setAttribute('stroke','black');
	xaxis.setAttribute('stroke-width',1);
	xaxis.setAttribute('marker-end','url(#triangle)');
	svg.appendChild(xaxis);
	var yaxis = document.createElementNS("http://www.w3.org/2000/svg",'path');
	yaxis.setAttribute('d','M ' + transformX(0) + ' ' + transformY(-1) + ' L ' + transformX(0) + ' ' + transformY(mn +1));
	yaxis.setAttribute('stroke','black');
	yaxis.setAttribute('stroke-width',1);
	yaxis.setAttribute('marker-end','url(#triangle)');
	svg.appendChild(yaxis);
	var notch,tick,tlbl,i,xlabel,ylabel;
	for ( i=1;i<=mp;i++) {
	    notch = document.createElementNS("http://www.w3.org/2000/svg",'path');
	    notch.setAttribute('d','M ' + transformX(i) + ' ' + transformY(0) + ' l 0 ' +  transformDY(-.3));
	    notch.setAttribute('stroke','black');
	    notch.setAttribute('stroke-width', 1);
	    svg.appendChild(notch);
	    tick = document.createElementNS("http://www.w3.org/2000/svg",'text');
	    tick.setAttribute('x',transformX(i));
	    tick.setAttribute('y',transformY(-.35));
	    tick.setAttribute('text-anchor','middle');
	    tick.setAttribute('style','dominant-baseline: hanging');
	    var tlbl = document.createTextNode(i);
	    tick.appendChild(tlbl);
	    svg.appendChild(tick);
	}
	xlabel = document.createElementNS("http://www.w3.org/2000/svg",'text');
	xlabel.setAttribute('x',transformX(mp+1));
	xlabel.setAttribute('y',transformY(-.35));
	xlabel.setAttribute('text-anchor','middle');
	xlabel.setAttribute('style','dominant-baseline: hanging');
	var xtlbl = document.createTextNode("+ve");
	xlabel.appendChild(xtlbl);
	svg.appendChild(xlabel);
	for ( i=1;i<=mn;i++) {
	    notch = document.createElementNS("http://www.w3.org/2000/svg",'path');
	    notch.setAttribute('d','M ' + transformX(0) + ' ' + transformY(i) + ' l ' +  transformDX(-.3) + ' 0');
	    notch.setAttribute('stroke','black');
	    notch.setAttribute('stroke-width', 1);
	    svg.appendChild(notch);
	    tick = document.createElementNS("http://www.w3.org/2000/svg",'text');
	    tick.setAttribute('x',transformX(-.35));
	    tick.setAttribute('y',transformY(i));
	    tick.setAttribute('text-anchor','end');
	    tick.setAttribute('style','dominant-baseline: middle');
	    var tlbl = document.createTextNode(i);
	    tick.appendChild(tlbl);
	    svg.appendChild(tick);
	}
	ylabel = document.createElementNS("http://www.w3.org/2000/svg",'text');
	ylabel.setAttribute('x',transformX(-.35));
	ylabel.setAttribute('y',transformY(mn+1));
	ylabel.setAttribute('text-anchor','end');
	ylabel.setAttribute('style','dominant-baseline: middle');
	var ytlbl = document.createTextNode("-ve");
	ylabel.appendChild(ytlbl);
	svg.appendChild(ylabel);
	
	Object.keys(grid).forEach(function(v) {
	    var circle = document.createElementNS("http://www.w3.org/2000/svg",'circle');
	    circle.setAttribute('cx',transformX(grid[v].x));
	    circle.setAttribute('cy',transformY(grid[v].y));
	    circle.setAttribute('r',ptradius);
	    circle.setAttribute('fill','black');
	    svg.appendChild(circle);
	    var pin = document.createElementNS("http://www.w3.org/2000/svg",'path');
	    pin.setAttribute('d','M ' + transformX(grid[v].x) + ' ' + transformY(grid[v].y) + ' l ' + transformDX(.3) + ' ' +  transformDY(.2));
	    pin.setAttribute('stroke','black');
	    pin.setAttribute('stroke-width', 1);
	    svg.appendChild(pin);
	    var txt = document.createElementNS("http://www.w3.org/2000/svg",'text');
	    txt.setAttribute('x',transformX(grid[v].x + .3));
	    txt.setAttribute('y',transformY(grid[v].y + .2));
	    //	txt.setAttribute('font-size',10);
	    txt.setAttribute('text-anchor','start');
	    var label = document.createTextNode(grid[v].join(', '));
	    txt.appendChild(label);
	    svg.appendChild(txt);
	});
	if (!anon) {
	    vertices.forEach(function(v,i) {
		var txt = document.createElementNS("http://www.w3.org/2000/svg",'text');
		txt.setAttribute('x',transformX(mp + 3));
		txt.setAttribute('y',transformY((i-1)/2));
		//	txt.setAttribute('font-size',10);
		txt.setAttribute('text-anchor','start');
		label = document.createTextNode(pad(i+1,2) + ' ' + v);
		txt.appendChild(label);
		svg.appendChild(txt);
		
	    });
	}
	var out = document.querySelector(id);
	out.innerHTML = '';
	out.appendChild(svg);
	var svgtxt = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' + "\n" + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' + "\n" + out.innerHTML;

	var blob = new Blob([svgtxt], {'type':'text/svg'});
	var a = document.querySelector('#gdownload');
	a.href = window.URL.createObjectURL(blob);
	var fname = document.querySelector('#filename');
	var filename;
	if (fname.value == '') {
	    filename = 'sociogram';
	} else {
	    filename = fname.value;
	}
	a.download = filename + "Chart.svg";
	a.style.display = 'inline';
	a.innerHTML = 'Download the Chart';
    }

    var queue = [];
    var qTimer;
    var lead = '';
    var progress;
    var ptext;
    var pnum;
    var pTimer;
    var pBar;
    var gbtn;
    var pScores;
    var sOrder;
    var rOrder;
    var startAt;
    var valency;
    var firstGroup;

    this.generateGroups = function(btn,id) {
	gbtn = btn;
	if (queue.length > 0) {
	    self.stopQueue();
	    return;
	}
	self.create();
	var out = document.querySelector(id);
	out.innerHTML = '';
	var list = document.createElement('ol');
	out.appendChild(list);
	list.className += ' groupList';

	var grps = document.querySelector('#groups').value;
	if (grps == '') {
	    alert("No group sizes specified");
	    return;
	}
	gbtn.innerHTML = 'Stop Groups';
	var re = /\s*[,; ]\s*/;
	var groups = [];
	var gsize = 0;
	var last;
	grps.split(re).forEach(function(v) {
	    last = parseInt(v);
	    groups.push(last);
	    gsize += last;
	});
	while (gsize > size) {
	    last = groups.pop();
	    gsize -= last;
	}

	while (gsize < size) {
	    if (gsize + last < size) {
		groups.push(last);
		gsize += last;
	    } else {
		groups.push(size - gsize);
		gsize = size;
	    }
	}

	var partition = [];
	var seeds = [];
	startAt = [];
	var i,j;
	for (i = 0; i < groups.length; i++) {
	    partition.push([]);
	    seeds.push(0);
	    startAt.push([]);
	    for (j = 0; j < groups[i]; j++) {
		partition[i][j] = -1;
		startAt[i][j] = 0;
	    }
	}
	//	startAt = 0;

	var sds = document.querySelector('#seeds').value;
	var re = /[\r\n]+/;
	var e = sds.split(re);

	re = /\s*,\s*/;
	var er,spos;
	for (var i = 0; i < Math.min(e.length,groups.length); i++) {
	    er = e[i].split(re);
	    spos = 0;
	    for (var j = 0; j < er.length; j++) {
		if (labels.hasOwnProperty(er[j])) {
		    partition[i][spos] = labels[er[j]];
		    spos++;
		    seeds[i]++;
		}
	    }
	}

	var cpy = [];
	for (var i = 0; i < partition.length; i++) {
	    cpy.push([]);
	    for (var j = 0; j < partition.length; j++) {
		cpy[i].push(partition[i][j]);
	    }
	}

	// Initialise:
	gedges = [];
	mgroups = {};
	pgroups = {};
	gScores = [];
	// Ignore negatives when forming groups
	var gnegative = document.querySelector('#gnegative').checked;

	for (i = 0; i < size; i++) {
	    gedges[i] = [];
	    for (j = 0; j < size; j++) {
		if ((edges[i][j] == -1) || (edges[j][i] == -1)) {
		    if (gnegative) {
			gedges[i][j] = 0;
		    } else {
			gedges[i][j] = -1;
		    }
		} else {
		    gedges[i][j] = edges[i][j];
		}
	    }
	}
	sOrder = [];
	for (i=0; i < size; i++) {
	    sOrder[i] = [];
	    for (j = 0; j < size; j++) {
		sOrder[i][j] = j;
	    }
	    sOrder[i].sort(function(a,b) {
		if ((gedges[a][i] !== 0) || (gedges[b][i] !==0) ) {
		    return gedges[b][i] - gedges[a][i];
		}
		return gedges[i][b] - gedges[i][a];
	    });
	}
	sOrder.unshift([]);
	for (j = 0; j < size; j++) {
	    sOrder[0][j] = j;
	}
	valency = [];
	for (i = 0; i < size; i++) {
	    valency[i] = 0;
	    for (j = 0; j < size; j++) {
		if ((gedges[i][j] == 1) || (gedges[j][i] == 1))
		    valency[i]++;
	    }
	}
	sOrder[0].sort(function(a,b) { return valency[a] - valency[b] });

	rOrder = [];
	for (i = 0; i <= size; i++) {
	    rOrder[i] = [];
	    for (j = 0; j < size; j++) {
		rOrder[i][sOrder[i][j]] = j;
	    }
	}
	var gstrong = document.querySelector('#gstrong').checked;
	
	firstGroup = -1;
	for (var i = 0; i < partition.length; i++) {
	    if (seeds[i] < partition[i].length) {
		firstGroup = i;
		break;
	    }
	}

	if (firstGroup == -1) {
	    self.displayPartition(partition,list);
	} else {
	    
	    self.startQueue();
	    //	startAt = 0;
	    self.doPartition(partition,seeds,0,firstGroup,seeds[firstGroup],gstrong,list);
	}
    }

    /*
      Try adding vertex r to group s at position t.
      If b is true, we add if there is no negative,
      If b is false, we add only if there is a positive.

      If we can add r, we do so and increment t.
      If t is at the end of a group, we increment s.
      If s is at the end of the partition, we display it, then backtrack.

      If we can't add r, we increment it.
      If we're at the end of the list, we backtrack.

      Backtracking: if we're at the end of a partition, backtracking
      means going back one step and incrementing r.

      If we're at the end of the list of vertices, backtracking means
      going to the previous position in the group, or the previous
      group if we're at the start.
    */
    this.doPartition = function(p,m,r,s,t,b,o) {
	if (r == size) {

	    // Backtrack to previous position
	    if (t == m[s] || s == p.length - 1) {
		// Either we're at the start of a group or we're in the last group so need to backtrack into the previous group
		if (s == firstGroup) {
		    // We've backtracked all the way to the start, so restart with a different starting point.
		    startAt[firstGroup][ m[firstGroup] ]++;
		    
		    // clear our save stack
		    /*			mgroups = {};
					for (var grp in pgroups) {
					mgroups[grp] = true;
					}
		    */
		    var stop = false;
		    for (var i = firstGroup; i < startAt.length; i++) {
			for (var j = m[i]; j < startAt[i].length; j++) {
			    if (startAt[i][j] == size) {
				startAt[i][j] = 0;
				if (i < startAt.length - 1 && j == startAt[i].length - 1) {
				    startAt[i+1][0]++;
				} else if (j < startAt[i].length - 1) {
				    startAt[i][j+1]++;
				}
			    } else {
				stop = true;
				break;
			    }
			}
			if (stop) {break};
		    }
		    self.addToQueue([p,m,0, firstGroup, m[firstGroup],b,o]);
		    return;
		} else {
		    // Previous group
		    s = s - 1;
		    // Last position thereof
		    t = p[s].length - 1;
		    // To find the next item, look at the place of the
		    // last item in the order given by the penultimate
		    // item and step further one place
		    r = rOrder[ p[s][t-1] + 1 ][ p[s][t] ] + 1;
		    self.addToQueue([p,m,r,s,t,b,o]);
		}
	    } else {
		t = t - 1;
		if (t == 0) {
		    r = p[s][t] + 1;
		} else {
		    r = rOrder[ p[s][t-1] + 1 ][ p[s][t] ] + 1;
		}
		self.addToQueue([p,m,r,s,t,b,o]);
	    }
	    return;
	}
	// get the actual element referred to by position r
	r += startAt[s][t];
	r %= size;
	var e;
	if (t == 0) {
	    e = r;
	} else {
	    e = sOrder[ p[s][t-1] + 1 ][r];
	}
	// Because of how it works, we can add the item and then check whether it works
	p[s][t] = e;

	// First step should be to see if adding this element would
	// produce a pattern that we've already seen.
	
	if (mgroups[self.namePartition(p,s,t,m,startAt)]) {
	    // Yes, we have so skip
	    self.addToQueue([p,m,r+1,s,t,b,o]);
	    return;
	}
	
	var j,k,add;
	// Assume we'll be adding it
	add = true;
	stop = false;
	// Is it a preset element?
	for (var j = 0; j < p.length; j++) {
	    for (var k = 0; k < m[j]; k++) {
		if (p[j][k] == e) {
		    add = false;
		    stop = true;
		    break;
		}
	    }
	    if (stop) {break};
	}
	stop = false;
	// Is it already in one of our full groups?
	for (var j = 0; j < s; j++) {
	    for (k = 0; k < p[j].length; k++) {
		if (p[j][k] == e) {
		    add = false;
		    stop = true;
		    break;
		}
	    }
	    if (stop) {break};
	}
	// If not, try our current group.
	if (add) {
	    for (j = 0; j < t; j++) {
		if (p[s][j] == e) {
		    add = false;
		    break;
		}
	    }
	}

	if (add && (t > 0)) {
	    // Not yet in a group, so look for arrows to existing elements.
	    
	    // If there's no negatives, do we add or not?
	    add = b;
	    
	    // Test against the existing elements
	    for (k = 0; k < t; k++) {
		// Is there an edge from r to p[s][k]?
		if (gedges[e][p[s][k]] == 1) {
		    // There's a positive one, so we'll mark it for adding
		    add = true;
		} else if (gedges[e][p[s][k]] == -1) {
		    // There's a negative one either to or from, so we'll not add it
		    add = false;
		    break;
		}
	    }
	}
	if (add) {
	    // Okay, so we're adding.
	    // First, save this partition so we don't repeat ourselves
	    mgroups[self.namePartition(p,s,t,m,startAt)] = true;
	    // Now step onwards
	    if (t == p[s].length - 1) {
		// End of group,
		if (s == p.length - 1) {
		    // Full partition, so display
		    self.displayPartition(p,o);
		    // Restart from a completely fresh position
		    pgroups[self.namePartition(p,s,t,m,startAt)] = true;

		    startAt[0][ m[0] ]++;

		    var stop = false;
		    for (var i = 0; i < startAt.length; i++) {
			for (var j = m[i]; j < startAt[i].length; j++) {
			    if (startAt[i][j] == size) {
				startAt[i][j] = 0;
				if (i < startAt.length - 1 && j == startAt[i].length - 1) {
				    startAt[i+1][0]++;
				} else if (j < startAt[i].length - 1) {
				    startAt[i][j+1]++;
				}
			    } else {
				stop = true;
				break;
			    }
			}
			if (stop) {break};
		    }
		    self.addToQueue([p,m,0, firstGroup, m[firstGroup],b,o]);
		} else {
		    // Start again with the next group
		    self.addToQueue([p,m,0,s+1,m[s+1],b,o]);
		}
	    } else {
		// Not end of group yet
		self.addToQueue([p,m,0,s,t+1,b,o]);
	    }
	} else {
	    // Not adding, so try the next one
	    self.addToQueue([p,m,r+1,s,t,b,o]);
	}
    }
    
    this.namePartition = function(p,s,t,m,st) {
	var pp = [];
	var i,j,ss;
	// Full groups
	for (i = 0; i< s; i++) {
	    pp[i] = [];
	    for (j= 0; j < p[i].length; j++) {
		pp[i][j] = p[i][j];
	    }
	    pp[i].sort();
	}
	pp.sort(function(a,b) {return a[0] - b[0]});

	// Current group
	pp[s] = [];
	for (i = 0; i <= t; i++) {
	    pp[s][i] = p[s][i];
	}
	pp[s].sort();
	
	ss = [];
	for (i = 0; i <= s; i++) {
	    ss.push(pp[i].join(','));
	}
	
	ss.push("--");
	pp[s] = [];

	for (i = t+1; i < p[s].length; i++) {
	    pp[s][i] = st[s][i];
	}
	
	for (i = s+1; i < p.length; i++) {
	    pp[i] = [];
	    for (j = 0; j < m[i]; j++) {
		pp[i][j] = p[i][j];
	    }
	    for (j = m[i]; j < p[i].length; j++) {
		pp[i][j] = st[i][j];
	    }
	}

	for (i = s; i < p.length; i++) {
	    ss.push(pp[i].join(','));
	}
	return ss.join(';');
    }
    
    this.displayPartition = function(p,o) {
	var oli = document.createElement('li');
	var btn = document.createElement('button');
	btn.appendChild(document.createTextNode('edit'));
	var pcpy = [];
	for (var i = 0; i < p.length; i++) {
	    pcpy.push([]);
	    for (var j = 0; j < p[i].length; j++) {
		pcpy[i].push(p[i][j]);
	    }
	}
	btn.onclick = function(e) {
	    e.preventDefault();
	    self.setEditableGroups(pcpy);
	    return false;
	};
	oli.appendChild(btn);
	var scspn = document.createElement('span');
	oli.appendChild(scspn);
	
	var s = document.createElement('ul');
	var a,i,j,li,txt,spn,score;
	var sc = [0,0,0,0];
	for (i = 0; i < p.length; i++) {
	    li = document.createElement('li');

	    txt = document.createTextNode('(' + self.scoreGroup(p[i],'') + ') ');
	    spn = document.createElement('span');
	    spn.classList.add('score');
	    spn.appendChild(txt);
	    li.appendChild(spn);

	    txt = document.createTextNode(vertices[p[i][0]]);
	    spn = document.createElement('span');
	    spn.classList.add('groupElement');
	    score = self.checkElementInGroup(p[i],0);
	    if (score[0] > 0 && score[1] > 0) {
		spn.classList.add('inoutPositive');
	    } else if (score[0] > 0) {
		spn.classList.add('outgoingPositive');
	    } else if (score[1] > 0) {
		spn.classList.add('incomingPositive');
	    }
	    if (score[2] > 0 || score [3] > 0) {
		spn.classList.add('negative');
	    }
	    spn.appendChild(txt);
	    li.appendChild(spn);
	    
	    for (j = 1; j < p[i].length; j++) {
		txt = document.createTextNode(', ');
		li.appendChild(txt);

		txt = document.createTextNode(vertices[p[i][j]]);
		spn = document.createElement('span');
		spn.classList.add('groupElement');
		score = self.checkElementInGroup(p[i],j);
		if (score[0] > 0 && score[1] > 0) {
		    spn.classList.add('inoutPositive');
		} else if (score[0] > 0) {
		    spn.classList.add('outgoingPositive');
		} else if (score[1] > 0) {
		    spn.classList.add('incomingPositive');
		}
		if (score[2] > 0 || score [3] > 0) {
		    spn.classList.add('negative');
		}
		spn.appendChild(txt);
		li.appendChild(spn);
	    }

	    score = self.scoreGroupElements(p[i]);

	    for (var j = 0; j < score.length; j++) {
		sc[j] += score[j];
	    }

	    s.appendChild(li);
	}
	scspn.appendChild(document.createTextNode("(" + sc.join(",") + ")"));
	var pos = 0;
	for (var i = 0; i < gScores.length; i++) {
	    if (sc[0] < gScores[i][0]) {
		pos++;
	    } else if (sc[0] > gScores[i][0]) {
		break;
	    } else if (sc[1] < gScores[i][1]) {
		pos++;
	    } else if (sc[1] > gScores[i][1]) {
		break;
	    } else if (sc[2] < gScores[i][2]) {
		pos++;
	    } else if (sc[2] < gScores[i][2]) {
		break;
	    } else if (sc[3] < gScores[i][3]) {
		pos++;
	    } else if (sc[3] > gScores[i][3]) {
		break;
	    }
	}
	gScores.splice(pos,0,sc);
	oli.appendChild(s);
	pos++;
	var prev = document.querySelectorAll('.groupList > li:nth-child('+pos+')');
	if (prev.length > 0) {
	    o.insertBefore(oli,prev[0]);
	} else {
	    o.appendChild(oli);
	}
    }

    this.checkElementInGroup = function (g,j) {
	var pout = 0;
	var pinc = 0;
	var nout = 0;
	var ninc = 0;
	for (var k = 0; k < g.length; k++) {
	    if (edges[g[j]][g[k]] == 1) {
		pout += 1;
	    }
	    if (edges[g[j]][g[k]] == -1) {
		nout += 1;
	    }
	    if (edges[g[k]][g[j]] == 1) {
		pinc += 1;
	    }
	    if (edges[g[k]][g[j]] == -1) {
		ninc += 1;
	    }
	}
	return [pout,pinc,nout,ninc];
    }
    
    this.scoreGroup = function(g,s) {
	var j,k,l;
	var inc;
	var out;
	var con;
	var arr;
	inc = [];
	out = [];
	con = [];
	arr = [];
	for (j = 0; j < g.length; j++) {
	    con[j] = 0;
	}
	con[0] = 1;
	for (j = 0; j < g.length; j++) {
	    inc[j] = 0;
	    out[j] = 0;
	    arr[j] = 0;
	    for (k = 0; k < g.length; k++) {
		if (con[j] == 1) {
		    con[k] = Math.max(con[k],edges[g[j]][g[k]],edges[g[k]][g[j]]);
		}
		if (edges[g[j]][g[k]] == 1) {
		    out[j] = 1;
		    arr[j] = 1;
		}
		if (edges[g[k]][g[j]] == 1) {
		    inc[j] = 1;
		    arr[j] = 1;
		}
	    }
	}
	
	// Does every node have an incoming arrow?
	if (minArray(inc) == 1) {
	    s += 1;
	} else {
	    s += 0;
	}
	// Does every node have an outgoing arrow?
	if (minArray(out) == 1) {
	    s += 1;
	} else {
	    s += 0;
	}
	// Does every node have an arrow of some discription?
	if (minArray(arr) == 1) {
	    s += 1;
	} else {
	    s += 0;
	}
	/*
	// Is it weakly connected?
	if (minArray(con) == 1) {
	s += 1;
	} else {
	s += 0;
	}
	*/
	/*
	// Does every node have an incoming arrow?
	if (minArray(inc) == 1)
	s += 1;
	// Does every node have an outgoing arrow?
	if (minArray(out) == 1)
	s += 2;
	if (minArray(con) == 1)
	s += 4;
	*/
	return s;

    }

    this.scoreGroupElements = function(g) {
	var pout = 0;
	var pinc = 0;
	var nout = 0;
	var ninc = 0;
	var tpout, tpinc, tnout, tninc;
	for (var j = 0; j < g.length; j++) {
	    tpout = 0;
	    tpinc = 0;
	    tnout = 0;
	    tninc = 0;
	    for (var k = 0; k < g.length; k++) {
		if (j != k) {
		    if (edges[g[j]][g[k]] == 1) {
			tpout = 1;
		    }
		    if (edges[g[j]][g[k]] == -1) {
			tnout = 1;
		    }
		    if (edges[g[k]][g[j]] == 1) {
			tpinc = 1;
		    }
		    if (edges[g[k]][g[j]] == -1) {
			tninc = 1;
		    }
		}
	    }
	    pout += tpout;
	    pinc += tpinc;
	    nout += tnout;
	    ninc += tninc;
	}
	return [pout,-nout,pinc,-ninc];
    }
    
    this.scorePartition = function(p) {
	// Score a partition by scoring its groups
	// An ideal group is:
	//  Weakly connected,
	//  Every node has at least one incoming and one outgoing edge
	var i,j,k,l;
	var inc;
	var out;
	var s = [];
	for (i = 0; i < p.length; i++) {
	    s[i] = '';
	    inc = [];
	    out = [];
	    con = [];
	    for (j = 0; j < p[i].length; j++) {
		con[j] = 0;
	    }
	    con[1] = 1;
	    
	    for (j = 0; j < p[i].length; j++) {
		inc[j] = 0;
		out[j] = 0;
		for (k = 0; k < p[i].length; k++) {
		    if (con[j] == 1) {
			con[k] = Math.max(con[k],edges[j][k],edges[k][j]);
		    }
		    if (edges[j][k] == 1)
			out[j] = 1;
		    if (edges[k][j] == 1)
			inc[j] = 1;
		    if ((out[j] == 1) && (inc[j] == 1))
			break;
		}
	    }
	    // Does every node have an incoming arrow?
	    if (minArray(inc) == 1) {
		s[i] += '1';
	    } else {
		s[i] += '0';
	    }
	    // Does every node have an outgoing arrow?
	    if (minArray(out) == 1) {
		s[i] += '1';
	    } else {
		s[i] += '0';
	    }
	    // Is it weakly connected?
	    if (minArray(con) == 1) {
		s[i] += '1';
	    } else {
		s[i] += '0';
	    }
	}
	return s.join(', ');
    }

    this.addToQueue = function(f) {
	queue.push(f);
    }

    this.startQueue = function() {
	queue = [];
	progress = document.querySelector('#progress');
	pBar = document.createElement('progress');
	progress.parentNode.insertBefore(pBar, progress.nextSibling);
	pBar.max=size;
	pBar.value=0;
	ptext = stringFill3('.&nbsp;&nbsp;',100);
	pnum = 0;
	pTimer = window.setInterval(function() {
	    pnum = (pnum + 1)%3;
	    progress.innerHTML = stringFill3('&nbsp;',pnum) + ptext;
	},10);
	self.doQueue();
    }

    this.stopQueue = function() {
	if (queue.length > 0 )
	    alert('Ooops!  Queue stopped early.');
	queue = [];
	gbtn.innerHTML = 'Generate the Groups';
	progress.innerHTML = '';
	pBar.parentElement.removeChild(pBar);
	clearTimeout(qTimer);
	clearInterval(pTimer);
    }
    
    this.doQueue = function() {
	qTimer = window.setTimeout(function() {
	    var f,i,l;
	    if (queue.length > 0) {
		f = queue.shift();
		l = f[4];
		self.doPartition(f[0],f[1],f[2],f[3],f[4],f[5],f[6]);
		for (i = 0; i<f[3]; i++) {
		    l += f[0][i].length;
		}
		pBar.value = l;
	    }
	    self.doQueue();
	} );
    }

    this.setEditableGroups = function(p) {
	var grptbl = document.querySelector('#editableGroup');
	if (grptbl === null) {
	    grptbl = document.createElement('div');
	    grptbl.setAttribute('id', 'editableGroup');
	    var pnt = document.querySelector('#output');
	    pnt.insertBefore(grptbl,pnt.firstChild);
	}
	grptbl.innerHTML = '';
	var a,i,j,li,txt,spn,score,hlst,hlstelt;
	var scelt = document.createElement('span');
	grptbl.appendChild(scelt);
	var s = document.createElement('ul');
	var btn = document.createElement('button');
	btn.appendChild(document.createTextNode('copy to clipboard'));
	btn.onclick = function(e) {
	    e.preventDefault();
	    self.copyPartitionToClipboard();
	    return false;
	};
	var sc = [0,0,0,0];
	for (i = 0; i < p.length; i++) {
	    li = document.createElement('li');
	    li.classList.add('editableSingleGroup');

	    txt = document.createTextNode('(' + self.scoreGroup(p[i],'') + ') ');
	    spn = document.createElement('span');
	    spn.classList.add('score');
	    spn.setAttribute('id', 'Score' + i);
	    spn.appendChild(txt);
	    
	    li.appendChild(spn);
	    hlst = document.createElement('ul');
	    hlst.classList.add('horizontalList');
	    hlst.setAttribute('id', 'Group' + i);
	    
	    for (j = 0; j < p[i].length; j++) {

		txt = document.createTextNode(vertices[p[i][j]]);

		hlstelt = document.createElement('li');
		hlstelt.classList.add('editableGroupElement');
		hlstelt.setAttribute('id', 'Element' + p[i][j]);

		spn = document.createElement('span');
		spn.classList.add('groupElement');
		spn.dataset.elt = p[i][j];

		score = self.checkElementInGroup(p[i],j);
		if (score[0] > 0 && score[1] > 0) {
		    spn.classList.add('inoutPositive');
		} else if (score[0] > 0) {
		    spn.classList.add('outgoingPositive');
		} else if (score[1] > 0) {
		    spn.classList.add('incomingPositive');
		}
		if (score[2] > 0 || score [3] > 0) {
		    spn.classList.add('negative');
		}
		spn.appendChild(txt);
		hlstelt.appendChild(spn);
		hlst.appendChild(hlstelt);
	    }
	    li.appendChild(hlst);
	    new Sortable(hlst, {
		group: 'editableGroup',
		animation: 150,
		fallbackOnBody: true,
		swapThreshold: 0.65,
		onEnd: function (evt) {
		    self.resetRelationships();
		    self.resetScores(evt.to);
		    self.resetScores(evt.from);
		    self.resetPartitionScore(scelt);
		},
		onStart: function (evt) {
		    var id = parseInt(evt.item.getAttribute('id').substring(7));
		    self.showRelationships(id);
		}
	    });
	    
	    score = self.scoreGroupElements(p[i]);

	    for (var j = 0; j < score.length; j++) {
		sc[j] += score[j];
	    }
	    s.appendChild(li);
	}
	grptbl.appendChild(s);
	grptbl.appendChild(btn);
	
	scelt.appendChild(document.createTextNode("(" + sc.join(",") + ")"));
    }

    this.copyPartitionToClipboard = function() {
	var p = [];
	Array.from(document.querySelectorAll('.editableSingleGroup > ul')).forEach(
	    function(el) {
		var elts = el.children;
		var grp = [];
		for (e of elts) {
		    grp.push(e.getElementsByTagName('span')[0].innerHTML);
		}
		p.push(grp.join(", "));
	    }
	)
	copyToClipboard(p.join("\n"));
    }

    this.resetPartitionScore = function(scelt) {
	scelt.innerHTML = '';
	var sc = [0,0,0,0];
	Array.from(document.querySelectorAll('.editableSingleGroup > ul')).forEach(
	    function(el) {
		var elts = el.children;
		var grp = [];
		var id;
		for (e of elts) {
		    id = e.getAttribute('id');
		    grp.push(parseInt(id.substring(7)));
		}
		var score = self.scoreGroupElements(grp);
		for (var j = 0; j < score.length; j++) {
		    sc[j] += score[j];
		}
	    }
	);
	
	scelt.appendChild(document.createTextNode("(" + sc.join(",") + ")"));

    }
    
    this.showRelationships = function(i) {
	var spn;
	for (var j = 0; j < size; j++) {
	    spn = document.getElementById('Element' + j).getElementsByTagName('span')[0];
	    if (gedges[i][j] == -1) {
		spn.classList.add('negativeTemp');
	    } else if (gedges[i][j] == 1 && gedges[j][i] == 1) {
		spn.classList.add('inoutPositiveTemp');
	    } else if (gedges[i][j] == 1) {
		spn.classList.add('incomingPositiveTemp');
	    } else if (gedges[j][i] == 1) {
		spn.classList.add('outgoingPositiveTemp');
	    }
	}
    }
    
    this.resetRelationships = function() {
	var classes = ['negativeTemp', 'incomingPositiveTemp', 'outgoingPositiveTemp', 'inoutPositiveTemp'];
	for (var c of classes) {
	    Array.from(document.querySelectorAll("." + c)).forEach(
		(el) => el.classList.remove(c)
	    );
	}
    }
    
    this.resetScores = function(lst) {
	var elts = lst.children;
	var grp = [];
	var spans = [];
	var id;
	for (e of elts) {
	    id = e.getAttribute('id');
	    grp.push(parseInt(id.substring(7)));
	    spans.push(e.getElementsByTagName('span')[0]);
	}
	var score;
	for (var i = 0; i < grp.length; i++) {
	    score = self.checkElementInGroup(grp,i);
	    spans[i].classList.remove(...spans[i].classList);
	    spans[i].classList.add('groupElement');
	    if (score[0] > 0 && score[1] > 0) {
		spans[i].classList.add('inoutPositive');
	    } else if (score[0] > 0) {
		spans[i].classList.add('outgoingPositive');
	    } else if (score[1] > 0) {
		spans[i].classList.add('incomingPositive');
	    }
	    if (score[2] > 0 || score [3] > 0) {
		spans[i].classList.add('negative');
	    }

	}
	var id = lst.getAttribute('id');
	var txt = document.createTextNode('(' + self.scoreGroup(grp,'') + ') ');
	var spn = document.getElementById('Score' + id.substring(5) );
	spn.innerHTML = '';
	spn.appendChild(txt);
	
    }
    
}


function pad(n,l) {
    var ln = Math.max(1,Math.floor(Math.log10(Math.abs(n)))+1); // length of n
    var z;
    if (ln < l) {
	z = new Array(l - ln + 1).join('0');
    } else {
	z = '';
    }
    z += n.toString();
    return z;
}

function arrayClone( arr ) {

    var i, copy;

    if( Array.isArray( arr ) ) {
        copy = arr.slice( 0 );
        for( i = 0; i < copy.length; i++ ) {
            copy[ i ] = arrayClone( copy[ i ] );
        }
        return copy;
    } else if( typeof arr === 'object' ) {
        throw 'Cannot clone array containing an object!';
    } else {
        return arr;
    }

}

function stringFill3(x, n) {
    var s = '';
    for (;;) {
        if (n & 1) s += x;
        n >>= 1;
        if (n) x += x;
        else break;
    }
    return s;
}

function maxArray(a) {
    var m = a[0];
    var i;
    for (i = 1; i < a.length; i++) {
	if (m < a[i])
	    m = a[i];
    }
    return m;
}

function minArray(a) {
    var m = a[0];
    var i;
    for (i = 1; i < a.length; i++) {
	if (m > a[i])
	    m = a[i];
    }
    return m;
}

function copyToClipboard(text) {
    // create hidden text element, if it doesn't already exist
    var targetId = "_hiddenCopyText_";
    var origSelectionStart, origSelectionEnd;
    // must use a temporary form element for the selection and copy
    var target = document.getElementById(targetId);
    if (!target) {
        var target = document.createElement("textarea");
        target.style.position = "absolute";
        target.style.left = "-9999px";
        target.style.top = "0";
        target.id = targetId;
        document.body.appendChild(target);
    }
    target.textContent = text;

    // select the content
    var currentFocus = document.activeElement;
    target.focus();
    target.setSelectionRange(0, target.value.length);
    
    // copy the selection
    var succeed;
    try {
    	succeed = document.execCommand("copy");
    } catch(e) {
        succeed = false;
    }
    // restore original focus
    if (currentFocus && typeof currentFocus.focus === "function") {
        currentFocus.focus();
    }
    
    // clear temporary content
    target.textContent = "";

    return succeed;
}
