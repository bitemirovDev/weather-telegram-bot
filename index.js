require('dotenv').config();
const { Bot, GrammyError, HttpError, Keyboard, session } = require('grammy');
const moment = require('moment-timezone');
const cron = require('node-cron');

// modules
const { connect } = require('./modules/db');
const { getWeather } = require('./modules/weather');
const { getData } = require('./modules/api');

// Подключение к базе данных
let db;
async function initializeDb() {
  db = await connect();
}

// Инициализируем базу данных при запуске
initializeDb().catch((err) => {
  console.error('Не удалось подключиться к базе данных:', err);
  process.exit(1); // Завершаем процесс, если подключение не удалось
});

// Bot
const WeatherBot = new Bot(process.env.BOT_API_KEY);
WeatherBot.use(session({ initial: () => ({ isRegistering: false }) }));

// Список команд
WeatherBot.api.setMyCommands([
  { command: 'start', description: 'Запустить бота' },
  { command: 'register', description: 'Регистрация' },
  { command: 'current', description: 'Получить информацию о погоде на данный момент' },
  { command: 'subscribe', description: 'Подписаться на ежедневную рассылку прогноза погоды' },
  { command: 'unsubscribe', description: 'Отписаться от ежедневной рассылки прогноза погоды' },
]);
// Запуск бота
WeatherBot.command('start', async (ctx) => {
  const commands = `
  /register - регистрация
  /current - получить информацию о погоде на данный момент
  /subscribe - подписаться на ежедневную рассылку прогноза погоды
  /unsubscribe - отписаться от ежедневной рассылки прогноза погоды
  `;

  await ctx.reply(`Привет ${ctx.from.first_name}, вот список моих возможностей:
   ${commands}
  `);
});
// Получение погоды на текущее время
WeatherBot.command('current', async (ctx) => {
  // Отправляем информацию о текущей погоде если пользователь ввел команду /current
  if (db) {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ tg_id: ctx.from.id });

    if (!user) {
      await ctx.reply(
        'Чтобы получить погоду на текущее время, нужно зарегистрироваться через команду /register',
      );
    } else if (user.coordinates === null || user.coordinates === undefined) {
      await ctx.reply('Пожалуйста, для начала поделитесь вашей геолокацией.');
    } else {
      const data = await getData(user.coordinates.longitude, user.coordinates.latitude);

      if (data) {
        const weather = getWeather(data);
        await ctx.reply(weather.join('\n'));
      }
    }
  } else {
    await ctx.reply('База данных сейчас не доступна, попробуйте позже...');
  }
});
// Регистрация пользователя
WeatherBot.command('register', async (ctx) => {
  if (db) {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ tg_id: ctx.from.id });

    if (!user) {
      await usersCollection.insertOne({
        tg_id: ctx.from.id,
        tg_chat_id: ctx.chat.id,
        username: ctx.from.username,
        first_name: ctx.from.first_name,
        registerDate: new Date(),
        subscription: false,
      });

      ctx.session.isRegistering = true;

      // Создаем клавиатуру для запроса геолокации
      const keyboard = new Keyboard().requestLocation('Поделиться локацией').resized().oneTime();

      await ctx.reply('Вы успешно зарегистрировались. Пожалуйста, поделитесь вашей геолокацией.', {
        reply_markup: keyboard,
      });
    } else {
      await ctx.reply('Вы уже зарегистрированы.');
    }
  } else {
    await ctx.reply('База данных сейчас не доступна, попробуйте позже...');
  }
});
// Подписка на рассылку
WeatherBot.command('subscribe', async (ctx) => {
  if (db) {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ tg_id: ctx.from.id });

    if (!user) {
      await ctx.reply(
        'Вы не зарегистрированы, пожалуйста, для начала используйте команду /register',
      );
    } else if (user.subscription) {
      await ctx.reply('Вы уже подписались на ежедневную рассылку. Ожидайте уведомления в 08:00.');
    } else {
      await usersCollection.updateOne(
        { tg_id: ctx.from.id },
        {
          $set: {
            subscription: true,
          },
        },
      );
      await ctx.reply(
        'Вы успешно подписались на ежедневную рассылку. Ожидайте уведомления в 08:00.',
      );
    }
  } else {
    await ctx.reply('База данных сейчас не доступна, попробуйте позже...');
  }
});
// Отписка от рассылку
WeatherBot.command('unsubscribe', async (ctx) => {
  if (db) {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ tg_id: ctx.from.id });

    if (!user) {
      await ctx.reply(
        'Вы не зарегистрированы, пожалуйста, для начала используйте команду /register',
      );
    } else if (!user.subscription) {
      await ctx.reply('Вы не подписаны на ежедневную рассылку.');
    } else {
      await usersCollection.updateOne({ tg_id: ctx.from.id }, { $set: { subscription: false } });
      await ctx.reply(
        'Вы успешно отписались от ежедневной рассылки. Ежедневные уведомления приходить не будут.',
      );
    }
  } else {
    await ctx.reply('База данных сейчас не доступна, попробуйте позже...');
  }
});
// Слушатель отправления локации пользователем
WeatherBot.on(':location', async (ctx) => {
  if (ctx.session.isRegistering && db) {
    const usersCollection = db.collection('users');

    // Добавляем координаты пользователя в базу
    const userTimezone = await getData(
      ctx.message.location.longitude,
      ctx.message.location.latitude,
    ).then((res) => res.timezone);

    await usersCollection.updateOne(
      { tg_id: ctx.from.id },
      {
        $set: {
          coordinates: {
            latitude: ctx.message.location.latitude,
            longitude: ctx.message.location.longitude,
            timezone: userTimezone,
          },
        },
      },
    );

    // Сбрасываем инфомрацию о сессии, чтобы при первой отправке локации, пользователю не отправлялась текущая погода
    ctx.session.isRegistering = false;

    await ctx.reply(`Ваше местоположение сохранено`);
  } else if (!ctx.session.isRegistering) {
    await ctx.reply(
      'Для получения инфомрации о текущей погоде на текущее время, воспользуйтесь командой /current',
    );
  } else if (!db) {
    await ctx.reply('База данных сейчас не доступна, попробуйте позже...');
  }
});
// Слушатель отправления любых сообщений пользователя
WeatherBot.on('message', async (ctx) => {
  await ctx.reply('Я тебя не понимаю, попробуй выбрать что-нибудь из списка команд...');
});
// Обработчик ошибок
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
// Планировщик отправления прогноза в 08:00 утра.
cron.schedule('0 * * * *', async () => {
  if (db) {
    console.log('Проверяем пользователей на отправку прогноза...');
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({ subscription: true }).toArray();

    const currentUTC = moment.utc();

    for (const user of users) {
      const userLocalTime = currentUTC.tz(user.coordinates.timezone);

      if (userLocalTime.hour() === 8 && userLocalTime.minute() === 0) {
        const data = await getData(user.coordinates.longitude, user.coordinates.latitude);

        if (data) {
          const weather = getWeather(data);

          try {
            await WeatherBot.api.sendMessage(user.tg_chat_id, weather.join('\n'));
          } catch (err) {
            console.error(`Не удалось отправить сообщение пользователю ${user.tg_chat_id}: ${err}`);
          }
        }
      }
    }
  } else {
    await ctx.reply('База данных сейчас не доступна, попробуйте позже...');
  }
});

WeatherBot.start();
