const {Player, PlayerStatus, PlayerInfo, PlayerResources, Ban, LastWills} = require("../database/Models");
const Data = require("../models/CacheData");
const User = require("../models/User");
const keyboard = require("../variables/Keyboards");
const commands = require("../variables/Commands");
const SceneManager = require("../controllers/SceneController")
const Builders = require("../controllers/BuildersAndControlsScripts")
const api = require("./API")

module.exports = async (context, next) =>
{
    try
    {
        context.command = context.text?.toLowerCase()
        const peerId = context.peerType === "chat" ? context.senderId : context.peerId
        if(context.peerType === "chat")
        {
            if(Data.countryChats[context.peerId] && peerId > 0)
            {
                Data.countries[Data.countryChats[context.peerId]].active++
            }
        }
        if(Data.users[peerId] && !Data.users[peerId]?.isBanned)
        {
            context.player = Data.users[peerId]
            if(Data.officials[context.player.countryID])
            {
                if (Data.officials[context.player.countryID][peerId])
                {
                    context.official = Data.officials[context.player.countryID][peerId]
                }
            }
            if(!context.player.HasEffect("bot_ignore"))
            {
                return next()
            }
        }
        else
        {
            const user = await Player.findOne({where: {id: peerId}})
            if(user)
            {
                if(!user.dataValues.isBanned)
                {
                    const status = await PlayerStatus.findOne({where: {id: peerId}})
                    const info = await PlayerInfo.findOne({where: {id: peerId}})
                    const resources = await PlayerResources.findOne({where: {id: peerId}})
                    Data.users[peerId] = new User(user, status, info, resources)
                    Data.users[peerId].state = SceneManager.StartScreen
                    context.player = Data.users[peerId]
                    context.player.lastWill = await LastWills.findOne({where: {userID: context.player.id}})?.dataValues
                    if(Data.officials[context.player.countryID])
                    {
                        if (Data.officials[context.player.countryID][peerId])
                        {
                            context.official = Data.officials[context.player.countryID][peerId]
                        }
                    }
                    return next()
                }
                else
                {
                    const ban = await Ban.findOne({where: {userID: peerId}})
                    if(context.peerType === "chat")
                    {
                        await context.reply(`🚫 Вы были забанены по причине: ${ban?.dataValues.reason}`)
                        await api.KickUser(context.peerId, peerId)
                    }
                    else
                    {
                        await context.send(`🚫Внимание!🚫\n\nВы были забанены в проекте *public218388422 («ZEUS - Вселенная игроков»)\nБан по причине: ${ban?.dataValues.reason}\nЕсли вы не согласны с блокировкой - напишите одному из админов:\n${Data.GiveAdminList()}`, {
                            keyboard: keyboard.none
                        })
                    }
                }

            }
            else if(context.peerType !== "chat")
            {
                const current_keyboard = [[keyboard.registrationButton]]
                if(context.command?.match(commands.registration))
                {
                    await Builders.Registration(context, current_keyboard, {
                        StartMenu: SceneManager.StartScreen,
                        StartMenuKeyboard: SceneManager.GetStartMenuKeyboard,
                        User: User
                    })
                }
                else if(context.peerType === "user")
                {
                    context.send(`Добро пожаловать в Проект ZEUS, более тысячи участников уже два года играют с нами.\nВойны, интриги, симулятор античного жителя, всё это доступно для тебя... осталось только зарегистрироваться!\nПосле регистрации вам будет доступно меню игрока... \nС изменением вашего статуса будут меняться и ваши возможности.\nНажимая на кнопку "Зарегистрироваться" вы принимаете правила проекта.`,
                        {
                            keyboard: keyboard.build(current_keyboard)
                        })
                }
            }
        }
    }
    catch (e)
    {
        console.log(e)
    }
}