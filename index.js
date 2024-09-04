require('dotenv').config();

const { Bot, GrammyError, HttpError, InlineKeyboard, Keyboard } = require('grammy');

const WeatherBot = new Bot(process.env.BOT_API_KEY);

WeatherBot.api.setMyCommands([
  { command: 'start', description: 'Start the bot' },
  { command: 'share', description: 'Share your location' },
]);

WeatherBot.command('start', async (ctx) => {
  await ctx.reply(`Привет ${ctx.from.first_name}, меня зовут BitWeather и я могу...`);
});

WeatherBot.command('share', async (ctx) => {
  const keyboard = new Keyboard().requestLocation('Поделиться локацией').resized().oneTime();

  await ctx.reply('Отправьте вашу геолокацию:', {
    reply_markup: keyboard,
  });
});

WeatherBot.on(':location', async (ctx) => {
  let city, country, temp;
  const weatherData = await fetch(
    `https://api.weatherbit.io/v2.0/current?lat=${ctx.message.location.latitude}&lon=${ctx.message.location.longitude}&key=${process.env.WEATHERBIT_API_KEY}`,
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      city = data.data[0].city_name;
      country = data.data[0].country_code;
      temp = data.data[0].temp;
    })
    .catch((error) => {
      console.error('There has been a problem with your fetch operation:', error);
    });

  await ctx.reply(`${city} ${country} ${temp}`, {
    reply_markup: { remove_keyboard: true },
  });
});

// WeatherBot.command('share', async (ctx) => {
//   const keyboard = new InlineKeyboard().text('Поделиться локацией', 'data location');

//   await ctx.reply('Отправьте вашу геолокацию:', {
//     reply_markup: keyboard,
//   });
// });

// WeatherBot.callbackQuery('data location', async (ctx) => {
//   await ctx.reply('data получена');
// });

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
