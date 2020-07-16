//Setup logger before everything ****************************************
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});
//logger winston config
const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    myFormat
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
});

logger.log('info', '------->Program Started');

//INITIALIZE MODULES TO USE *********************************************
var mysql = require('mysql');
var mqtt = require('mqtt')

//-----------------------------------------------------------------------
//SETUP CONFIGURATIONS **************************************************

//config for mySQL 
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'tramyar28',
  database: 'db_main_mmsu'
});

//config for MQTT
const mqttConfig = {
  host: "nberic.org",
  username: 'rae',
  password: '@raepasswd',
  port: 1883,
  clientId: 'EDMOS_' + Math.random().toString(16).substr(2, 8)
}
//topic config for the commands
const console_topic = 'esp32/d150/db/console'

//-----------------------------------------------------------------------
//INITIATE CONNECTIONS *************************************************

//log connection
logger.log('info', 'MySQL Connection started');
//connect mySQL client
connection.connect(function (err) {
  if (err) {
    //log error if there is
    logger.log('error', + err.stack);
    return;
  }
  //log successful connection
  logger.log('info', 'MySQL Connected with id ' + connection.threadId);
});

//connect MQTT client
var client = mqtt.connect(mqttConfig)
//log connection
logger.log('info', 'MQTT Connection started');
//-----------------------------------------------------------------------

//GLOBAL VARIABLE *******************************************************
let activeRecords
//-----------------------------------------------------------------------

//EVENTS ***************************************************************
//mqtt client initiate connection and subscribe to topics
client.on('connect', function () {
  //log event of connection
  logger.log('info', 'MQTT Connection established');

  //get active records after successfull connection to mqtt server
  getActive()

  //subscribe to command topic
  client.subscribe(console_topic, function (err) {
    if (!err) {
      //log query error
      logger.log('info', 'Subscribed to Command Console Topic: ' + console_topic);
    } else {
      //log query error
      logger.log('error', err);
    }
  })
  //some test publish 
  client.publish(console_topic, "MQTT Connection established")
})

//mqtt payload arival event //command arrival event as well
client.on('message', function (mtopic, message) {

  //seperate message based on topic 
  switch (mtopic) {
    //case for console commands
    case console_topic:
      //refresh the active topic list and re subscribe
      if (message.toString() === 'stop') {
        //log console command stop

        //unsubscribe to topics
        activeRecords.map(e => {
          client.unsubscribe(e.topic, function (err) {
            if (!err) {
              //log query error
              logger.log('info', 'Subscribed to Record Topic: ' + e.topic);
            } else {
              //log query error
              logger.log('error', err);
            }
          })
        })
        logger.log('info', 'Stop records invoked via MQTT command');


      } else if (message.toString() === 'start') {
        //log console command start
        getActive()
        logger.log('info', 'Start records invoked via MQTT command');
      }
      //insert other command handler
      break
    default:

      //format the data to be saved
      console.log(message.toString())
      var payload = JSON.stringify([new Date().getTime(), ...JSON.parse(message.toString())])
      //extract who is the user and what recordID is using the topic assigned and use as parameter in saving data
      user = activeRecords.find(({ topic }) => topic === mtopic);
      if (payload && user.recordID && user.owner_id) {
        saveMessage(payload, user.recordID, user.owner_id)
      }
      break
  }
})

//MQTT client reconnection event
client.on('reconnect', () => {
  //log that mqtt client has been diconnect and now reconnecting
  logger.log('error', 'MQTT Client reconnecting');
})

//MQTT Client has been closed for some reason event
client.on('close', () => {
  //log that mqtt client has been closed for some reason
  logger.log('error', 'MQTT Client closed for some reason');
})
//-----------------------------------------------------------------------

//FUNCTIONS for SQL query and other functions*****************************
//create query for saving data
function saveMessage(data, recordID, owner) {
  //construct query
  var query = "INSERT INTO `stores_recorddata` (`id`, `recordID`, `data`, `created_at`, `owner_id`) VALUES (NULL, '" + recordID + "', '" + data + "', '" + new Date().toISOString().slice(0, 19).replace('T', ' ') + "', '" + owner + "')"
  //make save query
  connection.query(String(query), function (error, results, fields) {
    if (error) {
      //log query error
      logger.log('error', error);
    };
  });
}

//get active records
function getActive() {
  //log query error
  logger.log('info', 'GetActive function called');
  connection.query("SELECT * FROM `stores_record` WHERE `status` LIKE 'Active'", function (error, results, fields) {
    if (error) {
      //log query error
      logger.log('error', error);
    } else {
      //set res to the variable for use of other functions
      activeRecords = results

      //subscribe all topics
      results.map(e => {
        client.subscribe(e.topic, function (err) {
          if (!err) {
            //log query error
            logger.log('info', 'Subscribed to Record Topic: ' + e.topic);
          } else {
            //log query error
            logger.log('error', err);
          }
        })
      })
    }
  });
}

//-----------------------------------------------------------------------

