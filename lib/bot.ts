import { Bot, Context } from "https://deno.land/x/grammy@v1.32.0/mod.ts";

import { changesKeyboard, menuKeyboard, yesOrNo, coffekeyboard, interesKeyboard  } from "./keyboards.ts"; // импорт клавиатур

import { MyContext, UserInfo, UserData } from "./interfaces.ts"; //импорт интерфейсов

import { reviewProfile, setState } from "./functions.ts"; //импорт функций


//база данных deno
export const database = await Deno.openKv();

export const bot = new Bot<MyContext>(Deno.env.get("BOT_TOKEN") || "7785377297:AAHQXYH32S0fE5TOZvuN1GPxxAnHOvT0OXg");

// info будет нужна для сохранения инфо пользователя в бд (или получения) - представляет из себя набор данных о пользователе  
export const info: UserInfo = {
  id: 0,
  name: "",
  age: 0,
  interests: "",
  coffe:"",
  done: false,
  rating: 0,
};


bot.command("start", async (ctx) => { // бот получает команду /start
  info.id = Number(ctx.msg.from?.id);
  if (Boolean((await database.get(["users", info.id, "done"])).value) != false) {
    // опитимизировать?
    info.name = String((await database.get(["users", info.id, "name"])).value);
    info.age = Number((await database.get(["users", info.id, "age"])).value);
    info.interests = Array(
      String((await database.get(["users", info.id, "interests"])).value),
    );
   
    info.time = String((await database.get(["users", info.id, "state"])).value);
    info.state = String(
      (await database.get(["users", info.id, "state"])).value,
    );
    info.rating = Number(
      (await database.get(["users", info.id, "rating"])).value,
    );
    await ctx.reply(`Привет, ${info.name}!`, { reply_markup: menuKeyboard });
  } else {
    await ctx.reply(
      "Йоу, чё как?! \nТы тут в первый раз. Тогда поясню. \nЯ бот, который поможет завести новые знакомства, встретиться, пообщатся. Ты не против? \nТогда начнём!",
    );
    await ctx.reply(
      "Звать то тебя как? А прозвище то есть?",
    );
    setState("setName"); // следующим сообщением боту должно придти имя
  }
});

// Команда /like
bot.command("like", async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    // Если собеседника еще не оценивали то создаем запись
    if (!ratings[userId]) {
        ratings[userId] = { likes: 0, dislikes: 0 };
    }

    // Увеличиваем счетчик "нравится"
    ratings[userId].likes += 1;

    await ctx.reply("Спасибо! Тебе понравился собеседник. 👍");
});

// Команда /dislike
bot.command("dislike", async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    // Если собеседника еще не оценивали то создаем запись
    if (!ratings[userId]) {
        ratings[userId] = { likes: 0, dislikes: 0 };
    }

   // Увеличиваем счетчик "не нравится"
    ratings[userId].dislikes += 1;

    await ctx.reply("Спасибо! Тебе не нравится собеседник. 👎");
});

// Команда /stats для получения статистики оценок
bot.command("stats", async (ctx) => {
    const userId = ctx.from?.id.toString();
    const userRatings = ratings[userId] || { likes: 0, dislikes: 0 };
    const response = `Статистика: Нравится: ${userRatings.likes}, Не нравится: ${userRatings.dislikes}`;
    await ctx.reply(response);
});
//обработка подтверждения интересов
bot.callbackQuery("interestsDone", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.reply("Прекрасно");
  await reviewProfile(ctx);
});

bot.callbackQuery("interestsNotDone", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.reply("Пиши увлечения");
  setState("setInterests"); // следующим сообщением боту должно придти имя
});

bot.hears(
  ["профиль", "Профиль", "Мой профиль", "Мой профиль 👤"],
  async (ctx) => {
    await reviewProfile(ctx);
  },
);

bot.on("message", async (ctx) => {
  if (info.state) { // при непустом info.state
    switch (info.state) {
      case "setName":
        if (
          typeof ctx.msg.text !== "string" ||
          /[0-9_.*^%$#@!]/.test(ctx.msg.text) // регулярное выражение на проверку спец символов
        ) {
          await ctx.reply(
            "Косяк! Имя не должно содержать числа и символы",
          );
          return;
        } else {
          info.name = ctx.msg.text || ""; //сохраняем в переменную
          await ctx.reply("Ну, проходи тогда " + info.name + "!");
          await ctx.reply("Сколько лет то тебе?");
          setState("setAge");
        }
        break;

      case "setAge":
        if (isNaN(Number(ctx.msg.text))) {
          await ctx.reply("Косячишь! Возраст-это число");
          return;
          break
        }

        break;

      case "review":
        switch (ctx.msg.text) {
          case "Да!":
            info.done = true
            await ctx.reply("Прекрасно");
            await database.set(["users", info.id, "name"], info.name);
            await database.set(["users", info.id, "age"], info.age);
            await database.set(["users", info.id, "interests"], info.interests);
            await database.set(["users", info.id, "geo"], info.geo);
            await database.set(["users", info.id, "state"], info.state);
            await database.set(["users", info.id, "time"], info.time);
            await database.set(["users", info.id, "done"], info.done);
            break;

          case "Нет, хочу изменить":
            setState("changeProfile");
            await ctx.reply("Выбери, что хочешь изменить", {
              reply_markup: changesKeyboard,
            });
            break;

          default:
            await ctx.reply("Выбери вариант");
            break;
        }
        break;
      case "changeProfile":
        switch (ctx.msg.text) {
          case "Имя":
            await ctx.reply("Меняй имя или прозвище")
            break;
          case "Возраст":
            await ctx.reply("Ты как так быстро вырос?")
            break;
          case "Геопозицию":
            await ctx.reply("Место меняешь? Да что же такое!")
            break;
          case "Интересы":
            await ctx.reply("Ты бысто переобулся!")
            break;
          case "Удобное время":
            await ctx.reply("Меняй время")
            break;
          case "Хочу заполнить профиль заново":
            await ctx.reply("Удаляю при тебе!")
            break;
          default:
            await ctx.reply("Выбери вариант")
            break;
        }
        break;


      case "setInterests":
        if (ctx.msg.text) {
          for (const interest of ctx.msg.text?.split(",")) {
            info.interests.push(interest.trim());
          }
        }
        await ctx.reply(
          "Вот список твоих интересов:",
        );
        await ctx.reply(
          info.interests.toString(),
        );
        await ctx.reply("Это все?", { reply_markup: yesOrNo }); // смотри bot.callbackQuery
        setState("setInterests");
        break;

      default:
        break;
    }
  }
});



