const {Player, Country, City, PlayerStatus} = require("../database/Models");

class CityObject
{
    constructor(city, resources)
    {
        this.id = city.dataValues.id
        this.countryID = city.dataValues.countryID
        this.leaderID = city.dataValues.leaderID
        this.name = city.dataValues.name
        this.description = city.dataValues.description
        this.photoURL = city.dataValues.photoURL
        this.buildingsScore = city.dataValues.buildingsScore
        this.maxBuildings = city.dataValues.maxBuildings
        this.isSiege = city.dataValues.isSiege
        this.isUnderSanctions = city.dataValues.isUnderSanctions
        this.isCapital = city.dataValues.isCapital
        this.notifications = city.dataValues.notifications
        this.money = resources.dataValues.money
        this.stone = resources.dataValues.stone
        this.wood = resources.dataValues.wood
        this.wheat = resources.dataValues.wheat
        this.iron = resources.dataValues.iron
        this.copper = resources.dataValues.copper
        this.silver = resources.dataValues.silver
        this.diamond = resources.dataValues.diamond
    }

    CanPay(pay)
    {
        let can = true
        if(pay.money) can = can && (this.money + pay.money >= 0)
        if(pay.stone) can = can && (this.stone + pay.stone >= 0)
        if(pay.wood) can = can && (this.wood + pay.wood >= 0)
        if(pay.wheat) can = can && (this.wheat + pay.wheat >= 0)
        if(pay.iron) can = can && (this.iron + pay.iron >= 0)
        if(pay.copper) can = can && (this.copper + pay.copper >= 0)
        if(pay.silver) can = can && (this.silver + pay.silver >= 0)
        if(pay.diamond) can = can && (this.diamond + pay.diamond >= 0)
        return can
    }

    GetResources()
    {
        return `Бюджет города ${this.name}:\n\n💰 Монеты - ${this.money}\n🪨 Камень - ${this.stone}\n🌾 Зерно - ${this.wheat}\n🪵 Дерево - ${this.wood}\n🌑 Железо - ${this.iron}\n🥉 Бронза - ${this.copper}\n🥈 Серебро - ${this.silver}\n💎 Алмазы - ${this.diamond}`
    }

    async GetAllInfo()
    {
        const leader = await Player.findOne({where: {id: this.leaderID}})
        const country = await Country.findOne({where: {id: this.countryID}})
        const population = await PlayerStatus.count({where: {registration: this.id}})
        return `Город "${this.name}":\n\nФракция: *public${country.dataValues.groupID}(${country.dataValues.name})\n${this.isCapital ? "🏛Столица фракции🏛\n" : ""}Градоначальник: *id${leader.dataValues.id}(${leader.dataValues.nick})\nОписание: ${this.description}\nНаселение: ${population}\nПостроено зданий: ${this.buildingsScore} / ${this.maxBuildings}`
    }

    async Expand()
    {
        this.maxBuildings += 2
        await City.update({maxBuildings: this.maxBuildings}, {where: {id: this.id}})
    }
}

module.exports = CityObject