var mqtt = require('mqtt')
const connectionString = {
  host: "35.232.223.139", username: 'rae', password: '@raepasswd', port: 1883, clientId: 'RMCDB_' + Math.random().toString(16).substr(2, 8)
}
var client = mqtt.connect(connectionString)

client.on('connect', function () {
  client.subscribe('presence', function (err) {
    if (!err) {
      client.publish('presence', 'Hello mqtt')
    }
  })
})

client.on('message', function (topic, message) {
  // message is Buffer
  console.log(message.toString())
  client.end()
})