var mqtt = require('mqtt')

const mqttConfig = {
    host: "nberic.org",
    username: 'rae',
    password: '@raepasswd',
    port: 1883,
    clientId: 'RMCDB_' + Math.random().toString(16).substr(2, 8)
}


var client = mqtt.connect(mqttConfig)

topic = 'esp32/d150/ctemperature'

client.on('connect', function () {
    for (i = 1; i <= 200; i++) {
        pub200()
    }
})

function pub200() {
    var payload = '[' + String([getRandomInt(50), getRandomInt(10), 0, 0]) + ']'
    client.publish(topic, payload)
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}