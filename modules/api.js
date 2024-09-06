require('dotenv').config();
const axios = require('axios');

async function getData(longitude, latitude) {
  const url = `https://api.weatherbit.io/v2.0/current?lat=${latitude}&lon=${longitude}&key=${process.env.WEATHERBIT_API_KEY}`;
  const data = await axios
    .get(url)
    .then((res) => {
      return res.data.data[0];
    })
    .catch((err) => {
      console.log(err);
    });

  return data;
}

module.exports = {
  getData,
};
