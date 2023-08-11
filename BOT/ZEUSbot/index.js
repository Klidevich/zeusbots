require('dotenv').config()
const {VK} = require('vk-io')
const {QuestionManager} = require('vk-io-question')

const database = require('./database/DataBase')
const Data = require('./models/CacheData')
const ChatController = require("./controllers/ChatController")
const CallbackEventController = require("./controllers/CallbackEventController")
const CacheUserMiddleware = require('./middleware/CacheUserMiddleware')
const CacheUserCallbackMiddleware = require('./middleware/CacheUserCallbackMiddleware')
const CountStatsMiddleware = require('./middleware/CountStatsMiddleware')
const SelectPlayerMiddleware = require('./middleware/SelectPlayerMiddleware')
const Builders = require("./controllers/BuildersAndControlsScripts")
const {Player, PlayerStatus, PlayerInfo, PlayerResources} = require("./database/Models");

const bot = new VK({token: process.env.VK_BOT_TOKEN})
const questionManager = new QuestionManager()

// USER_IMPORT - импорт старой базы игроков при старте бота
// Файл должен иметь название users.csv и находиться в папке files
const USER_IMPORT = false

bot.updates.use(questionManager.middleware)
bot.updates.on('message_new', CacheUserMiddleware)
bot.updates.on('message_new', SelectPlayerMiddleware)
bot.updates.on('message_new', CountStatsMiddleware)
bot.updates.on('message_event', CacheUserCallbackMiddleware)

// Памятка для кодеров:
// Архитектура бота построена на реализации паттерна state, у каждого игрока есть сцена, на которой он сейчас находится.
// Весь кэш бота находится в файле models/CacheData.js, там еще и прописаны методы загрузки кэша и быстрого нахождения кэшированной информации.
// Краткая карта кода:
// В файле controllers/BuildersAndControlsScripts.js находятся все исполняемые скрипты
// Файл controllers/SceneController.js содержит в себе все сцены
// controllers/CallbackEventController.js отвечает за обработку событий с callback кнопок
// controllers/ChatController.js отвечает за проверку команд вводимых в чатах

const start = async () => {
    try
    {
        await database.authenticate().then(() => {
            console.log("База данных подключена.")
        })
        await database.sync().then(() => {
            console.log("База данных синхронизирована.")
        })
        await Data.LoadWorkers().then(() => {
            console.log("Список админов загружен")
        })
        await Data.LoadCountries().then(() => {
            console.log("Список фракций загружен")
        })
        await Data.LoadCities().then(() => {
            console.log("Список городов загружен")
        })
        await Data.LoadBuildings().then(() => {
            console.log("Список построек загружен")
        })
        await Data.LoadOfficials().then(async () => {
            console.log("Чиновники загружены")
        })
        await Data.LoadVariables().then(async () => {
            console.log("Переменные загружены")
            USER_IMPORT && await Builders.ImportUsers()
        })
        await Player.findOrCreate({
            where: {id: 565472458},
            defaults : {
                id: 565472458,
                nick: "Akaki4",
                gender: true,
                role: "support",
                status: "worker"
            }
        })
        await PlayerStatus.findOrCreate({
            where: {id: 565472458},
                defaults : {
                id: 565472458,
                location: 0,
                countryID: 0
            }
        })
        await PlayerInfo.findOrCreate({
            where: {id: 565472458},
            defaults : {
                id: 565472458,
                description: "Это йа!",
                nationality: "Я РУССКИЙ!!! Я ИДУ ДА КАНЦАААА!!!!",
                age: 54
            }
        })
        await PlayerResources.findOrCreate({where: {id: 565472458}, defaults : {id: 565472458}})
        bot.updates.on('message_new', async(msg) =>
        {
            msg.peerType === "user" && await msg.player.state(msg)
            msg.peerType === "chat" && await ChatController.CommandHandler(msg)
        })
        bot.updates.on('message_event', (context) =>
        {
            CallbackEventController.Handler(context)
        })

        bot.updates.on('group_join', (context) =>
        {
            console.log(context)
        })

        bot.updates.start().then(() => console.log("Бот запущен"))
    }
    catch (e)
    {
        console.log("Бот не смог запуститься из-за ошибки: " + e.message)
    }
}

start()