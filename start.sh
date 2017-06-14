#!/bin/bash
echo "Starting Device $RESIN_DEVICE_UUID"

if [[ -z "$AWS_CERT" && -z "$AWS_PRIVATE_KEY" && -z "$AWS_ROOT_CA" ]]
then
	echo "Creating AWS certificates"
	curl -X POST -H "Cache-Control: no-cache" -H 'Content-Type: application/json' \
	-v -d '{ "uuid": "'$RESIN_DEVICE_UUID'", "attributes": { "type": "rpi_3" } }' \
	$LAMBDA
elif [[ "$AWS_CERT" && "$AWS_PRIVATE_KEY" && "$AWS_ROOT_CA" ]]
then
	echo "AWS certificates exist - running app"
fi

sudo service bluetooth stop
sudo service bluetooth start

hcitool dev

echo "Waiting for bluetooth service"
function bluetooth_is_inactive {
	activation=$(systemctl status bluetooth | grep "Active: active" )
	if [ -z "$activation" ]; then
		return 0;
	else
		return 1;
	fi
}

while bluetooth_is_inactive ; do true; done

echo "Bluetooth service is active"

until /usr/bin/hciattach /dev/ttyAMA0 bcm43xx 921600 noflow -
do
    echo "Initializing bluetooth failed."
done

echo "Bring hci0 up..."
hciconfig hci0 up

HCI_DEV_STATUS=`hcitool dev | grep hci0 | wc -l`
if [ $HCI_DEV_STATUS -ne 1 ]; then
    echo "Unable to start Bluetooth"
else
    echo "Starting the node application"

    cd /usr/src/app
    node index.js
fi
