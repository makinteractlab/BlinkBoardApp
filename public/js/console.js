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
const $ = require('jquery');

let port;


SerialPort.list((err, ports) => {

	// console.log('ports', ports);
	if (err || ports.length === 0) {
		$('textarea#results').val("No ports discovered")
	}

	ports.forEach(element => {
		$("#portList").append(new Option(element.comName, element.comName));
	});
});

$("#portList").on('change', function () {
	const portName = $("#portList option:selected").text();

	port = new SerialPort(portName, {
		baudRate: 115200
	});

	// read listener
	const parser = new Readline()
	port.pipe(parser)

	parser.on('data', line => {
		console.log(`> ${line}`);
		$('textarea#results').val(line);
	})
});

$("#portList").on('click', function () {
	if (port === undefined) return;
	port.close(function (err) {
		console.log('port closed', err);
	});
});

$("#sendButton").on('click', function (){
	const toSend = `${$('textarea#tosend').val()}\n`
	port.write(toSend, function(err) {
		if (err) console.log('Error on write: ', err.message)
	});
});






$("#quitbutton").on('click', function()
{
	const {BrowserWindow} = require('electron').remote;
	let theWindow = BrowserWindow.getFocusedWindow();
	theWindow.close();
});