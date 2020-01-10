const axios = require('axios')

//api functions
//login to get token
async function login(username, password) {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  }
  const body = JSON.stringify({ username, password })
  try {
    let res = await axios.post('http://localhost:8000/api/auth/login', body, config)
    return res.data.token
  }
  catch (err) {
    console.log(err.response.data, err.response.status)
  }
}

//record data using api with token
const recorddata = (recordID, data, token) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`
    }
  }
  const body = JSON.stringify({ recordID, data })

  axios.post('http://localhost:8000/api/recorddata/', body, config)
    .then(res => {
      console.log(res.data)
    }).catch(err => {
      console.log(err.response.data, err.response.status)
    })
}
login('raevillena', 'tramyar28').then(res => token = res)

//mqtt
var mqtt = require('mqtt')
var client = mqtt.connect({
  host: "35.232.223.139",
  username: 'rae',
  password: '@raepasswd',
  port: 1883,
  clientId: 'RMCDB_' + Math.random().toString(16).substr(2, 8)
})
var topic = 'esp32/d150/ctemperature'
var console_topic = 'db/message'
//mqtt connection event
client.on('connect', function () {
  client.subscribe(topic, function (err) {
    if (!err) {
      console.log('Subscribed to MQtt server', topic)
    }
  })
  client.publish(console_topic, "MQTT Connection established")
})

//mqtt payload arival event
client.on('message', function (topic, message) {
  var ss = JSON.stringify([new Date().getTime(), ...JSON.parse(message.toString())])
  console.log(ss)
  recorddata('1', ss, token)
})