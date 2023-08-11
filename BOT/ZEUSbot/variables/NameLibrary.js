const {Player, PlayerStatus, PlayerInfo, PlayerResources} = require("../database/Models")
const Data = require("../models/CacheData")
const Samples = require("./Samples")
class NameLibrary
{
    GetChance(chance)
    {
        chance = Math.min(chance, 100)
        return Math.random() * 100 < chance
    }

    GetRandomNumb(min, max)
    {
        return Math.round(min + Math.round(Math.random() * (max - min)))
    }

    GetDate()
    {
        const date = new Date()
        const mm = date.getMonth() + 1
        const dd = date.getDate()
        return [
            (dd>9 ? '' : '0') + dd,
            (mm>9 ? '' : '0') + mm,
            date.getFullYear()
        ].join('.')
    }

    GetTime()
    {
        const date = new Date()
        const hh = date.getHours()
        const mm = date.getMinutes()
        return [
            (hh>9 ? '' : '0') + hh,
            (mm>9 ? '' : '0') + mm
        ].join('.')
    }

    ParseDateTime(date)
    {
        const time = new Date(date)
        const month = time.getMonth() + 1
        const day = time.getDate()
        const hour = time.getHours()
        const minute = time.getMinutes()
        return [
            [
                (day>9 ? '' : '0') + day,
                (month>9 ? '' : '0') + month,
                time.getFullYear()
            ].join('.'),
            [
                (hour>9 ? '' : '0') + hour,
                (minute>9 ? '' : '0') + minute
            ].join(':')
        ].join(' ')
    }

    GetRandomSample(sample)
    {
        let samples = Samples[sample]
        return samples[this.GetRandomNumb(0, samples.length - 1)]
    }

    ParseFutureTime(future)
    {
        const time = new Date()
        let request = ""
        let differance = future - time
        let weeks = Math.trunc(differance / 604800000)
        if(weeks > 0)
        {
            request += weeks + "н "
            differance -= weeks * 604800000
        }
        let days = Math.trunc(differance / 86400000)
        if(days > 0)
        {
            request += days + "д "
            differance -= days * 86400000
        }
        let hours = Math.trunc(differance / 3600000)
        if(hours > 0)
        {
            request += hours + "ч "
            differance -= hours * 3600000
        }
        let minutes = Math.trunc(differance / 60000)
        if(minutes > 0)
        {
            request += minutes + "м "
            differance -= minutes * 60000
        }
        let seconds = Math.trunc(differance / 1000)
        if(seconds > 0)
        {
            request += seconds + "с "
        }
        return request
    }

    GetGender(sex)
    {
        return sex ? "Мужской" : "Женский"
    }

    RoleEstimator(role)
    {
        switch (role)
        {
            case "player":
                return 0
            case "moder":
                return 1
            case "GM":
                return 2
            case "admin":
                return 3
            case "support":
                return 4
            case "project_head":
                return 5
            case "owner":
                return 6
        }
    }

    GetEffectName(effect)
    {
        switch (effect)
        {
            case "block_moving":
                return "🔗 Кандалы"
            case "block_transfer":
                return "⛔ Блокировка счета"
            case "block_extracting":
                return "😳 Усталость"
            case "bot_ignore":
                return "🤐 Проклятие игнора"
            case "luck":
                return "🍀 Удача"
            case "industriousness":
                return "💪 Трудолюбие"
        }
        return "Неизвестный эффект, обратитесь в тех поддержку."
    }

    GetResourceName(res)
    {
        switch(res)
        {
            case "money":
                return "💰 Монеты"
            case "wheat":
                return "🌾 Зерно"
            case "wood":
                return "🪵 Древесина"
            case "stone":
                return "🪨 Камень"
            case "iron":
                return "🌑 Железо"
            case "copper":
                return "🥉 Бронза"
            case "silver":
                return "🥈 Серебро"
            case "diamond":
                return "💎 Алмазы"
        }
        return res
    }

    GetPrice(price)
    {
        const resources = Object.keys(price)
        let request = ""
        for(let i = 0; i < resources.length; i++)
        {
            request += this.GetResourceName(resources[i]) + " : " + Math.abs(price[resources[i]]) + "\n"
        }
        return request
    }

    ReversePrice(price)
    {
        let newPrice = {}
        Object.keys(price).forEach(key => {
            newPrice[key] = price[key] * -1
        })
        return newPrice
    }

    GetRoleName(role)
    {
        switch (role)
        {
            case "player":
                return "😸 Игрок"
            case "moder":
                return "🪄 Модератор"
            case "GM":
                return "🕹 Гейм-мастер"
            case "admin":
                return "🐓 Администратор"
            case "support":
                return "🔧 Тех-поддержка"
            case "project_head":
                return "🤴 Глава проекта"
            case "owner":
                return "🔝 Владелец"
        }
        return "Не указано"
    }

    GetStatusName(status)
    {
        switch (status)
        {
            case "stateless":
                return "🫴 Апатрид"
            case "candidate":
                return "Кандидат на гражданство"
            case "citizen":
                return "💳 Гражданин"
            case "official":
                return "🧐 Чиновник"
            case "leader":
                return "👑 Правитель"
            case "worker":
                return "⚙ Работник"
        }
        return "Не указано"
    }

    GetBuildingType(type)
    {
        switch (type)
        {
            case "building_of_house":
                return "🏠 Жилой дом"
            case "building_of_bank":
                return "🏦 Банк"
            case "building_of_barracks":
                return "⚔ Казарма"
            case "building_of_port":
                return "🛟 Порт"
            case "building_of_mint":
                return "🪙 Монетный двор"
            case "building_of_church":
                return "✝ Храм"
            case "building_of_wheat":
                return "🌾 Сельское хозяйство"
            case "building_of_stone":
                return "🪨 Каменоломня"
            case "building_of_wood":
                return "🪵 Лесополоса"
            case "building_of_iron":
                return "🌑 Железный рудник"
            case "building_of_silver":
                return "🥈 Серебряный рудник"
            case "building_of_monument":
                return "🗿 Памятник"
        }
        return "Новый, еще не добавленный тип"
    }
    GetBuildingEmoji(type)
    {
        switch (type)
        {
            case "building_of_house":
                return "🏠 "
            case "building_of_bank":
                return "🏦 "
            case "building_of_barracks":
                return "⚔ "
            case "building_of_port":
                return "🛟 "
            case "building_of_mint":
                return "🪙 "
            case "building_of_church":
                return "✝ "
            case "building_of_wheat":
                return "🌾 "
            case "building_of_stone":
                return "🪨 "
            case "building_of_wood":
                return "🪵 "
            case "building_of_iron":
                return "🌑 "
            case "building_of_silver":
                return "🥈 "
        }
        return ""
    }

    GetFarmRandom(type)
    {
        switch (type)
        {
            case "wheat_lvl1":
                return this.GetRandomNumb(125, 375)
            case "wheat_lvl2":
                return this.GetRandomNumb(250, 750)
            case "wheat_lvl3":
                return this.GetRandomNumb(500, 1500)
            case "wheat_lvl4":
                return this.GetRandomNumb(1000, 3000)
            case "stone_lvl1":
                return this.GetRandomNumb(125, 250)
            case "stone_lvl2":
                return this.GetRandomNumb(250, 500)
            case "stone_lvl3":
                return this.GetRandomNumb(500, 1000)
            case "stone_lvl4":
                return this.GetRandomNumb(1000, 2000)
            case "wood_lvl1":
                return this.GetRandomNumb(125, 250)
            case "wood_lvl2":
                return this.GetRandomNumb(250, 500)
            case "wood_lvl3":
                return this.GetRandomNumb(500, 1000)
            case "wood_lvl4":
                return this.GetRandomNumb(1000, 2000)
            case "iron_lvl1":
                return this.GetRandomNumb(35, 90)
            case "iron_lvl2":
                return this.GetRandomNumb(65, 185)
            case "iron_lvl3":
                return this.GetRandomNumb(130, 370)
            case "iron_lvl4":
                return this.GetRandomNumb(260, 740)
            case "silver_lvl1":
                return this.GetRandomNumb(65, 185)
            case "silver_lvl2":
                return this.GetRandomNumb(125, 375)
            case "silver_lvl3":
                return this.GetRandomNumb(250, 750)
            case "silver_lvl4":
                return this.GetRandomNumb(500, 1500)
        }
        return 0
    }

    async GetPlayerNick(id)
    {
        const user = await Player.findOne({where: {id: id}, attributes: ["id", "nick"]})
        if(!user) return "Не зарегистрирован"
        return `*id${user.dataValues.id}(${user.dataValues.nick})`
    }


    async GetFullUserInfo(id, userObject)
    {
        let request = "ℹ Полная информация об игроке:\n\n"
        if(Data.users[id])
        {
            request += Data.users[id].GetInfo() + "\n\n" + Data.users[id].GetResources()
        }
        else
        {
            const player = await Player.findOne({where: {id: id}})
            const playerStatus = await PlayerStatus.findOne({where: {id: id}})
            const playerInfo = await PlayerInfo.findOne({where: {id: id}})
            const playerResources = await PlayerResources.findOne({where: {id: id}})
            const user = new userObject(player, playerStatus, playerInfo, playerResources)
            request += user.GetInfo() + "\n\n" + user.GetResources()
        }
        return request
    }
}

module.exports = new NameLibrary()