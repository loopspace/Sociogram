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

var reader = new FileReader();
fileInput.innerHTML = fileInput.innerHTML;
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
	    if (e[1] != '') {
		entry.positives = e[1].split(re);
	    } else {
		entry.positives = [];
	    }
	    if (e[2] != '') {
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
    setTimeout(generateSociogram,100);
    return false;
}

function generateSociogram() {
    
    var positive = document.querySelector('#positive').checked;
    var negative = document.querySelector('#negative').checked;
    var title = document.querySelector('#title').value;
    var cell;
    var i,j;
    var positives;
    var negatives;
    var sociogram;

    var input = document.querySelector('input[name="input"]:checked').value;

    if (input == "form") {
	sociogram = sociogramFromForm();
    } else if (input == "text") {
	sociogram = sociogramFromText();
    } else if (input == "file") {
	sociogram = sociogramFromFile();
    }

    n = sociogram.length;
    j = n;
    
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
    n = j;
    
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

    var dot = 'strict digraph Class { splines=true; overlap=orthoyx; label="' + title + '"; labeloc=b; labeljust=center; fontsize=30; { node [style=filled]; ';

    for (i=0; i<n; i++) {
	dot += 'STUDENT' + i + ' [label="' + sociogram[i].name + '"]; ';
    }

    dot += '} ';

    if (positive) {
	dot += '{ edge [color="blue"]; ';
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
	dot += '{ edge [color="red"]; ';
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
    
    svg = Viz(dot, "svg");
    var out = document.querySelector("#output");
    out.innerHTML = svg;
    return false;
}
