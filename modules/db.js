require('dotenv').config();
const { MongoClient } = require('mongodb');

// Database
const MongoDBclient = new MongoClient(process.env.MONGODB_URI);

const connect = async () => {
  try {
    await MongoDBclient.connect();
    console.log('Подключение к MongoDB успешно установлено...');
    return MongoDBclient.db('BitWeather');
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  connect,
};
