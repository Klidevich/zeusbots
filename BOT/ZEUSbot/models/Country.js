const {Player, City, PlayerStatus} = require("../database/Models");

class CountryObject
{
    constructor(country, resources)
    {
        this.id = country.dataValues.id
        this.name = country.dataValues.name
        this.description = country.dataValues.description
        this.groupID = country.dataValues.groupID
        this.photoURL = country.dataValues.photoURL
        this.welcomePhotoURL = country.dataValues.welcomePhotoURL
        this.leaderID = country.dataValues.leaderID
        this.parliamentID = country.dataValues.parliamentID
        this.governmentForm = country.dataValues.governmentForm
        this.resources = country.dataValues.resources
        this.capitalID = country.dataValues.capitalID
        this.citizenTax = country.dataValues.citizenTax
        this.nonCitizenTax = country.dataValues.nonCitizenTax
        this.entranceFee = country.dataValues.entranceFee
        this.tax = country.dataValues.tax
        this.roadMap = country.dataValues.map
        this.isSiege = country.dataValues.isSiege
        this.isUnderSanctions = country.dataValues.isUnderSanctions
        this.notifications = country.dataValues.notifications
        this.chatID = country.dataValues.chatID
        this.rating = country.dataValues.rating
        this.warnings = country.dataValues.warnings
        this.money = resources.dataValues.money
        this.stone = resources.dataValues.stone
        this.wood = resources.dataValues.wood
        this.wheat = resources.dataValues.wheat
        this.iron = resources.dataValues.iron
        this.copper = resources.dataValues.copper
        this.silver = resources.dataValues.silver
        this.diamond = resources.dataValues.diamond
        this.lastTaxTime = new Date()
        this.active = 0
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
        return `Бюджет фракции *public${this.groupID}(${this.name}):\n\n💰 Монеты - ${this.money}\n🪨 Камень - ${this.stone}\n🌾 Зерно - ${this.wheat}\n🪵 Дерево - ${this.wood}\n🌑 Железо - ${this.iron}\n🥉 Бронза - ${this.copper}\n🥈 Серебро - ${this.silver}\n💎 Алмазы - ${this.diamond}`
    }

    async GetAllInfo()
    {
        const leader = await Player.findOne({where: {id: this.leaderID}})
        const population = await PlayerStatus.count({where: {citizenship: this.id}})
        const cityCount = await City.count({where: {countryID: this.id}})
        return `Фракция: *public${this.groupID}(${this.name}):\n\n👑Правитель: ${leader ? `*id${leader?.dataValues.id}(${leader?.dataValues.nick})` : "Не назначен"}\n🪪Описание: ${this.description}\n👨‍👩‍👧‍👦Население: ${population}\n🏙Количество городов: ${cityCount}\n💲Налог для граждан: ${this.citizenTax}%\n💲Налог для приезжих: ${this.nonCitizenTax}%\n💵Въездная пошлина: 🪙${this.entranceFee} монет`
    }

    GetName()
    {
        return `*public${this.groupID}(${this.name})`
    }
}

module.exports = CountryObject