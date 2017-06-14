'use strict'

var Alexa = require('alexa-sdk')
var AWS = require('aws-sdk')

var containerId

var handlers = {
	'FlyDrones': function() {
		var iotdata = new AWS.IotData({ endpoint: 'https://' + process.env.AWS_IOT_ENDPOINT })

		var params = {
			topic: process.env.RESIN_DEVICE_ID + '/command', /* required */
			payload: Buffer.from('pattern-3'),
			qos: 0
		}

		var self = this
		iotdata.publish(params, function(err, data) {
			if (err) console.log(err, err.stack) // an error occurred
			else {
				self.emit('Countdown')
			}
		})
	},
	'Countdown': function() {
		this.emit(':tell', '<audio src="https://s3.amazonaws.com/lucy-devops/lucy.mp3" />')
	},
	'Unhandled': function() {
		this.emit(':tell', 'Sorry I didn\'t understand that function')
	}
}

module.exports.flyDrones = (event, context, callback) => {
	if (!containerId) containerId = context.awsRequestId
	console.log('Container ID: ' + containerId)

	if (event.keepWarm !== null && event.keepWarm === true) {
		console.log('Just keeping the lambda warm')
		callback(null)
	} else {
		var alexa = Alexa.handler(event, context)
		alexa.registerHandlers(handlers)
		alexa.execute()
	}
}
