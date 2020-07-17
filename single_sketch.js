// function setup() 
// {
// 	createCanvas(windowWidth, windowHeight);
// }

// function windowResized() {
// 	resizeCanvas(windowWidth, windowHeight);
//   }



// function draw()
// {
// 	background(200,200,200);
// 	fill (255, 0, 0);
// 	ellipse (mouseX, mouseY, 100, 100);

// 	fill (255, 255, 0);
// 	ellipse(width/2, height/2, 100, 100);
// }

const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')

let port;


SerialPort.list((err, ports) => {
	console.log('ports', ports);
	if (err || ports.length === 0) {
		document.getElementById('results').innerHTML = 'No ports discovered';
	}

	document.getElementById('results').innerHTML = "";

	const sel = document.getElementById('portList');

	ports.forEach(element => {
		sel.innerHTML += `<option>${element.comName}</option>`
	});

	sel.addEventListener('change', function () {
		const portName =this.options[this.selectedIndex].text;

		port = new SerialPort(portName, {
			baudRate: 115200
		})
		const parser = new Readline()
		port.pipe(parser)

		parser.on('data', line => {
			console.log(`> ${line}`);
			document.getElementById('results').innerHTML = line;
		})
	});

	sel.addEventListener('click',function(){
		if (port === undefined) return;
		port.close(function (err) {
			console.log('port closed', err);
		});
	});

	



});