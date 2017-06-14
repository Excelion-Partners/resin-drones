'use strict'
/*
 This is simple Lambda service to associate resin.io devices with AWS and pass the
 certificates required to publish data to AWS IoT back to the device.
*/

// libs
var resinIntegrator = require('./resin-integrator')
var resinAWS = require('./resin-aws')

// aws policy document
var policy = require('./policy.json')

// exports handler for Lambda func
module.exports.provision = function(event, context, callback) {
	// handle request
	if (event) {
		// resin.io credentials
		var resinCreds = { email: process.env.RESIN_EMAIL, password: process.env.RESIN_PASSWORD }

		// get data posted from device
		var eventBody = JSON.parse(event.body)
		var deviceUUID = eventBody.uuid
		var deviceAttributes = eventBody.attributes

		// new lambda API setting
		context.callbackWaitsForEmptyEventLoop = false

		resinIntegrator.init(resinCreds).then(function() {
			return resinIntegrator.isDeviceValid(deviceUUID)
		}).then(function() {
			// pass deviceUUID
			// return a object that to create enviroment variables
			return resinAWS.provision(deviceUUID, deviceAttributes, policy)
		}).then(function(certs) {
			// creates resin.io environmentVariables
			return resinIntegrator.createEnv(deviceUUID, certs)
		}).catch(function(err) {
			// Handle any error
			console.log(err.message)
			callback(null, { statusCode: err.statusCode, body: JSON.stringify({ message: err.message }) })
		}).then(function() {
			// Process complete
			// AWS Certificates are now saved on the device as enviroment variables
			console.log('Device successfully configured')
			callback(null, { statusCode: 200, body: JSON.stringify({ message: 'Device successfully configured' }) })
		})
	}
}
