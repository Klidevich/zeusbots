const {Player, Country, City, CityResources, CountryResources, PlayerResources, OfficialInfo, Buildings, PlayerStatus} = require("../database/Models")
const fs = require("fs")
const Building = require("../models/Building")
const CityObject = require("../models/City")
const CountryObject = require("../models/Country")

class CacheData
{
    constructor()
    {
        this.owner = null            //Владелец
        this.projectHead = null      //Глава проекта
        this.supports = {}           //Тех-поддержка
        this.administrators = {}     //Администраторы
        this.gameMasters = {}        //ГМы
        this.moderators = {}         //Модераторы

        this.users = {}              //Кэш пользователей
        this.cities = []             //Список городов
        this.countries = []          //Список государств
        this.buildings = {}          // и т.д., я устал писать, слишком много пробелов
        this.officials = {}
        this.variables = null
        this.activity = {}
        this.uncultured = {}
        this.stickermans = {}
        this.musicLovers = {}
        this.countryChats = {}

        this.accessKey = this.GenerateString(8)
        this.StartLoop()
    }

    StartLoop()
    {
        setInterval(() => {
            this.accessKey = this.GenerateString(8)
        }, 21600000)
    }

    GenerateString(length)
    {
        const lib = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let request = ""
        for(let i = 0; i < length; i++)
        {
            request += lib[Math.round(Math.random() * (lib.length - 1))]
        }
        return request
    }

    async PlayersAreNearby(firID, secID)
    {
        let firstLocation = null
        let secondLocation = null
        if(this.users[firID])
        {
            firstLocation = parseInt(this.users[firID].location)
        }
        else
        {
            const fUser = await PlayerStatus.findOne({where: {id: firID}})
            if(!fUser) return false
            firstLocation = parseInt(fUser.dataValues.location)
        }
        if(this.users[secID])
        {
            secondLocation = parseInt(this.users[secID].location)
        }
        else
        {
            const sUser = await PlayerStatus.findOne({where: {id: secID}})
            if(!sUser) return false
            secondLocation = parseInt(sUser.dataValues.location)
        }
        return firstLocation === secondLocation
    }



    GetCountryButtons()
    {
        const buttons = []
        this.countries.forEach((key) => {
            if(key)
            {
                buttons.push([key.name, "ID" + key.id])
            }
        })
        return buttons
    }

    GetCountryCities(countryID)
    {
        const cities = []
        this.cities.forEach((key) => {
            if(key)
            {
                if(key.countryID === countryID)
                {
                    cities.push(key)
                }
            }
        })
        return cities
    }

    GetCityForCountryButtons(countryID)
    {
        const buttons = []
        this.cities.forEach((key) => {
            if(key)
            {
                if(key.countryID === countryID)
                {
                    buttons.push([key.name, "ID" + key.id])
                }
            }
        })
        return buttons
    }

    GetCityButtons()
    {
        const buttons = []
        for(const city of this.cities)
        {
            if(city)
            {
                buttons.push([city.name, "ID" + city.id])
            }
        }
        return buttons
    }

    async GetUserStatus(id)
    {
        for(let i = 0; i < this.countries; i++)
        {
            if(this.countries[i]?.leaderID === id)
            {
                return "leader"
            }
        }
        for(const key of Object.keys(this.officials))
        {
            if(this.officials[key])
            {
                for(const j of Object.keys(this.officials[key]))
                {
                    if(parseInt(j) === id)
                    {
                        return "official"
                    }
                }
            }
        }
        const status = await PlayerStatus.findOne({where: {id: id}})
        if(status?.dataValues.citizenship)
        {
            return "citizen"
        }
        return "stateless"
    }

    GetCity(id)
    {
        return this.cities[id]
    }

    GetCountryName(id)
    {
        return `*public${this.countries[id]?.groupID}(${this.countries[id]?.name})`
    }

    GetCityName(id)
    {
        return this.cities[id]?.name
    }

    GetCityInfo(id)
    {
        return `Город ${this.cities[id]?.name} в фракции ${this.GetCountryName(this.cities[id]?.countryID)}`
    }

    GetCountryForCity(id)
    {
        return this.countries[this.cities[id]?.countryID]
    }

    ParseButtonID(id)
    {
        return parseInt(id.replace("ID", ""))
    }

    GiveAdminList()
    {
        let request = ""
        if (this.owner) request += `*id${this.owner.id}(${this.owner.nick})\n`
        if (this.projectHead) request += `*id${this.projectHead.id}(${this.projectHead.nick})\n`
        if(Object.keys(this.supports).length !== 0)
        {
            for (const key of Object.keys(this.supports))
            {
                request += `*id${this.supports[key].id}(${this.supports[key].nick})\n`
            }
        }
        if(Object.keys(this.administrators).length !== 0)
        {
            for (const key of Object.keys(this.administrators))
            {
                request += `*id${this.administrators[key].id}(${this.administrators[key].nick})\n`
            }
        }
        return request
    }

    async LoadWorkers ()
    {
        //Очистка
        this.owner = null
        this.projectHead = null
        this.supports = {}
        this.administrators = {}
        this.gameMasters = {}
        this.moderators = {}

        //Загрузка с базы данных
        return new Promise(async (resolve) => {
            const owner = await Player.findOne({where: {role: "owner"}})
            this.owner = owner?.dataValues
            const projectHead = await Player.findOne({where: {role: "project_head"}})
            this.projectHead = projectHead?.dataValues
            const supports = await Player.findAll({where: {role: "support"}})
            supports.forEach(key => {
                this.supports[key.dataValues.id] = key.dataValues
            })
            const administrators = await Player.findAll({where: {role: "admin"}})
            administrators.forEach(key => {
                this.administrators[key.dataValues.id] = key.dataValues
            })
            const gameMasters = await Player.findAll({where: {role: "GM"}})
            gameMasters.forEach(key => {
                this.gameMasters[key.dataValues.id] = key.dataValues
            })
            const moderators = await Player.findAll({where: {role: "moder"}})
            moderators.forEach(key => {
                this.moderators[key.dataValues.id] = key.dataValues
            })
            return resolve()
        })
    }

    async LoadCountries()
    {
        this.countries = []
        return new Promise(async (resolve) => {
            const countries = await Country.findAll()
            let temp = null
            for (const key of countries)
            {
                if(key)
                {
                    let res = await CountryResources.findOne({where: {id: key.dataValues.id}})
                    this.countries[key.dataValues.id] = new CountryObject(key, res)
                    if(key.chatID)
                    {
                        temp = key.chatID.split("|")
                        for(const chat of temp)
                        {
                            this.countryChats[chat] = key.id
                        }
                    }
                }
            }
            fs.access("./files/active.json", (error) => {
                if(error)
                {
                    this.SaveActive()
                }
                else
                {
                    const active = require("../files/active.json")
                    for(const country of this.countries)
                    {
                        if(country)
                        {
                            country.active = active[country.id] ? active[country.id] : 0
                        }
                    }
                }
                this.SaveActive()
            })
            return resolve()
        })
    }

    async SaveActive()
    {
        return new Promise((resolve) => {
            let active = {}
            for(const country of this.countries)
            {
                if(country)
                {
                    active[country.id] = country.active
                }
            }
            const serialize = JSON.stringify(active, null, "\t")
            fs.writeFile("./files/active.json", serialize, (e) => {
                if(e) console.log(e)
                return resolve()
            })
        })
    }

    async LoadOfficials()
    {
        this.officials = {}
        return new Promise(async (resolve) => {
            const officials = await OfficialInfo.findAll()
            for(let i = 0; i < officials.length; i++)
            {
                if(!this.officials[officials[i].dataValues.countryID]) this.officials[officials[i].dataValues.countryID] = {}
                this.officials[officials[i].dataValues.countryID][officials[i].dataValues.id] = officials[i].dataValues
            }
            return resolve()
        })
    }

    async LoadCities()
    {
        this.cities = []
        return new Promise(async (resolve) => {
            const cities = await City.findAll()
            for (const key of cities)
            {
                if(key)
                {
                    let res = await CityResources.findOne({where: {id: key.dataValues.id}})
                    this.cities[key.dataValues.id] = new CityObject(key, res)
                }
            }
            return resolve()
        })
    }

    async LoadBuildings()
    {
        this.buildings = {}
        return new Promise(async (resolve) =>
        {
            const buildings = await Buildings.findAll()
            for(let i = 0; i < buildings.length; i++)
            {
                if(!buildings[i].dataValues.freezing)
                {
                    if(this.buildings[buildings[i].dataValues.cityID])
                    {
                        this.buildings[buildings[i].dataValues.cityID].push(new Building(buildings[i]))
                    }
                    else
                    {
                        this.buildings[buildings[i].dataValues.cityID] = []
                        this.buildings[buildings[i].dataValues.cityID].push(new Building(buildings[i]))
                    }
                }

            }
            return resolve()
        })
    }

    async LoadVariables()
    {
        return new Promise((resolve) => {
            this.variables = require("../files/settings.json")
            return resolve()
        })
    }

    async SaveVariables()
    {
        return new Promise((resolve) => {
            const serialize = JSON.stringify(this.variables)
            fs.writeFile("./files/settings.json", serialize, (e) => {
                if(e) console.log(e)
                return resolve()
            })
        })
    }

    async AddCityResources(id, res)
    {
        if(!id || !res) throw new Error("ID or Resources is not exist");
        let resources = await CityResources.findOne({where: {id: id}})
        let obj = {}
        for(const key of Object.keys(res))
        {
            if(this.cities[id])
            {
                this.cities[id][key] = resources.dataValues[key] + res[key]
            }
            obj[key] = resources.dataValues[key] + res[key]
        }
        await CityResources.update(obj, {where: {id: id}})
    }

    async AddCountryResources(id, res)
    {
        if(!id || !res) throw new Error("ID or Resources is not exist");
        let resources = await CountryResources.findOne({where: {id: id}})
        let obj = {}
        for(const key of Object.keys(res))
        {
            if(this.countries[id])
            {
                this.countries[id][key] = resources.dataValues[key] + res[key]
            }
            obj[key] = resources.dataValues[key] + res[key]
        }
        await CountryResources.update(obj, {where: {id: id}})
    }

    async AddPlayerResources(id, res)
    {
        if(!id || !res) throw new Error("ID or Resources is not exist");
        let resources = await PlayerResources.findOne({where: {id: id}})
        let obj = {}
        for(const key of Object.keys(res))
        {
            if(this.users[id])
            {
                this.users[id][key] = resources.dataValues[key] + res[key]
            }
            obj[key] = resources.dataValues[key] + res[key]
        }
        await PlayerResources.update(obj, {where: {id: id}})
    }
}

module.exports = new CacheData()