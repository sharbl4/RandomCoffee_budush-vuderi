import { webhookCallback } from "https://deno.land/x/grammy@v1.32.0/mod.ts";

import express, { Request, Response } from 'npm:express';

import { bot } from "/lib./bot.ts";

import { changesKeyboard, menuKeyboard, yesOrNo, acceptKeyboard} from "./keyboards.ts"; // импорт клавиатур

import { MyContext, UserInfo } from "./lib/interfaces.ts"; //импорт интерфейсов

import { reviewProfile, setState } from "./lib/functions.ts"; //импорт функций


const app = express();

const handleUpdate = webhookCallback(bot, 'express');

app.use(express.json());

const web_hook_path = `/${bot.token}/webhook`;

app.post(web_hook_path, async (req: Request, res: Response) => {
    if (req.method === "POST" && req.path === web_hook_path) {
        try {
            await handleUpdate(req, res); // Передаем запрос и ответ в обработчик обновлений
        } catch (err) {
            console.error(err);
            res.sendStatus(500); // Ответ с ошибкой
        }
    } else {
        res.sendStatus(404); // Если путь не соответствует токену бота или метод не POST
    }
});

// Слушаем на порту 5000
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

