require('dotenv').config();
const { Bot, GrammyError, HttpError, InlineKeyboard, Keyboard } = require('grammy');
const axios = require('axios');
const moment = require('moment-timezone');

const { connect } = require('./db');

// Bot
const WeatherBot = new Bot(process.env.BOT_API_KEY);

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

WeatherBot.api.setMyCommands([
  { command: 'start', description: 'Запустить бота' },
  { command: 'weather', description: 'Поделиться геолокацией' },
  { command: 'register', description: 'Зарегистрироваться для ежедневной рассылки' },
]);

WeatherBot.command('start', async (ctx) => {
  const commands = `
    /weather - Получение текущей погоды по вашему местоположению
    /register - Зарегистрироваться для ежедневной рассылки в 08:00 утра каждого дня
  `;

  await ctx.reply(`Привет ${ctx.from.first_name}, меня зовут BitWeather и я могу:
    ${commands}
  `);
});

WeatherBot.command('weather', async (ctx) => {
  const keyboard = new Keyboard().requestLocation('Поделиться локацией').resized().oneTime();

  await ctx.reply('Отправьте вашу геолокацию', {
    reply_markup: keyboard,
  });
});

WeatherBot.command('register', async (ctx) => {
  const db = await connect();
  const users = db.collection('users');
  const user = await users.findOne({ tg_id: ctx.from.id });

  if (!user) {
    await users.insertOne({
      tg_id: ctx.from.id,
      tg_chat_id: ctx.chat.id,
      username: ctx.from.username,
      first_name: ctx.from.first_name,
      registerDate: new Date(),
    });

    // Создаем клавиатуру для запроса геолокации
    const keyboard = new Keyboard().requestLocation('Поделиться локацией').resized().oneTime();

    await ctx.reply(
      'Вы успешно зарегистрировались на ежедневную рассылку погоды. Пожалуйста, поделитесь вашей геолокацией:',
      {
        reply_markup: keyboard,
      },
    );
  } else {
    await ctx.reply(
      'Вы уже зарегистрировались на ежедневную рассылку погоды. Ожидайте уведомления)))',
    );
  }
});

WeatherBot.on(':location', async (ctx) => {
  const db = await connect();
  const usersCollection = db.collection('users');

  const user = await usersCollection.findOne({ tg_id: ctx.from.id });

  if (user) {
    const { latitude, longitude } = ctx.message.location;
    await usersCollection.updateOne(
      { tg_id: ctx.from.id },
      {
        $set: {
          coordinates: {
            longitude: longitude,
            latitude: latitude,
          },
        },
      },
    );

    await ctx.reply('Ваши координаты обновлены. Спасибо!');
  } else {
    await ctx.reply('Пользователь не найден в базе данных. Пожалуйста, зарегистрируйтесь сначала.');
  }

  const url = `https://api.weatherbit.io/v2.0/current?lat=${ctx.message.location.latitude}&lon=${ctx.message.location.longitude}&key=${process.env.WEATHERBIT_API_KEY}`;

  const data = await axios
    .get(url)
    .then((res) => {
      return res.data.data[0];
    })
    .catch((err) => {
      console.log(err);
    });

  if (data) {
    const city = data.city_name;
    const temp = data.temp;
    const app_temp = data.app_temp;
    const country = data.country_code;
    const timezone = data.timezone;
    const pressure = data.pres;
    const windSpeed = data.wind_spd;
    const weatherStatus = getWeatherDescriptionRus(data.weather.code);

    const localTime = moment().tz(timezone).format('DD.MM.YYYY HH:mm');
    // Преобразуем время из UTC в локальное время
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

    await ctx.reply(messageParts.join('\n'));
  }
});

WeatherBot.on('message', async (ctx) => {
  await ctx.reply('Я тебя не понимаю, попробуй выбрать что-нибудь из списка команд...');
});

WeatherBot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;

  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e);
  } else {
    console.error('Unknown error:', e);
  }
});

WeatherBot.start();
