var Drone = require('rolling-spider')
var temporal = require('temporal')
var awsIot = require('aws-iot-device-sdk')

var droneNames = process.env.DRONE_IDS.split(',')
var drones = []
var index = 0
var STEPS = 20
var ready = false

function connectToDrone() {
	var d = new Drone(droneNames[index])
	drones[index] = d

	console.log('connecting to ' + droneNames[index] + '...')

	d.connect(function() {
		console.log('connected to ' + d.name)
		d.setup(function() {
			d.flatTrim()
			d.startPing()
			d.flatTrim()

			console.log('completed setup of ', d.name)

			index++

			if (index < droneNames.length) {
				connectToDrone()
			} else {
				ready = true
			}
		})
	})
}

function pattern1() { // begin with both drones facing audience
	temporal.queue([{
		delay: 0,
		task: function() {
			sendCommandToDrones('take-off')
		}
	}, {
		delay: 2000,
		task: function() {
			sendCommandToDrones('up')
		}
	}, {
		delay: 2000,
		task: function() {
			sendCommandToDrones('tilt-left')
		}
	}, {
		delay: 2000,
		task: function() {
			sendCommandToDrones('tilt-right')
		}
	},
	{
		delay: 2000,
		task: function() {
			sendCommandToDrones('360')
		}
	}, {
		delay: 7000,
		task: function() {
			sendCommandToDrones('back-flip')
		}
	}, {
		delay: 2000,
		task: function() {
			sendCommandToDrones('land')
		}
	}])
}

function pattern2() { // begin with both drones facing each other
	temporal.queue([{
		delay: 0,
		task: function() {
			sendCommandToDrones('take-off')
		}
	}, {
		delay: 2000,
		task: function() {
			sendCommandToDrones('up')
		}
	}, {
		delay: 2000,
		task: function() {
			sendCommandToDrones('backward')
		}
	}, {
		delay: 2000,
		task: function() {
			sendCommandToDrones('forward')
		}
	}, {
		delay: 2000,
		task: function() {
			sendCommandToDrones('180')
		}
	}, {
		delay: 3500,
		task: function() {
			sendCommandToDrones('forward')
		}
	}, {
		delay: 2000,
		task: function() {
			sendCommandToDrones('tilt-left')
		}
	}, {
		delay: 3000,
		task: function() {
			sendCommandToDrones('front-flip')
		}
	}, {
		delay: 2000,
		task: function() {
			sendCommandToDrones('land')
		}
	}])
}

function pattern3() { // flips!!!
	temporal.queue([{
		delay: 0,
		task: function() {
			sendCommandToDrones('take-off')
		}
	}, {
		delay: 2000,
		task: function() {
			sendCommandToDrones('up')
		}
	}, {
		delay: 2000,
		task: function() {
			sendCommandToDrones('front-flip')
		}
	}, {
		delay: 3000,
		task: function() {
			sendCommandToDrones('back-flip')
		}
	}, {
		delay: 3000,
		task: function() {
			sendCommandToDrones('left-flip')
		}
	}, {
		delay: 3000,
		task: function() {
			sendCommandToDrones('right-flip')
		}
	}, {
		delay: 2000,
		task: function() {
			sendCommandToDrones('360')
		}
	}, {
		delay: 6000,
		task: function() {
			sendCommandToDrones('land')
		}
	}])
}

function sendCommandToDrones(fct) {
	for (var x = 0; x < drones.length; x++) {
		var drone = drones[x]
		switch (fct) {
		case 'disconnect':
			drone.disconnect()
			console.log('disconnected from ' + drone.name)
			break
		case 'pattern-1':
			pattern1()
			break
		case 'pattern-2':
			pattern2()
			break
		case 'pattern-3':
			pattern3()
			break
		case '90':
			drone.clockwise({
				steps: STEPS * 1.5
			})
			drone.flatTrim()
			break
		case '180':
			drone.clockwise({
				steps: STEPS * 2.5
			})
			drone.flatTrim()
			break
		case '360':
			drone.clockwise({
				steps: STEPS * 5
			})
			drone.flatTrim()
			break
		case 'land':
			drone.land()
			break
		case 'up':
			drone.up({
				steps: STEPS * 1.5
			})
			drone.flatTrim()
			break
		case 'clockwise':
			drone.clockwise({
				steps: STEPS * 1.5
			})
			drone.flatTrim()
			break
		case 'counter-clockwise':
			drone.counterClockwise({
				steps: STEPS * 1.5
			})
			drone.flatTrim()
			break
		case 'tilt-right':
			drone.tiltRight({
				steps: STEPS * 1.5
			})
			drone.flatTrim()
			break
		case 'tilt-left':
			drone.tiltLeft({
				steps: STEPS * 1.5
			})
			drone.flatTrim()
			break
		case 'down':
			drone.down({
				steps: STEPS * 1.5
			})
			drone.flatTrim()
			break
		case 'take-off':
			drone.takeOff()
			drone.flatTrim()
			break
		case 'forward':
			drone.forward({
				steps: STEPS
			})
			drone.flatTrim()
			break
		case 'backward':
			drone.backward({
				steps: STEPS
			})
			drone.flatTrim()
			break
		case 'front-flip':
			drone.frontFlip({
				steps: STEPS
			})
			drone.flatTrim()
			break
		case 'back-flip':
			drone.backFlip({
				steps: STEPS
			})
			drone.flatTrim()
			break
		case 'left-flip':
			drone.leftFlip({
				steps: STEPS
			})
			drone.flatTrim()
			break
		case 'right-flip':
			drone.rightFlip({
				steps: STEPS
			})
			drone.flatTrim()
			break
		}
	}
}

connectToDrone()

var connectOptions = {
	privateKey: Buffer.from(process.env.AWS_PRIVATE_KEY, 'base64'),
	clientCert: Buffer.from(process.env.AWS_CERT, 'base64'),
	caCert: Buffer.from(process.env.AWS_ROOT_CA, 'base64'),
	clientId: process.env.RESIN_DEVICE_UUID,
	region: process.env.AWS_REGION
}

var device = awsIot.device(connectOptions)

device.on('connect', function() {
	console.log('Connected to IoT')
	// subscribe to TOPIC mqtt topic
	console.log('Subscribing to IoT topic ' + process.env.RESIN_DEVICE_UUID + '/command')
	device.subscribe(process.env.RESIN_DEVICE_UUID + '/command')
	// device.subscribe('command')
	console.log('Subscribed to IoT topic')
})

device.on('message', function(topic, payload) {
	console.log('message: ', topic, payload.toString())
	if (ready) {
		sendCommandToDrones(payload.toString())
	}
})
