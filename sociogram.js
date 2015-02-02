var tbdy = document.querySelector('#list');
var btn = document.querySelector('#add');
btn.onclick = function(e) {
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
colsels.forEach(function(v) {
    var cs = document.querySelector('#' + v + 'colour');
    var csd = document.querySelector('#' + v + 'colourdemo');
    csd.style.backgroundColor = cs.options[cs.selectedIndex].value;
    cs.onchange = function (e) {
	csd.style.backgroundColor = e.target.options[e.target.selectedIndex].value;
    };
});

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

function sociogramFromForm() {
    var rows = tbdy.getElementsByTagName('tr');
    var n = rows.length;
    var sociogram = [];
    var i;
    var re = /\s*,\s*/;
    
    for (i = 0; i<n; i++) {
	sociogram[i] = [];
	sociogram[i].name = rows[i].children[0].children[0].value;
	sociogram[sociogram[i].name] = i;
	if (rows[i].children[1].children[0].value != '' ) {
	    sociogram[i].positives = rows[i].children[1].children[0].value.split(re);
	} else {
	    sociogram[i].positives = [];
	}
	if (rows[i].children[2].children[0].value != '' ) {
	    sociogram[i].negatives = rows[i].children[2].children[0].value.split(re);
	} else {
	    sociogram[i].negatives = [];
	}
    }
    return sociogram;
}

function sociogramFromText() {
    var tbox = document.querySelector('#text');
    return parseSociogram(tbox.value);
}

fileInput.innerHTML = fileInput.innerHTML;
var reader = new FileReader();
var upload = document.querySelector('#fileUpload');

var fileText;
upload.onchange = function(f) {
    reader.onload = function(e) {
        fileText = e.target.result;
    }
    reader.readAsText(f.target.files[0]);
}

function sociogramFromFile() {
    return parseSociogram(fileText);
}

function parseSociogram(txt) {
    if (typeof txt === 'undefined' || txt == '') {
	alert("No data specified; either upload a file or enter some data");
	return [];
    };
    var lines = txt.split("\n");
    var sociogram = [];

    lines.forEach(function(v,i) {
	var re = /\s*;\s*/;
	var e = v.split(re);
	if (e.length > 1) {
	    re = /\s*,\s*/;
	    var entry = [];
	    entry.name = e[0];
	    sociogram[e[0]] = i;
	    if (typeof e[1] !== 'undefined' && e[1] != '') {
		entry.positives = e[1].split(re);
	    } else {
		entry.positives = [];
	    }
	    if (typeof e[2] !== 'undefined' && e[2] != '') {
		entry.negatives = e[2].split(re);
	    } else {
		entry.negatives = [];
	    }
	    sociogram.push(entry);
	}
    });

    return sociogram;
}

btn = document.querySelector('#generate');
btn.onclick = function(e) {
    setTimeout(displaySociogram,100);
    return false;
}

btn = document.querySelector('#gchart');
btn.onclick = function(e) {
    setTimeout(generateChart,100);
    return false;
}

function sociogramToString(s) {
    var ss = [];
    s.forEach(function(v) {
	ss.push([v.name,v.positives.join(','),v.negatives.join(',')]);
    });
    var sss = [];
    ss.forEach(function(v) {
	sss.push(v.join(';'));
    });
    return sss.join("\n");
}

function fetchSociogramData() {
    var sociogram;

    var input = document.querySelector('input[name="input"]:checked').value;

    if (input == "form") {
	sociogram = sociogramFromForm();
    } else if (input == "text") {
	sociogram = sociogramFromText();
    } else if (input == "file") {
	sociogram = sociogramFromFile();
    }
    var n = sociogram.length;
    if (n == 0) {
	return;
    }
    var j = n;
    
    for (i = 0; i<n; i++) {
	sociogram[i].positives.forEach(function(v) {
	    if (typeof sociogram[v] === "undefined") {
		sociogram[j] = [];
		sociogram[j].name = v;
		sociogram[v] = j;
		sociogram[j].positives = [];
		sociogram[j].negatives = [];
		j++;
	    }
	});
	sociogram[i].negatives.forEach(function(v) {
	    if (typeof sociogram[v] === "undefined") {
		sociogram[j] = [];
		sociogram[j].name = v;
		sociogram[v] = j;
		sociogram[j].positives = [];
		sociogram[j].negatives = [];
		j++;
	    }
	});
    }

    var txt = sociogramToString(sociogram);
    var tbox = document.querySelector('#text');
    tbox.value = txt;
    var blob = new Blob([txt], {'type':'text/plain'});
    var a = document.querySelector('#tdownload');
    a.href = window.URL.createObjectURL(blob);
    a.download = "sociogram.txt";
    a.style.display = 'inline';

    return sociogram;
}

function generateSociogram () {
    var positive = document.querySelector('#positive').checked;
    var negative = document.querySelector('#negative').checked;
    var pcolsel = document.querySelector('#pcolour');
    var ncolsel = document.querySelector('#ncolour');
    var ndcolsel = document.querySelector('#ndcolour');
    var ndbgcolsel = document.querySelector('#ndbgcolour');
    var nodeshsel = document.querySelector('#nodeshape');
    var ndedcolsel = document.querySelector('#nodeedge');
    
    var title = document.querySelector('#title').value;
    var cell;
    var i,j;
    var positives;
    var negatives;
    var sociogram = fetchSociogramData();
    n = sociogram.length;
    if (n == 0) {
	return;
    }
    
    positives = [];
    negatives = [];
    for (i = 0; i < n; i++) {
	positives[i] = [];
	negatives[i] = [];
    }

    sociogram.forEach(function(v,i) {
	v.positives.forEach(function(u) {
	    positives[i][sociogram[u]] = true;
	});
	v.negatives.forEach(function(u) {
	    negatives[i][sociogram[u]] = true;
	});
    });
    var style = 'style="';
    if (document.querySelector('#filled').checked) {
	style += 'filled,';
    }
    if (document.querySelector('#rounded').checked) {
	style += 'rounded,';
    }
    style += ndedcolsel.options[ndedcolsel.selectedIndex].value;
    style += '",';
    var dot = 'strict digraph Class { splines=true; overlap=orthoyx; label="' + title + '"; labeloc=b; labeljust=center; fontsize=30; colorscheme="svg"; { node [' + style + 'shape=' + nodeshsel.options[nodeshsel.selectedIndex].value + ',color=' + ndcolsel.options[ndcolsel.selectedIndex].value + ',fillcolor=' + ndbgcolsel.options[ndbgcolsel.selectedIndex].value + ']; ';

    for (i=0; i<n; i++) {
	dot += 'STUDENT' + i + ' [label="' + sociogram[i].name + '"]; ';
    }

    dot += '} ';

    if (positive) {
	dot += '{ edge [color="' + pcolsel.options[pcolsel.selectedIndex].value + '"]; ';
	dot += '{ edge [dir="both"]; ';
	for (i=0; i<n; i++) {
	    for (j=i; j<n; j++) {
		if (positives[i][j] && positives[j][i]) {
		    dot += ' STUDENT' + i + ' -> STUDENT' + j + '; ';
		}
	    }
	}
	dot += '} ';
	for (i=0; i<n; i++) {
	    for (j=0; j<n; j++) {
		if (positives[i][j] && !positives[j][i]) {
		    dot += ' STUDENT' + i + ' -> STUDENT' + j + '; ';
		}
	    }
	}
	dot += '} ';
    }
    
    if (negative) {
	dot += '{ edge [color="' + ncolsel.options[ncolsel.selectedIndex].value + '"]; ';
	dot += '{ edge [dir="both"]; ';
	for (i=0; i<n; i++) {
	    for (j=i; j<n; j++) {
		if (negatives[i][j] && negatives[j][i]) {
		    dot += ' STUDENT' + i + ' -> STUDENT' + j + '; ';
		}
	    }
	}
	dot += '} ';
	for (i=0; i<n; i++) {
	    for (j=0; j<n; j++) {
		if (negatives[i][j] && !negatives[j][i]) {
		    dot += ' STUDENT' + i + ' -> STUDENT' + j + '; ';
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

function displaySociogram() {
    var svg = generateSociogram();
    if (typeof svg === 'undefined') {
	return;
    }
    var out = document.querySelector("#output");
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


function generateChart() {
    var sociogram = fetchSociogramData();
    if (sociogram.length == 0) {
	return;
    }
    var p,n,mp,mn,svg;
    var scale = 50;
    var ptradius = 5;
    var xoffset = 1.25;
    var yoffset = 1.25;
    mp = 0;
    mn = 0;
    var grid = [];
    sociogram.forEach(function(v) {
	v.ipositives = 0;
	v.inegatives = 0;
    });
    sociogram.forEach(function(v,i) {
	v.positives.forEach(function(u) {
	    sociogram[sociogram[u]].ipositives++;
	});
	v.negatives.forEach(function(u) {
	    sociogram[sociogram[u]].inegatives++;
	});
    });
    sociogram.forEach(function(v,i) {
	p = v.ipositives;
	n = v.inegatives;
	if (typeof grid[p + ',' + n] === 'undefined') {
	    grid[p + ',' + n] = [];
	    grid[p + ',' + n].x = p;
	    grid[p + ',' + n].y = n;
	}
	grid[p + ',' + n].push(pad(i+1,2));
	mp = Math.max(mp,p);
	mn = Math.max(mn,n);
    });
    var width = (mp + 3) * scale + 300;
    var height = (Math.max(mn + 2,sociogram.length/2) + 1) * scale;
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
    var notch,tick,tlbl,i;
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
    sociogram.forEach(function(v,i) {
	var txt = document.createElementNS("http://www.w3.org/2000/svg",'text');
	txt.setAttribute('x',transformX(mp + 3));
	txt.setAttribute('y',transformY((i-1)/2));
//	txt.setAttribute('font-size',10);
	txt.setAttribute('text-anchor','start');
	var label = document.createTextNode(pad(i+1,2) + ' ' + v.name);
	txt.appendChild(label);
	svg.appendChild(txt);
	
    });
    var out = document.querySelector("#output");
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

function pad(n,l) {
    var ln = Math.floor(Math.log10(Math.abs(n)))+1; // length of n
    var z;
    if (ln < l) {
	z = new Array(l - ln + 1).join('0');
    } else {
	z = '';
    }
    z += n.toString();
    return z;
}

