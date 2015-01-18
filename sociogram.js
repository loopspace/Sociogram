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

btn = document.querySelector('#generate');
btn.onclick = function(e) {
    var positive = document.querySelector('#positive').checked;
    var negative = document.querySelector('#negative').checked;
    console.log(positive,negative);
    var title = document.querySelector('#title').value;
    var rows = tbdy.getElementsByTagName('tr');
    var n = rows.length;
    var sociogram = [];
    var cell;
    var re = /\s*,\s*/;
    var i,j;
    
    for (i = 0; i<n; i++) {
	sociogram[i] = [];
	sociogram[i].name = rows[i].children[0].children[0].value;
	sociogram[sociogram[i].name] = i;
	sociogram[i].positives = rows[i].children[1].children[0].value.split(re);
	sociogram[i].negatives = rows[i].children[2].children[0].value.split(re);
    }

    var dot = 'strict digraph Class { splines=true; overlap=orthoyx; label="' + title + '"; labeloc=b; labeljust=center; fontsize=30; { node [style=filled]; ';

    for (i=0; i<n; i++) {
	dot += 'STUDENT' + i + ' [label="' + sociogram[i].name + '"]; ';
    }

    dot += '} ';

    if (positive) {
	dot += '{ edge [color="red"]; ';
//	dot += '{ edge [dir="both"]; ';
	for (i=0; i<n; i++) {
	    sociogram[i].positives.forEach(function(v) {
		if (sociogram[v]) {
		    dot += ' STUDENT' + i + ' -> STUDENT' + sociogram[v] + '; ';
		}
	    })
	}
	dot += '} ';
    }
    
    if (negative) {
	dot += '{ edge [color="blue"]; ';
//	dot += '{ edge [dir="both"]; ';
	for (i=0; i<n; i++) {
	    sociogram[i].negatives.forEach(function(v) {
		if (sociogram[v]) {
		    dot += ' STUDENT' + i + ' -> STUDENT' + sociogram[v] + '; ';
		}
	    })
	}
	dot += '} ';
    }

    dot += '} ';
    
    console.log(dot);
    return false;
}
