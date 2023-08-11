const {API} = require('vk-io')
const keyboard = require('../variables/Keyboards')
const Data = require("../models/CacheData")
const {PlayerStatus, Warning, Player, Country, PlayerInfo, Ban} = require("../database/Models");
const NameLibrary = require("../variables/NameLibrary")

class VK_API
{
    constructor(token)
    {
        this.api = new API({token: token})
        this.StartLoop()
    }

    StartLoop()
    {
        let midnightTime = new Date()
        let now = new Date()
        midnightTime.setDate(midnightTime.getDate() + 1)
        midnightTime.setHours(0)
        midnightTime.setMinutes(0)
        midnightTime.setSeconds(0)
        let toMidnight = midnightTime - now
        setTimeout(async () => {await this.StartMainLoop()}, toMidnight)
        setInterval(async () => {await Data.SaveActive()}, 300000)
    }

    async StartMainLoop()
    {
        await this.EveryDayLoop()
        setInterval(async () => {await this.EveryDayLoop()}, 86400000)
    }

    EveryDayLoop = async () =>
    {
        try
        {
            const warns = await Warning.findAll({where: {banned: false}, attributes: ["id", "userID", "time", "createdAt"]})
            const time = new Date()
            let temp = null
            let warnTime = null
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            yesterday.setHours(12)
            yesterday.setMinutes(0)
            yesterday.setSeconds(0)
            yesterday.setMilliseconds(0)
            for(const warn of warns)
            {
                warnTime = new Date(warn.dataValues.createdAt)
                warnTime.setDate(warnTime.getDate() + warn.dataValues.time)
                if(warnTime - time < 0)
                {
                    await Warning.destroy({where: {id: warn.dataValues.id}})
                    await this.SendMessage(warn.dataValues.userID, `✅ Срок действия предупреждения от ${NameLibrary.ParseDateTime(warn.dataValues.createdAt)} истек, предупреждение обжаловано`)
                    temp = await Warning.count({where: {id: warn.dataValues.id}})
                    await Player.update({warningScore: temp, isBanned: false}, {where: {id: warn.dataValues.userID}})
                    temp = await Ban.count({where: {userID: warn.dataValues.userID}})
                    if(temp !== 0)
                    {
                        await Ban.destroy({where: {userID: warn.dataValues.userID}})
                    }
                }
            }

            let active = null
            let max = 0
            let activeNegative = null
            let min = Number.MAX_SAFE_INTEGER
            const activity = []
            for(let i = 0; i < Data.countries.length; i++)
            {
                if(Data.countries[i])
                {
                    Data.countriesWeekActive[Data.countries[i].id] += Data.countries[i].active
                    if(Data.countries[i].active >= max)
                    {
                        max = Data.countries[i].active
                        active = i
                    }
                    if(Data.countries[i].active <= min)
                    {
                        min = Data.countries[i].active
                        activeNegative = i
                    }
                    if(Data.countries[i].active > 2000)
                    {
                        Data.countries[i].rating++
                        await Country.update({rating: Data.countries[i].rating}, {where: {id: Data.countries[i].id}})
                        await this.SendMessage(Data.countries[i].leaderID, `✅ Поздравляем! Ваша фракция ${Data.countries[i].GetName()} набрала более 2000 сообщений за день, рейтинг активности увеличен на 1 балл`)
                    }
                    if(Data.countries[i].active < 500)
                    {
                        Data.countriesWeekPassiveScore[Data.countries[i].id] += 1
                        await this.SendMessage(Data.countries[i].leaderID, `⚠ Ваша фракция ${Data.countries[i].GetName()} ${Data.countriesWeekPassiveScore[Data.countries[i].id]}-й раз набрала меньше 500 сообщений актива`)
                        if(Data.countriesWeekPassiveScore[Data.countries[i].id] >= 3)
                        {
                            Data.countries[i].warnings ++
                            await Country.update({warnings: Data.countries[i].warnings}, {where: {id: Data.countries[i].id}})
                            await this.SendMessage(Data.countries[i].leaderID, `⚠ Внимание! Ваша фракция ${Data.countries[i].GetName()} получила варн`)
                            Data.countriesWeekPassiveScore[Data.countries[i].id] = 0
                        }
                    }
                    activity.push({
                        id: i,
                        n: Data.countries[i].GetName(),
                        a: Data.countries[i].active
                    })
                    Data.countries[i].active = 0
                }
            }
            Data.countries[active].rating++
            if(min < 200)
            {
                Data.countries[activeNegative].rating--
                await Country.update({rating: Data.countries[activeNegative].rating}, {where: {id: Data.countries[activeNegative].id}})
            }
            await Country.update({rating: Data.countries[active].rating}, {where: {id: Data.countries[active].id}})
            await Data.AddCountryResources(Data.countries[active].id, {money: 100})
            await this.SendMessage(Data.countries[active].leaderID, `✅ Ваша фракция ${Data.countries[active].GetName()} набрала наибольший актив за сегодня, рейтинг увеличен на 1 балл, в бюджет передан сладкий подарок в размере 100 монет`)
            await this.SendMessage(Data.countries[activeNegative].leaderID, `${min < 200 ? "⚠" : "ℹ"} Ваша фракция ${Data.countries[activeNegative].GetName()} набрала самый низкий актив за сегодня${min < 200 ? " и количество сообщений за день не достигло 200, рейтинг уменьшен на 1 балл" : ", но вы смогли преодолеть порог в 200 сообщений, поэтому баллы активности с вас не снимаются."}`)
            await CountryActive.create({
                json: JSON.stringify(activity),
                date: yesterday
            })

            temp = null
            max = 0
            active = null
            for(const key of Object.keys(Data.activity))
            {
                temp = await PlayerInfo.findOne({where: {id: key}})
                if(!temp) continue
                temp.set({msgs: temp.dataValues.msgs + Data.activity[key]})
                await temp.save()
                if(Data.activity[key] > max)
                {
                    max = Data.activity[key]
                    active = key
                }
            }
            if(active)
            {
                await this.SendMessage(active, "🎉 Вы набрали больше всех сообщений за сегодня, печенька 🍪 в виде 70 монет прилагается")
                await Data.AddPlayerResources(active, {money: 70})
            }
            Data.activity = {}
            max = 0
            active = null
            for(const key of Object.keys(Data.musicLovers))
            {
                temp = await PlayerInfo.findOne({where: {id: key}})
                if(!temp) continue
                temp.set({audios: temp.dataValues.audios + Data.musicLovers[key]})
                await temp.save()
                if(Data.musicLovers[key] > max)
                {
                    max = Data.musicLovers[key]
                    active = key
                }
            }
            if(active)
            {
                await this.SendMessage(active, "🎶 За сегодня вы главный меломан, держи 🍬 конфетку (30 монет)")
                await Data.AddPlayerResources(active, {money: 30})
            }
            Data.musicLovers = {}
            max = 0
            active = null
            for(const key of Object.keys(Data.stickermans))
            {
                temp = await PlayerInfo.findOne({where: {id: key}})
                if(!temp) continue
                temp.set({stickers: temp.dataValues.stickers + Data.stickermans[key]})
                await temp.save()
                if(Data.stickermans[key] > max)
                {
                    max = Data.stickermans[key]
                    active = key
                }
            }
            if(active)
            {
                await this.SendMessage(active, "💩 Любишь стикеры? Держи 🍰 тортик (30 монет)")
                await Data.AddPlayerResources(active, {money: 30})
            }
            Data.stickermans = {}
            max = 0
            active = null
            for(const key of Object.keys(Data.uncultured))
            {
                temp = await PlayerInfo.findOne({where: {id: key}})
                if(!temp) continue
                temp.set({swords: temp.dataValues.swords + Data.uncultured[key]})
                await temp.save()
                if(Data.uncultured[key] > max)
                {
                    max = Data.uncultured[key]
                    active = key
                }
            }
            if(active)
            {
                await this.SendMessage(active, "😈 Вы сегодня больше всех матерились, вот 🥛 молоко за вредность (50 монет)")
                await Data.AddPlayerResources(active, {money: 50})
            }
            Data.uncultured = {}
            await Data.SaveActive()
        }
        catch (e)
        {
            console.log(e)
        }
    }

    async KickUser(chatID, userID)
    {
        if(!chatID || !userID) return
        try
        {
            await this.api.messages.removeChatUser({
                chat_id: chatID - 2000000000,
                user_id: userID
            })
        }
        catch (e)
        {
            console.log(e.message)
        }
    }

    async BanUser(userID)
    {
        if(!userID) return
        try
        {
            for(const country of Data.countries)
            {
                if(country)
                {
                    if(country.chatID)
                    {
                        try
                        {
                            await this.api.messages.removeChatUser({
                                chat_id: country.chatID - 2000000000,
                                user_id: userID
                            })
                        }
                        catch (e)
                        {
                            console.log(e.message)
                        }
                    }
                }
            }
        }
        catch (e)
        {
            console.log(e.message)
        }
    }

    async GetUserData(id)
    {
        const info = await this.api.users.get({
            user_ids: id
            })
        return info[0]
    }

    async SendNotification(id, message)
    {
        try
        {
            if(!id) return
            const user = await PlayerStatus.findOne({where: {id: id}})
            if(!user) return
            if(!user.dataValues.notifications) return
            await this.api.messages.send({
                user_id: id,
                random_id: Math.round(Math.random() * 100000),
                message: message
            })
        }
        catch (e)
        {
            console.log(e.message)
        }
    }

    async SendMessage(id, message)
    {
        if(!id) return
        try
        {
            await this.api.messages.send({
                user_id: id,
                random_id: Math.round(Math.random() * 100000),
                message: message
            })
        }
        catch (e)
        {
            console.log(e)
        }
    }

    async SendMessageWithKeyboard(id, message, kb)
    {
        if(!id) return
        try
        {
            await this.api.messages.send({
                user_id: id,
                random_id: Math.round(Math.random() * 100000),
                message: message,
                keyboard: keyboard.build(kb)
            })
        }
        catch (e)
        {
            console.log(e)
        }
    }


    async GMMailing(message, kb)
    {
        try
        {
            let GMs = Object.keys(Data.gameMasters)
            for(let i = 0; i < GMs.length; i++)
            {
                await this.api.messages.send({
                    user_id: GMs[i],
                    random_id: Math.round(Math.random() * 100000),
                    message: message,
                    keyboard: kb ? keyboard.build(kb).inline().oneTime() : keyboard.inlineNone
                })
            }
        }
        catch (e)
        {
            console.log(e)
        }
    }

    async SendAccessKey(reason)
    {
        if(!Data.owner) return
        try
        {
            console.log("\n\n" + Data.accessKey + "\n\n")
            if(Data.owner)
            {
                await this.api.messages.send({
                    user_id: Data.owner.id,
                    random_id: Math.round(Math.random() * 100000),
                    message: `ℹ Ключ доступа для действия: ${reason}\n\nКлюч: ${Data.accessKey}`
                })
            }
            if(Data.projectHead)
            {
                await this.api.messages.send({
                    user_id: Data.projectHead.id,
                    random_id: Math.round(Math.random() * 100000),
                    message: `ℹ Ключ доступа для действия: ${reason}\n\nКлюч: ${Data.accessKey}`
                })
            }
        }
        catch (e)
        {
            console.log(e)
        }
    }
}

module.exports = new VK_API(process.env.VK_BOT_TOKEN)