const moment = require('moment-timezone');

const weatherStatuses = [
  {
    code: 200,
    description: 'Thunderstorm with light rain',
    descriptionRus: 'Гроза с небольшим дождём',
  },
  { code: 201, description: 'Thunderstorm with rain', descriptionRus: 'Гроза с дождём' },
  {
    code: 202,
    description: 'Thunderstorm with heavy rain',
    descriptionRus: 'Гроза с сильным дождем',
  },
  {
    code: 230,
    description: 'Thunderstorm with light drizzle',
    descriptionRus: 'Гроза с небольшим моросящим дождём',
  },
  { code: 231, description: 'Thunderstorm with drizzle', descriptionRus: 'Гроза с моросью' },
  {
    code: 232,
    description: 'Thunderstorm with heavy drizzle',
    descriptionRus: 'Гроза с сильным моросящим дождем',
  },
  { code: 233, description: 'Thunderstorm with Hail', descriptionRus: 'Гроза с градом' },
  { code: 300, description: 'Light Drizzle', descriptionRus: 'Легкий дождь' },
  { code: 301, description: 'Drizzle', descriptionRus: 'Морось' },
  { code: 302, description: 'Heavy Drizzle', descriptionRus: 'Сильный дождь' },
  { code: 500, description: 'Light Rain', descriptionRus: 'Легкий дождь' },
  { code: 501, description: 'Moderate Rain', descriptionRus: 'Умеренный дождь' },
  { code: 502, description: 'Heavy Rain', descriptionRus: 'Сильный дождь' },
  { code: 511, description: 'Freezing rain', descriptionRus: 'Ледяной дождь' },
  { code: 520, description: 'Light shower rain', descriptionRus: 'Легкий ливень' },
  { code: 521, description: 'Shower rain', descriptionRus: 'Ливневый дождь' },
  { code: 522, description: 'Heavy shower rain', descriptionRus: 'Сильный ливень' },
  { code: 600, description: 'Light snow', descriptionRus: 'Легкий снег' },
  { code: 601, description: 'Snow', descriptionRus: 'Снег' },
  { code: 602, description: 'Heavy Snow', descriptionRus: 'Сильный снег' },
  { code: 610, description: 'Mix snow/rain', descriptionRus: 'Микс снега и дождя' },
  { code: 611, description: 'Sleet', descriptionRus: 'Мокрый снег' },
  { code: 612, description: 'Heavy sleet', descriptionRus: 'Сильный мокрый снег' },
  { code: 621, description: 'Snow shower', descriptionRus: 'Снегопад' },
  { code: 622, description: 'Heavy snow shower', descriptionRus: 'Сильный снегопад' },
  { code: 623, description: 'Flurries', descriptionRus: 'Снежные хлопья' },
  { code: 700, description: 'Mist', descriptionRus: 'Мелкий туман' },
  { code: 711, description: 'Smoke', descriptionRus: 'Загрязненный воздух' },
  { code: 721, description: 'Haze', descriptionRus: 'Смог' },
  { code: 731, description: 'Sand/dust', descriptionRus: 'Песчаная буря' },
  { code: 741, description: 'Fog', descriptionRus: 'Туман' },
  { code: 751, description: 'Freezing Fog', descriptionRus: 'Морозный туман' },
  { code: 800, description: 'Clear sky', descriptionRus: 'Ясно' },
  { code: 801, description: 'Few clouds', descriptionRus: 'Немного облачно' },
  { code: 802, description: 'Scattered clouds', descriptionRus: 'Переменная облачность' },
  { code: 803, description: 'Broken clouds', descriptionRus: 'Облачно с прояснениями' },
  { code: 804, description: 'Overcast clouds', descriptionRus: 'Сплошная облачность' },
  { code: 900, description: 'Unknown Precipitation', descriptionRus: 'Неопределенные осадки' },
];

function getWeatherDescriptionRus(code) {
  const weatherStatus = weatherStatuses.find((status) => status.code === code);
  return weatherStatus ? weatherStatus.descriptionRus : 'Неизвестный статус погоды';
}

function getWeather(data) {
  const city = data.city_name;
  const temp = data.temp;
  const app_temp = data.app_temp;
  const country = data.country_code;
  const timezone = data.timezone;
  const pressure = data.pres;
  const windSpeed = data.wind_spd;
  const weatherStatus = getWeatherDescriptionRus(data.weather.code);

  const localTime = moment().tz(timezone).format('DD.MM.YYYY HH:mm');
  const sunriseLocal = moment.utc(data.sunrise, 'HH:mm').tz(timezone).format('HH:mm');
  const sunsetLocal = moment.utc(data.sunset, 'HH:mm').tz(timezone).format('HH:mm');

  const messageParts = [
    `Погода в ${city}, ${country} на ${localTime}:`,
    weatherStatus,
    `Температура: ${temp} °C`,
    `Ощущается как: ${app_temp} °C`,
    `Восход солнца: ${sunriseLocal}`,
    `Закат солнца: ${sunsetLocal}`,
    `Давление: ${pressure} мбар`,
    `Скорость ветра: ${windSpeed} км/ч`,
  ];

  return messageParts;
}

module.exports = {
  getWeather,
};
