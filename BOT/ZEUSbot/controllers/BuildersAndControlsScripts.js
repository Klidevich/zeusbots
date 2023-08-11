const InputManager = require("./InputManager");
const OutputManager = require("./OutputManager")
const Data = require("../models/CacheData");
const keyboard = require("../variables/Keyboards");
const {City, Country, PlayerStatus, Player, Ban, LastWills, Buildings,
    CountryResources, CityResources, PlayerInfo, CountryRoads, Keys, OfficialInfo, PlayerResources, Messages, Chats,
    Warning, CityRoads
} = require("../database/Models");
const api = require("../middleware/API");
const ErrorHandler = require("../error/ErrorHandler")
const NameLibrary = require("../variables/NameLibrary")
const Prices = require("../variables/Prices")
const Nations = require("../variables/Nations")
const sequelize = require("../database/DataBase")
const upload = require("../middleware/Upload")
const Effects = require("../variables/Effects")
const User = require("../models/User")
const fs = require('fs')
const path = require("path")

class BuildersAndControlsScripts
{
    async Registration(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const peerInfo = await api.GetUserData(context.peerId)

                let name = await InputManager.InputString(context, `✍🏾 Добро пожаловать в канцелярию.\n\n*id${context.peerId} (${peerInfo.first_name}), вы хотите зарегистрироваться в проекте *public218388422 («ZEUS - Вселенная игроков»).\n\n1️⃣ Введите никнейм, которым вы будете пользоваться в будущем. Учтите, что необходимо установить античное имя, реально существовавшее в истории. Со списком таких вы можете ознакомиться ниже.\n👉🏾 Греческие имена: https://ru.m.wikipedia.org/wiki/Список_имён_греческого_происхождения\n👉🏾 Римские имена: https://ru.m.wikipedia.org/wiki/Римские_имена\n👉🏾 Персидские имена: https://ru.m.wikipedia.org/wiki/Персидские_имена`, current_keyboard,2, 20)
                if(!name) return resolve()
                let temp = await Player.findOne({where: {nick: name}})
                while(temp)
                {
                    name = await InputManager.InputString(context, `⚠ Этот ник занят`, current_keyboard, 2, 20)
                    if(!name) return resolve()
                    temp = await Player.findOne({where: {nick: name}})
                }

                const age = await InputManager.InputInteger(context, `2️⃣ Теперь укажите возраст вашего персонажа.\n⚠ Возраст может быть выбран от 16 до 100 лет.`, current_keyboard, 16, 100)
                if(age === null) return resolve()

                const gender = await InputManager.InputBoolean(context, `3️⃣ Укажите пол вашего персонажа.`, current_keyboard, keyboard.manButton, keyboard.womanButton)
                if(gender === null) return resolve()

                const description = await InputManager.InputString(context, `4️⃣ Расскажите о своём персонаже! Откуда он родом, чем занимается. Возможно есть ли у него семья, дети. С какой целью он пришёл в то место, где находится сейчас.\n⚠ Длина до 1000 символов.`, current_keyboard, 0, 1000)
                if(!description) return resolve()

                const nationKeyboard = []
                Object.keys(Nations).forEach(key => {
                    nationKeyboard.push([Nations[key].name, key])
                })
                let nation = await InputManager.KeyboardBuilder(context, "5️⃣ Какова национальность вашего персонажа?", nationKeyboard, current_keyboard)
                await context.send(Nations[nation].description)
                nation = Nations[nation].name

                let location = await InputManager.KeyboardBuilder(context, "6️⃣ Почти готово, теперь выберите в какой фракции вы хотите появиться после регистрации.", Data.GetCountryButtons(), current_keyboard)
                if(!location) return resolve()
                location = Data.ParseButtonID(location)

                await context.send(`ℹ Вы находитесь в столице фракции ${Data.countries[location].GetName()} - городе ${Data.cities[Data.countries[location].capitalID].name}\n\n${Data.countries[location].description}`, {attachment: Data.countries[location].welcomePhotoURL})
                const user = await Player.create({
                    id: context.peerId,
                    nick: name,
                    gender: gender
                })
                const status = await PlayerStatus.create({
                    id: context.peerId,
                    location: Data.countries[location].capitalID,
                    countryID: Data.countries[location].id
                })
                const info = await PlayerInfo.create({
                    id: context.peerId,
                    description: description,
                    nationality: nation,
                    age: age
                })
                const resources = await PlayerResources.create({id: context.peerId})
                Data.users[context.peerId] = new scenes.User(user, status, info, resources)
                Data.users[context.peerId].state = scenes.StartMenu
                context.player = Data.users[context.peerId]

                let kb = scenes.StartMenuKeyboard(context)

                await context.send(`🏁 Регистрация завершена, *id${context.peerId}(${name}). Радуйтесь каждому дню, проведенному в этом мире. Пусть Боги оберегают ваш путь...\n\nℹ Если вы хотите ближе познакомиться с командами и проектом, то изучите нашу группу. Для ознакомления с государствами перейдите в раздел \"Локация\", для глубинного изучения можете посетить сообщества. Выбирайте с умом!`, {
                    keyboard: keyboard.build(kb)
                })
                await OutputManager.SendCountryCarousel(context)
            }
            catch (e)
            {
                context.player = {
                    id: context.peerId,
                    nick: "Незарегистрированный пользователь"
                }
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/Registration", e)
            }
        })
    }

    async NewCountry(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let name = await InputManager.InputString(context, "1️⃣ Введите название фракции (от 2 до 30 символов):", current_keyboard, 2, 30)
                if (!name) return resolve()
                let country = await Country.count({where: {name: name}})
                while(country > 0)
                {
                    name = await InputManager.InputString(context, "⚠ Фракция с таким названием уже существует.", current_keyboard, 2,30)
                    if (!name) return resolve()
                    country = await Country.count({where: {name: name}})
                }

                const description = await InputManager.InputString(context,"2️⃣ Сделайте описание фракции. (до 1000 символов)",current_keyboard,0,1000)
                if(!description) return resolve()

                const preview = await InputManager.InputPhoto(context,`3️⃣ Отправьте фото для иллюстрации.\n⚠ Это фото используется для генерации карусели с фракциями для удобства игроков, создать фракцию без фото - нельзя.\n\n⚠⚠⚠ Требуется загрузить фото с соотношением сторон 13/8 (рекомендуемое разрешение 650x400), иначе будут ошибки с каруселью, которые могут привести к вылету\n\nБыстро изменить размер фото можно здесь: https://www.visualwatermark.com/ru/image-resizer/`, current_keyboard)
                if (!preview) return resolve()

                const welcomePhoto = await InputManager.InputPhoto(context,`4️⃣ Отправьте приветственное фото\n⚠ Это фото будет встречать новых граждан. (Фото обязательно)`, current_keyboard)
                if(!welcomePhoto) return resolve()

                let capitalName = await InputManager.InputString(context, "5️⃣ Введите название столицы (от 2 до 30 символов):", current_keyboard, 2,30)
                if (!capitalName) return resolve()

                let capital = await City.count({where: {name: capitalName}})
                while(capital > 0)
                {
                    capitalName = await InputManager.InputString(context, "⚠ Город с таким названием уже существует.", current_keyboard, 2, 30)
                    if (!capitalName) return resolve()
                    capital = await City.count({where: {name: capitalName}})
                }

                let leader = await InputManager.InputUser(context, "6️⃣ Теперь нужно указать правителя.")
                if(!leader) return resolve()
                while(leader.dataValues.status.match(/leader/))
                {
                    if(leader.dataValues.status.match(/leader/)) leader = await InputManager.InputUser(context, `⚠ *id${leader.dataValues.id}(${leader.dataValues.nick}) уже является правителем. Заберите у него статус или выберите другого игрока.`, current_keyboard)
                    if(!leader) return resolve()
                }
                let groupId = await InputManager.InputGroup(context, `7️⃣ Укажите группу этой фракции.`, current_keyboard)
                if(!groupId) return resolve()

                let resourcesKeyboard = [
                    ["🌾 Зерно", "wheat", false],
                    ["🪵 Древесина", "wood", false],
                    ["🪨 Камень", "stone", false],
                    ["🌑 Железо", "iron", false],
                    ["🥉 Бронза", "copper", false],
                    ["🥈 Серебро", "silver", false]
                ]
                let resources = await InputManager.RadioKeyboardBuilder(context, "8️⃣ Выберите ресурсы фракции:", resourcesKeyboard, current_keyboard)
                if(!resources) return resolve()
                resources = resources.filter(key => {
                    return key[1]
                }).map(key => {
                    return key[0]
                })
                let resName = ""
                 resources.forEach(key => {
                     resName += NameLibrary.GetResourceName(key) + "\n"
                })
                resources = resources.join(".")

                let accept = await InputManager.InputBoolean(context, `Итак, мы имеем следующее:\n\n📌 Название: *public${groupId}(${name})\n🏙 Столица: ${capitalName}\n👑 Правитель: *id${leader.dataValues.id}(${leader.dataValues.nick})\n\n⛏ Ресурсы для добычи:\n ${resName}\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    await context.send('🚫 Ввод отменен.', {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve()
                }

                const city = await City.create({
                    leaderID: leader.dataValues.id,
                    name: capitalName,
                    description: `Столица фракции *public${groupId}(${name})`,
                    photoURL: preview,
                    isCapital: true,
                    maxBuildings: 8
                })
                await CityResources.create({
                    id: city.dataValues.id
                })
                country = await Country.create({
                    name: name,
                    description: description,
                    photoURL: preview,
                    welcomePhotoURL: welcomePhoto,
                    leaderID: leader.dataValues.id,
                    groupID: groupId,
                    resources: resources,
                    capital: capitalName,
                    capitalID: city.dataValues.id
                })
                await CountryResources.create({id: country.dataValues.id})
                await PlayerStatus.update({
                    location: city.dataValues.id,
                    countryID: country.dataValues.id,
                    citizenship: country.dataValues.id
                }, {where: {id: leader.dataValues.id}})
                city.set({
                    countryID: country.dataValues.id,
                    capitalID: country.dataValues.id
                })
                leader.set({
                    status: leader.dataValues.status === "worker" ? "worker" : "leader"
                })
                await city.save()
                await leader.save()

                if(Data.users[leader.dataValues.id]?.status !== "worker") Data.users[leader.dataValues.id].status = "leader"
                await Data.LoadCountries()
                await Data.LoadCities()
                await Data.LoadOfficials()
                await api.SendMessage(leader.dataValues.id,`👑 Вы были назначены правителем только что созданной фракции ${name}\nВаш статус изменен на "👑 Правитель"`)
                await context.send("✅ Фракция создана!\nТеперь можно построить дороги через ГМ-меню", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/NewCountry", e)
            }
        })
    }

    async ChangeRole(context, current_keyboard, tools)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Выберите игрока.", current_keyboard)
                if (!user) return resolve()
                if(NameLibrary.RoleEstimator(context.player.role) <= NameLibrary.RoleEstimator(user.dataValues.role))
                {
                    await context.send(`🚫 Вы не имеете права изменять роль игрока *id${user.dataValues.id}(${user.dataValues.nick}).`, {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    return resolve()
                }

                let giveRoleKB = [
                    ["👶 Игрок", "player"],
                    ["🧒 Модератор", "moder"],
                    ["🧑 Гейм-мастер", "GM"]
                ]
                context.player.role.match(/owner|project_head|support/) && giveRoleKB.push(["👨‍🦳 Администратор", "admin"])
                context.player.role.match(/owner|project_head|support/) && giveRoleKB.push(["🔧 Тех-поддержка", "support"])
                context.player.role.match(/owner/) && giveRoleKB.push(["🤴 Глава проекта", "project_head"])
                let role = await InputManager.KeyboardBuilder(context, `✅ Выбран игрок *id${user.dataValues.id}(${user.dataValues.nick})\n2️⃣ Выберите новую роль.`, giveRoleKB, current_keyboard)
                if(!role) return resolve()
                const status = role === "player" ? await Data.GetUserStatus(user.dataValues.id) : "worker"
                if(role === "project_head")
                {
                    const oldPH = await Player.findOne({where: {role: "project_head"}})
                    if(oldPH)
                    {
                        oldPH.set({role: "player"})
                        await oldPH.save()
                        if(Data.users[oldPH.dataValues.id])
                        {
                            Data.users[oldPH.dataValues.id].status = await Data.GetUserStatus(oldPH.dataValues.id)
                            Data.users[oldPH.dataValues.id].role = role
                            Data.users[oldPH.dataValues.id].state = tools.StayInStartScreen
                        }
                        await api.SendMessage(oldPH.dataValues.id, "⚠ Вы были сняты с должности 🤴 Глава проекта")
                    }
                }
                user.set({role: role, status: status})
                await user.save()
                if(Data.users[user.dataValues.id])
                {
                    Data.users[user.dataValues.id].status = status
                    Data.users[user.dataValues.id].role = role
                    Data.users[user.dataValues.id].state = tools.StayInStartScreen
                }
                role = NameLibrary.GetRoleName(role)
                await api.SendMessageWithKeyboard(user.dataValues.id, `ℹ Пользователь *id${context.player.id}(${context.player.nick}) назначил вас на роль: ${role}`, tools.GetStartMenuKeyboard(context))
                await context.send(`ℹ Игрок *id${user.dataValues.id}(${user.dataValues.nick}) назначен на роль: ${role}`, {keyboard: keyboard.build(current_keyboard)})
                await Data.LoadWorkers()
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeRole", e)
            }
        })
    }

    async AppointLeader(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const buttons = Data.GetCountryButtons()
                if(buttons.length === 0)
                {
                    await context.send("⚠ Фракции не добавлены.")
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите государство", buttons, current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]

                let user = await InputManager.InputUser(context, "2️⃣ Выберите пользователя", current_keyboard)
                if(!user) return resolve()
                if(user.dataValues.status === "worker")
                {
                    context.send(`🚫 Назначать игроков со статусом ⚙ Работник на должность правителя запрещено`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let oldCountry = null
                for(let i = 0; i < Data.countries?.length; i++)
                {
                    if(Data.countries[i]?.leaderID === user.dataValues.id)
                    {
                        oldCountry = await Country.findOne({where: {id: Data.countries[i].id}})
                        await context.send(`⚠ *id${user.dataValues.id}(${user.dataValues.nick}) уже является правителем!`)
                    }
                }
                const access = await InputManager.InputBoolean(context, `ℹ Назначить игрока *id${user.dataValues.id}(${user.dataValues.nick}) правителем фракции ${country.GetName()}?`, current_keyboard)
                if(!access)
                {
                    context.send("Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(oldCountry)
                {
                    oldCountry.set({leaderID: null})
                    await oldCountry.save()
                    Data.countries[oldCountry.dataValues.id].leaderID = null
                    await context.send(`⚠ Фракция ${Data.countries[oldCountry.dataValues.id].GetName()} осталась без правителя.`)
                }
                await Country.update({leaderID: user.dataValues.id}, {where: {id: country.id}})
                await PlayerStatus.update({citizenship: country.id},{where: {id: user.dataValues.id}})
                const oldLeader = await Player.findOne({where: {id: country.leaderID}, attributes: ["status"]})
                if(oldLeader?.dataValues.status !== "worker")
                {
                    await Player.update({status: "official"}, {where: {id: country.leaderID}})
                    if(Data.users[country.leaderID]) Data.users[country.leaderID].status = "official"
                    await api.SendMessage(country.leaderID, `⚠ Вы были сняты с должности правителя фракции ${country.name}\n\n🪪 Ваш статус изменен на "Чиновник"`)
                }
                if(user.dataValues.status !== "worker")
                {
                    user.set({status: "leader"})
                    await user.save()
                    if(Data.users[user.dataValues.id]) Data.users[user.dataValues.id].status = "leader"
                }
                await api.SendMessage(user.dataValues.id,`✅ Вы были назначены правителем фракции ${country.name}\n\n👑 Ваш статус изменен на "Правитель"`)
                await Data.LoadCountries()
                await context.send(`✅ *id${user.dataValues.id}(${user.dataValues.nick}) назначен правителем фракции ${country.name}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/AppointLeader", e)
            }
        })
    }

    async Warnings(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const kb = [
                    ["⚠ Сделать предупреждение", "new"],
                    ["🗒 Показать предупреждения", "show"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "Выберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action === "new" && await this.NewWarning(context, current_keyboard)
                action === "show" && await this.ShowListWarnings(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ShowListWarnings", e)
            }
        })
    }

    async ShowListWarnings(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Выберите пользователя.", current_keyboard)
                if(!user) return resolve()
                await OutputManager.GetUserWarnings(context, user.dataValues.id, current_keyboard)
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ShowListWarnings", e)
            }
        })
    }

    async Bans(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const kb = [
                    ["🚫 Забанить игрока", "new"],
                    ["🗒 Показать баны", "show"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "Выберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action === "new" && await this.NewBan(context, current_keyboard)
                action === "show" && await this.ShowBan(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ShowListWarnings", e)
            }
        })
    }

    async ShowBan(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Выберите пользователя.", current_keyboard)
                if(!user) return resolve()
                if(!user.dataValues.isBanned)
                {
                    context.send(`ℹ Пользователь *id${user.dataValues.id}(${user.dataValues.nick}) не забанен.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const ban = await Ban.findOne({where: {userID: user.dataValues.id}})
                if(!ban)
                {
                    if (Data.users[user.dataValues.id]) Data.users[user.dataValues.id].isBanned = false
                    user.set({isBanned: false})
                    await user.save()
                    await api.SendMessage(user.dataValues.id, "✅ Вы были разбанены.")
                    await context.send(`✅ У пользователя *id${user.dataValues.id}(${user.dataValues.nick}) нет бана. Видимо произошла ошибка, сейчас все исправлено.`)
                    return resolve()
                }
                await context.send(`ℹ Бан от ${NameLibrary.ParseDateTime(ban.dataValues.createdAt)}:\nНик: *id${user.dataValues.id}(${user.dataValues.nick})\nПричина: ${ban.dataValues.reason}\nПодробная причина: ${ban.dataValues.explanation}\n\nℹ Если вы обжалуете бан, то вместе с баном удалятся и все предупреждения`, {keyboard: keyboard.build([[keyboard.appealCallbackButton({command: "appeal_ban", item: ban.dataValues.id}), keyboard.hideCallbackButton()]]).inline()})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ShowBan", e)
            }
        })
    }

    async CheatingUserResources(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Кому вы хотите накрутить ресурс?", current_keyboard)
                if(!user) return resolve()
                if(user.dataValues.status === "worker")
                {
                    context.send("🚫 Накрутка ресурсов работникам запрещена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const resources = [[keyboard.moneyButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `2️⃣ Выберите какой ресурс вы хотите накрутить игроку *id${user.dataValues.id}(${user.dataValues.nick}):`, resources, current_keyboard)
                if (!resource) return resolve()
                if(resource.match(/cancel/))
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count = await InputManager.InputInteger(context, "3️⃣ Введите количество", current_keyboard)
                if(count === null) return resolve()

                const accept = await InputManager.InputBoolean(context, `4️⃣ Подтвердите перевод:\nКому: *id${user.dataValues.id}(${user.dataValues.nick})\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                objIN[resource] = count
                await Data.AddPlayerResources(user.dataValues.id, objIN)
                await api.SendMessage(user.dataValues.id, `ℹ Вам поступил перевод:\n${NameLibrary.GetResourceName(resource)}: ${count}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CheatingUserResources", e)
            }
        })
    }

    async CheatingCityResources(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let cityID = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите город, которому вы хотите перевести накрутить ресурсы:", Data.GetCityButtons(), current_keyboard)
                if(!cityID) return resolve()
                cityID = Data.ParseButtonID(cityID)
                const resources = [[keyboard.moneyButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, "2️⃣ Выберите какой ресурс вы хотите накрутить", resources, current_keyboard)
                if (resource === "cancel")
                {
                    await context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count = await InputManager.InputInteger(context, "3️⃣ Введите количество", current_keyboard)
                if(count === null) return resolve()

                const accept = await InputManager.InputBoolean(context, `4️⃣ Подтвердите перевод:\nКому: ${Data.GetCityName(cityID)}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                objIN[resource] = count
                await Data.AddCityResources(cityID, objIN)
                await api.SendMessage(Data.cities[cityID].leaderID, `✅ Поступил перевод в бюджет города ${Data.cities[cityID].name} в размере:\n${NameLibrary.GetResourceName(resource)}: ${count}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CheatingCityResources", e)
            }
        })
    }

    async CheatingCountryResources(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `2️⃣ Выберите какой ресурс вы хотите перевести в бюджет фракции ${country.GetName()}?`, resources, current_keyboard)
                if (resource === "cancel")
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count = await InputManager.InputInteger(context, `3️⃣ Введите количество`, current_keyboard)
                if(count === null) return resolve()
                const accept = await InputManager.InputBoolean(context, `4️⃣ Подтвердите перевод:\nКому: Фракция ${country.GetName()}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let objIN = {}
                objIN[resource] = count
                await Data.AddCountryResources(country.id, objIN)
                await api.SendMessage(country.leaderID, `ℹ Поступил перевод в бюджет фракции ${Data.GetCountryName(country)} в размере:\n${NameLibrary.GetResourceName(resource)}: ${count}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CheatingCountryResources", e)
            }
        })
    }

    async CreateLastWill(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Выберите пользователя, которому завещаете все свое имущество", current_keyboard)
                if(!user) return resolve()
                if(user.dataValues.id === context.player.id)
                {
                    context.send("ℹ Указывать себя в завещании запрещено.")
                    return resolve()
                }

                const lastWillText = await InputManager.InputString(context, "2️⃣ Введите текст завещания. Этот текст будет виден только вам и наследователю после вашей смерти. (до 1000 символов)", current_keyboard, 0, 1000)
                if (!lastWillText)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                await LastWills.create({
                    userID: context.player.id,
                    text: lastWillText,
                    successorID: user.dataValues.id
                })
                current_keyboard[0][2] = keyboard.deleteLastWillButton
                await context.send("✅ Добавлено завещание.", {keyboard: keyboard.build(current_keyboard)})
                await api.SendMessage(user.dataValues.id, `✅ Игрок ${context.player.GetName()} добавил вас в своё завещание.`)
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CreateLastWill", e)
            }
        })
    }

    async DeleteLastWill(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const lastWill = await LastWills.findOne({where: {userID: context.player.id}})
                if(!lastWill) return resolve()
                await context.send(`ℹ *id${context.player.id}(Ваше) завещание:\nНаследователь: ${await NameLibrary.GetPlayerNick(lastWill.dataValues.successorID)}\nТекст:${lastWill.dataValues.text}`)
                const success = await InputManager.InputBoolean(context, "❓ Вы уверены что хотите удалить свое завещание?")
                if(!success) return resolve()

                await LastWills.destroy({where: {userID: context.player.id}})
                current_keyboard[0][2] = keyboard.createLastWillButton
                await context.send("✅ Завещание удалено.", {keyboard: keyboard.build(current_keyboard)})
                await api.SendMessage(lastWill.dataValues.successorID, `ℹ Игрок ${context.player.GetName()} удалил своё завещание.`)
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/DeleteLastWill", e)
            }
        })
    }

    async Relax(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const need = (100 - context.player.fatigue) * 3.6
                const time = new Date()
                time.setMinutes(time.getMinutes() + need)
                Data.users[context.player.id].relaxingEndTime = time
                if (Data.users[context.player.id].relaxingEndTimeout)
                {
                    clearTimeout(Data.users[context.player.id].relaxingEndTimeout)
                }
                Data.users[context.player.id].relaxingEndTimeout = setTimeout(() => {
                    current_keyboard[0][0] = keyboard.relaxButton
                    context.send("☕ Ваши силы восстановлены", {keyboard: keyboard.build(current_keyboard)})
                    context.player.fatigue = 100
                    context.player.isRelaxing = false
                }, need * 60000)
                Data.users[context.player.id].isRelaxing = true
                await context.send(`💤 Вы перешли в режим отдыха, до полного восстановления сил ${NameLibrary.ParseFutureTime(time)}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/Relax", e)
            }
        })
    }

    async Wakeup(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.player.relaxingEndTimeout)
                {
                    clearTimeout(context.player.relaxingEndTimeout)
                }
                const now = new Date()
                const time = Math.max(0, Math.round((context.player.relaxingEndTime - now) / 60000))
                context.player.isRelaxing = false
                context.player.fatigue = Math.round(100 - (time * (100 / 360)))
                await context.send(`💪 Ваш уровень энергии восстановлен до ${context.player.fatigue}%`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/Relax", e)
            }
        })
    }

    async ChangeCityName(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let name = await InputManager.InputString(context, "1️⃣ Введите новое название города (от 2 до 100 букв)", current_keyboard, 2, 100)
                if(!name) return resolve()
                let city = await City.findOne({where: {name: name}})
                while(city)
                {
                    name = await InputManager.InputString(context, "ℹ Город с таким названием уже существует. Введите название города еще раз (от 2 до 100 букв)", current_keyboard, 2, 100)
                    if(!name) return resolve()
                    city = await City.findOne({where: {name: name}})
                }
                const accept = await InputManager.InputBoolean(context, `❓ Переименовать город \"${context.city.name}\" в "${name}"?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await City.update({name: name}, {where: {id: context.city.id}})
                context.city.name = name
                await context.send("✅ Город переименован.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeCityName", e)
            }
        })
    }

    async ChangeCityDescription(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let description = await InputManager.InputString(context, `ℹ Старое описание: ${context.city.description}\n\n1️⃣ Введите новое описание города (от 1 до 1000 символов)`, current_keyboard, 2, 100)
                if(!description) return resolve()
                const accept = await InputManager.InputBoolean(context, "❓ Изменить описание города?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await City.update({description: description}, {where: {id: context.city.id}})
                context.city.description = description
                await context.send("✅ Описание города изменено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeCityDescription", e)
            }
        })
    }

    async ChangeCityPhoto(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.city.photoURL)
                {
                    await context.send("ℹ Вот старое фото", {attachment: context.city.photoURL})
                }
                else
                {
                    await context.send("ℹ У города нет фотографии.")
                }
                let photo = await InputManager.InputPhoto(context, "1️⃣ Отправьте новое фото. (Оно будет встречать людей, когда они будут заходить в город)", current_keyboard)
                if(!photo) return resolve()
                const accept = await InputManager.InputBoolean(context, "❓ Изменить фото города?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await City.update({photoURL: photo}, {where: {id: context.city.id}})
                context.city.photoURL = photo
                await context.send("✅ Фото города изменено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeCityPhoto", e)
            }
        })
    }

    async CityTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let kb = [
                    ["🔀 Игроку", "user"],
                    ["🔀 Городу", "city"],
                    ["🔀 Фракции", "country"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите, куда вы хотите отправить ресурсы", kb, current_keyboard)
                if(!action) return resolve()
                action === "user" && await this.CityToUserTransaction(context, current_keyboard)
                action === "city" && await this.CityToCityTransaction(context, current_keyboard)
                action === "country" && await this.CityToCountryTransaction(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CityToCountryTransaction", e)
            }
        })
    }

    async CityToUserTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let user = await InputManager.InputUser(context, "2️⃣ Выберите игрока", current_keyboard)
                if(!user) return resolve()
                user = user.dataValues
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `3️⃣ ${Data.cities[context.cityID].GetResources()}\n\nВыберите какой ресурс вы хотите перевести игроку *id${user.id}(${user.nick})`, resources, current_keyboard)
                if (resource === "cancel")
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.cities[context.cityID][resource] <= 0)
                {
                    context.send("⚠ В бюджете нет этого ресурса.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count
                if(Data.cities[context.cityID][resource] > 1)
                {
                    count = await InputManager.InputInteger(context, `4️⃣ Введите количество (от 1 до ${Data.cities[context.cityID][resource]} шт)`, current_keyboard, 1, Data.cities[context.cityID][resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `5️⃣ Подтвердите перевод:\n\nКому: игроку *id${user.id}(${user.nick})\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddCityResources(context.cityID, objIN)
                await Data.AddPlayerResources(user.id, objOUT)
                await api.SendMessage(user.id, `✅ Из бюджета города ${Data.cities[context.cityID].name} в ваш инвентарь поступил перевод в размере:\n${NameLibrary.GetPrice(objOUT)}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CityToCountryTransaction", e)
            }
        })
    }

    async CityToCityTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const buttons = []
                Data.cities.forEach((key) => {
                    if(key?.countryID === Data.cities[context.cityID].countryID && key?.id !== Data.cities[context.cityID].id)
                    {
                        buttons.push([key.name, "ID" + key.id])
                    }
                })
                if(buttons.length === 0)
                {
                    context.send(`ℹ Город ${Data.cities[context.cityID].name} единственный в фракции ${Data.GetCountryForCity(context.cityID)?.GetName()}`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let city = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите город", buttons, current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                city = Data.cities[city]
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `2️⃣ ${Data.cities[context.cityID].GetResources()}\n\nВыберите какой ресурс вы хотите перевести в бюджет города ${city.name}`, resources, current_keyboard)
                if (resource === "cancel")
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.cities[context.cityID][resource] <= 0)
                {
                    context.send("⚠ В бюджете нет этого ресурса.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count
                if(Data.cities[context.cityID][resource] > 1)
                {
                    count = await InputManager.InputInteger(context, `3️⃣ Введите количество (от 1 до ${Data.cities[context.cityID][resource]} шт)`, current_keyboard, 1, Data.cities[context.cityID][resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `Подтвердите перевод:\n\nКому: город ${city.name}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddCityResources(context.cityID, objIN)
                await Data.AddCityResources(city.id, objOUT)
                await api.SendMessage(city.leaderID, `✅ Из бюджета города ${Data.cities[context.cityID].name} в бюджет города ${city.name} поступил перевод в размере:\n${NameLibrary.GetPrice(objOUT)}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CityToCountryTransaction", e)
            }
        })
    }

    async CityToCountryTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `1️⃣ ${Data.cities[context.cityID].GetResources()}\n\nВыберите какой ресурс вы хотите перевести в бюджет фракции ${Data.GetCountryName(Data.GetCountryForCity(context.cityID).id)}`, resources, current_keyboard)
                if (resource === "cancel")
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.cities[context.cityID][resource] <= 0)
                {
                    context.send("⚠ У вас нет этого ресурса.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count
                if(Data.cities[context.cityID][resource] > 1)
                {
                    count = await InputManager.InputInteger(context, `2️⃣ Введите количество (от 1 до ${Data.cities[context.cityID][resource]} шт)`, current_keyboard, 1, Data.cities[context.cityID][resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `3️⃣ Подтвердите перевод:\n\nКому: фракция ${Data.GetCountryForCity(context.cityID).GetName()}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddCityResources(context.cityID, objIN)
                await Data.AddCountryResources(Data.GetCountryForCity(context.cityID).id, objOUT)
                await api.SendMessage(Data.GetCountryForCity(context.cityID).leaderID, `✅ Из бюджета города ${Data.cities[context.cityID].name} в бюджет фракции ${Data.GetCountryForCity(context.cityID).GetName()} поступил перевод в размере:\n${NameLibrary.GetPrice(objOUT)}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CityToCountryTransaction", e)
            }
        })
    }

    async DeleteCityBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = "ℹ Постройки в городе:\n\n"
                const buildingButtons = []
                if(!Data.buildings[context.cityID])
                {
                    await context.send("⛺ В городе нет построек", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                for(let i = 0; i < Data.buildings[context.cityID].length; i++)
                {
                    request += (i+1) + ": " + NameLibrary.GetBuildingType(Data.buildings[context.cityID][i].type) + " \"" + Data.buildings[context.cityID][i].name + "\" " + Data.buildings[context.cityID][i].level + " ур\n"
                    if(Data.buildings[context.player.location][i].type !== "building_of_house")
                    {
                        buildingButtons.push([NameLibrary.GetBuildingEmoji(Data.buildings[context.cityID][i].type) + Data.buildings[context.cityID][i].name, "ID" + Data.buildings[context.cityID][i].id])
                    }
                }
                if(buildingButtons.length === 0)
                {
                    await context.send(request + "\n🏘 В городе нет построек, которые вы можете снести.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let buildingID = await InputManager.KeyboardBuilder(context, request + "\nВыберите здание, которое хотите снести.\n⚠ Вы не можете распоряжаться домами игроков.", buildingButtons, current_keyboard)
                if(!buildingID) return resolve()
                buildingID = Data.ParseButtonID(buildingID)

                const accept = await InputManager.InputBoolean(context, `ℹ Стоимость сноса здания:\n${NameLibrary.GetPrice(Prices["delete_building"])}\nСейчас в бюджете ${Data.cities[context.cityID].GetResources()} монет.\n\n⚠ Вы действительно ходите снести это здание?`)
                if (!accept) return resolve()
                if(!Data.cities[context.cityID].CanPay(Prices["delete_building"]))
                {
                    await context.send("⚠ В бюджете города не хватает ресурсов!")
                    return resolve()
                }
                await Data.AddCityResources(context.cityID, Prices["delete_building"])
                await Buildings.destroy({where: {id: buildingID}})
                Data.cities[context.cityID].buildingsScore = Math.max(0, Data.cities[context.cityID].buildingsScore - 1)
                await City.update({buildingsScore: Data.cities[context.cityID].buildingsScore}, {where: {id: context.cityID}})
                for(let i = 0; i < Data.buildings[context.cityID].length; i++)
                {
                    if(Data.buildings[context.cityID][i]?.ownerType === "user" && Data.buildings[context.cityID][i]?.id === buildingID)
                    {
                        await api.SendMessage(Data.buildings[context.cityID][i].ownerID, `⚠ Глава города ${Data.cities[context.cityID].name} распорядился снести вашу постройку ${NameLibrary.GetBuildingType(Data.buildings[context.cityID][i].type)} \"${Data.buildings[context.cityID][i].name}\"`)
                        break
                    }
                }
                await Data.LoadBuildings()
                await context.send("✅ Здание снесено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/DeleteCityBuilding", e)
            }
        })
    }

    async CreateCityBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const country = Data.GetCountryForCity(context.cityID)
                const buildingButtons = [
                    ["⚔ Казарма", "barracks"],
                    ["🛟 Порт", "port"],
                    ["🪙 Монетный двор", "mint"],
                    ["✝ Храм", "church"],
                    ["🏦 Банк", "bank"],
                    ["🗿 Памятник", "monument"]
                ]
                country.resources.match(/wheat/) && buildingButtons.push(["🌾 Сельское хозяйство", "wheat"])
                country.resources.match(/stone/) && buildingButtons.push(["🪨 Каменоломня", "stone"])
                country.resources.match(/wood/) && buildingButtons.push(["🪵 Лесозаготовки", "wood"])
                country.resources.match(/iron/) && buildingButtons.push(["🌑 Железный рудник", "iron"])
                country.resources.match(/silver/) && buildingButtons.push(["🥈 Серебряный рудник", "silver"])

                let request = "1️⃣ Цены на постройки:\n\n"
                request += Data.cities[context.cityID].GetResources() + "\n\n"
                buildingButtons.forEach(key => {
                    request += key[0] + ":\n" + NameLibrary.GetPrice(Prices["new_" + key[1]]) + "\n"
                })
                const building = await InputManager.KeyboardBuilder(context, request + "\nКакую постройку вы хотите возвести?\nℹ Сейчас в городе " + Data.cities[context.cityID].buildingsScore + "/" + Data.cities[context.cityID].maxBuildings + " построек", buildingButtons, current_keyboard)
                if(!building) return resolve()
                if(Data.cities[context.cityID].buildingsScore >= Data.cities[context.cityID].maxBuildings && building !== "monument")
                {
                    await context.send("⚠ Лимит на постройки исчерпан " + Data.cities[context.cityID].buildingsScore + "/" + Data.cities[context.cityID].maxBuildings + "\n\nЧтобы построить государственное здание, требуется расширить город или снести какое-то из находящихся в городе.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(!Data.cities[context.cityID].CanPay(Prices["new_" + building]))
                {
                    await context.send("⚠ В бюджете не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(building.match(/port|barracks/))
                {
                    for(let i = 0; i < Data.cities.length; i++)
                    {
                        if(Data.cities[i])
                        {
                            if(Data.cities[i].countryID === Data.cities[context.cityID].countryID)
                            {
                                if(Data.buildings[Data.cities[i].id])
                                {
                                    for(let j = 0; j < Data.buildings[Data.cities[i].id].length; j++)
                                    {
                                        if(Data.buildings[Data.cities[i].id][j])
                                        {
                                            if(Data.buildings[Data.cities[i].id][j].type === "building_of_" + building)
                                            {
                                                const country = Data.GetCountryForCity(context.cityID)
                                                await context.send(`⚠ В фракции *public${country.groupID}(${country.name}) уже имеется ${NameLibrary.GetBuildingType("building_of_" + building)}`, {keyboard: keyboard.build(current_keyboard)})
                                                return resolve()
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                const name = await InputManager.InputString(context, "2️⃣ Назовите постройку. (от 2 до 100 символов)", current_keyboard, 2, 100)
                if(!name) return resolve()
                const description = await InputManager.InputString(context, "3️⃣ Введите описание для постройки (нажмите \"Отмена\" чтобы оставить без описания)", current_keyboard, 1)
                await Data.AddCityResources(context.cityID, Prices["new_" + building])
                await Buildings.create({
                    cityID: context.cityID,
                    name: name,
                    description: description,
                    type: "building_of_" + building,
                    ownerID: 0,
                    ownerType: "city",
                    level: 1,
                    freezing: false
                })
                await Data.LoadBuildings()
                if(building !== "monument")
                {
                    Data.cities[context.cityID].buildingsScore++
                    await City.update({buildingsScore: Data.cities[context.cityID].buildingsScore}, {where: {id: context.cityID}})
                }
                await context.send("✅ Постройка возведена.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CreateCityBuilding", e)
            }
        })
    }

    async UpgradeCityBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(!Data.buildings[context.cityID])
                {
                    await context.send("⛺ В городе нет построек", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let request = "🏢 Городские постройки:\n"
                const buildingButtons = []
                for(let i = 0; i < Data.buildings[context.cityID].length; i++)
                {
                    if(Data.buildings[context.cityID][i].ownerType === "city")
                    {
                        buildingButtons.push([NameLibrary.GetBuildingEmoji(Data.buildings[context.cityID][i].type) + Data.buildings[context.cityID][i].name, "ID" + Data.buildings[context.cityID][i].id])
                        request += `${NameLibrary.GetBuildingType(Data.buildings[context.cityID][i].type)} \"${Data.buildings[context.cityID][i].name}\" ${Data.buildings[context.cityID][i].level} ур\n`
                    }
                }
                if(buildingButtons.length === 0)
                {
                    await context.send("⛺ В городе нет городских построек", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let building = await InputManager.KeyboardBuilder(context, request, buildingButtons, current_keyboard)
                if(!building) return resolve()
                building = Data.ParseButtonID(building)
                for(let i = 0; i < Data.buildings[context.cityID].length; i++)
                {
                    if(Data.buildings[context.cityID][i].id === building)
                    {
                        building = Data.buildings[context.cityID][i]
                        break
                    }
                }
                if(building.level >= 4)
                {
                    await context.send(`⚠ ${NameLibrary.GetBuildingType(building.type)} \"${building.name}\" имеет максимальный уровень улучшения.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(building.type.match(/church|mint|monument/))
                {
                    await context.send(NameLibrary.GetBuildingType(building.type) + " не нуждается в улучшении", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await context.send(`ℹ Улучшение для ${NameLibrary.GetBuildingType(building.type)} \"${building.name}\":\n ${building.level} уровень => ${building.level + 1} уровень\n${NameLibrary.GetPrice(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])}`)
                if(!Data.cities[context.cityID].CanPay(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)]))
                {
                    await context.send("⚠ В бюджете не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, "Продолжить?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddCityResources(Data.cities[context.cityID].id, Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])
                await Buildings.update({level: building.level + 1}, {where: {id: building.id}})
                building.Upgrade(building.level + 1)
                await context.send(`✅ Постройка улучшена до ${building.level} уровня.`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/UpgradeCityBuilding", e)
            }
        })
    }

    async ExpandCity(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const isCapital = Data.cities[context.cityID].isCapital
                const maxBuildings = Data.cities[context.cityID].maxBuildings
                if((isCapital && maxBuildings >= 16) || (!isCapital && maxBuildings >= 12))
                {
                    await context.send("🏘 Город максимально расширен.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, `Расширение города ${maxBuildings} => ${maxBuildings + 2} мест для строительства.\n\n${Data.cities[context.cityID].GetResources()}\n\nСтоимость расширения:\n${NameLibrary.GetPrice(Prices['expand_city'])}\n\nПродолжить?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(!Data.cities[context.cityID].CanPay(Prices['expand_city']))
                {
                    await context.send("⚠ В бюджете не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddCityResources(context.cityID, Prices['expand_city'])
                await Data.cities[context.cityID].Expand()
                await context.send(`✅ Город расширен до ${Data.cities[context.cityID].maxBuildings} мест.`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ExpandCity", e)
            }
        })
    }

    async GetAllCityResources(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let extraction = {}
                let extract = 0
                let request = "ℹ Добыча из построек:\n\n"
                const time = new Date()
                const future = new Date()
                future.setHours(future.getHours() + 6)
                let resource = ""
                let flag = false
                let isVoid = true
                for(let i = 0, j = 0; i < Data.buildings[context.cityID]?.length; i++)
                {
                    if(Data.buildings[context.cityID][i].ownerType === "city" && Data.buildings[context.cityID][i].type.match(/wheat|stone|wood|iron|silver/))
                    {
                        flag = true
                        j++
                        request += (j) + ": " + NameLibrary.GetBuildingType(Data.buildings[context.cityID][i].type) + " \"" + Data.buildings[context.cityID][i].name + "\" "
                        if(Data.buildings[context.cityID][i].lastActivityTime - time <= 0)
                        {
                            isVoid = false
                            resource = Data.buildings[context.cityID][i].type.replace("building_of_", "")
                            extract = Math.round(NameLibrary.GetFarmRandom(resource + "_lvl" + Data.buildings[context.cityID][i].level) * 0.9)
                            request += " - добыто\n"
                            Data.buildings[context.cityID][i].lastActivityTime = future
                            if(extraction[resource])
                            {
                                extraction[resource] += -extract
                            }
                            else
                            {
                                extraction[resource] = -extract
                            }
                        }
                        else
                        {
                            request += " - через " + NameLibrary.ParseFutureTime(Data.buildings[context.cityID][i].lastActivityTime) + "\n"
                        }
                    }
                }
                if(!flag)
                {
                    await context.send("⚠ В городе нет построек для добычи ресурсов принадлежащих городу.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                request += isVoid ? "" : ("\n\nДобыто всего:\n" + NameLibrary.GetPrice(extraction))
                extraction = NameLibrary.ReversePrice(extraction)
                await Data.AddCityResources(context.cityID, extraction)
                await context.send(request)
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GetAllCityResources", e)
            }
        })
    }

    async GetCountryCities(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = "ℹ Список городов в фракции " + context.country.GetName() + ":\n\n"
                for(let i = 0, j = 0; i < Data.cities.length; i++)
                {
                    if(Data.cities[i]?.countryID === context.country.id)
                    {
                        j++
                        request += `${j}: 🌇 Город ${Data.cities[i].name} ${Data.cities[i].isCapital ? "(Столица) " : ""}- *id${Data.cities[i].leaderID}(глава)\n`
                    }
                }
                await context.send(request, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GetCountryCities", e)
            }
        })
    }

    async ChangeCountryName(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let name = await InputManager.InputString(context, "1️⃣ Введите новое название фракции (от 2 до 100 букв)", current_keyboard, 2, 100)
                if(!name) return resolve()
                let country = await Country.findOne({where: {name: name}})
                while(country)
                {
                    name = await InputManager.InputString(context, "⚠ Фракция с таким названием уже существует. Введите название фракции еще раз (от 2 до 100 букв)", current_keyboard, 2, 100)
                    if(!name) return resolve()
                    country = await Country.findOne({where: {name: name}})
                }
                const accept = await InputManager.InputBoolean(context, `❓ Переименовать фракцию ${context.country.GetName()} в "${"*public" + context.country.groupID + "(" + name + ")"}"?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Country.update({name: name}, {where: {id: context.country.id}})
                context.country.name = name
                await context.send("✅ Фракция переименована.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeCountryName", e)
            }
        })
    }

    async ChangeCountryDescription(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let description = await InputManager.InputString(context, `1️⃣ Старое описание: ${context.country.description}\n\nВведите новое описание города (от 1 до 1000 символов)`, current_keyboard, 2, 100)
                if(!description) return resolve()
                const accept = await InputManager.InputBoolean(context, "❓ Изменить описание фракции?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Country.update({description: description}, {where: {id: context.country.id}})
                context.country.description = description
                await context.send("✅ Описание фракции изменено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeCountryDescription", e)
            }
        })
    }

    async ChangeCountryPhoto(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.country.photoURL)
                {
                    await context.send("ℹ Вот старое фото", {attachment: context.country.photoURL})
                }
                else
                {
                    await context.send("ℹ У фракции нет фотографии.")
                }
                let photo = await InputManager.InputPhoto(context, "1️⃣ Отправьте новое фото.\n⚠ Это фото используется для генерации карусели.\n\n⚠⚠⚠ Требуется загрузить фото с соотношением сторон 13/8 (рекомендуемое разрешение 650x400), иначе будут ошибки с каруселью, которые могут привести к вылету\n\nБыстро изменить размер фото можно здесь: https://www.visualwatermark.com/ru/image-resizer/", current_keyboard)
                if(!photo) return resolve()
                const accept = await InputManager.InputBoolean(context, "❓ Изменить фото фракции?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Country.update({photoURL: photo}, {where: {id: context.country.id}})
                context.country.photoURL = photo
                await context.send("✅ Фото Фракции изменено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeCountryPhoto", e)
            }
        })
    }

    async ChangeCountryWelcomePhoto(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.country.welcomePhotoURL)
                {
                    await context.send("ℹ Вот старое фото", {attachment: context.country.welcomePhotoURL})
                }
                else
                {
                    await context.send("ℹ У фракции нет фотографии.")
                }
                let photo = await InputManager.InputPhoto(context, "1️⃣ Отправьте новое фото. (Оно будет отображаться при въезде в фракцию)", current_keyboard)
                if(!photo) return resolve()
                const accept = await InputManager.InputBoolean(context, "❓ Изменить приветственное фото фракции?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Country.update({welcomePhotoURL: photo}, {where: {id: context.country.id}})
                context.country.welcomePhotoURL = photo
                await context.send("✅ Приветственное фото фракции изменено.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeCountryWelcomePhoto", e)
            }
        })
    }

    async ChangeCountryGroup(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let group = await InputManager.InputGroup(context, `ℹ *public${context.country.groupID}(Ссылка на группу фракции)\n\n1️⃣ Чтобы изменить:`, current_keyboard)
                if(!group) return resolve()
                const accept = await InputManager.InputBoolean(context, `❓ Изменить группу на *public${group}(новую)?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отмена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Country.update({groupID: group}, {where: {id: context.country.id}})
                context.country.groupID = group
                await context.send("✅ Группа фракции изменена.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeCountryGroup", e)
            }
        })
    }

    async GetAllCountryResources(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let extraction = {}
                let extract = 0
                let request = "ℹ Добыча из государственных построек:\n\n"
                const time = new Date()
                const future = new Date()
                future.setHours(future.getHours() + 6)
                let resource = ""
                let flag = false
                let isVoid = true
                for(let k = 0; k < Data.cities.length; k++)
                {
                    if(Data.cities[k]?.countryID === context.country.id)
                    {
                        request += "🌇 Город " + Data.cities[k].name + ":"
                        for(let i = 0, j = 0; i < Data.buildings[Data.cities[k].id]?.length; i++)
                        {
                            if(Data.buildings[Data.cities[k].id][i].ownerType === "country" && Data.buildings[Data.cities[k].id][i].type.match(/wheat|stone|wood|iron|silver/))
                            {
                                flag = true
                                j++
                                request += "\n" + (j) + ": " + NameLibrary.GetBuildingType(Data.buildings[Data.cities[k].id][i].type) + " \"" + Data.buildings[Data.cities[k].id][i].name + "\" "
                                if(Data.buildings[Data.cities[k].id][i].lastActivityTime - time <= 0)
                                {
                                    isVoid = false
                                    resource = Data.buildings[Data.cities[k].id][i].type.replace("building_of_", "")
                                    extract = Math.round(NameLibrary.GetFarmRandom(resource + "_lvl" + Data.buildings[Data.cities[k].id][i].level) * 0.8)
                                    request += ` - добыто ${extract}`
                                    Data.buildings[Data.cities[k].id][i].lastActivityTime = future
                                    if(extraction[resource])
                                    {
                                        extraction[resource] += -extract
                                    }
                                    else
                                    {
                                        extraction[resource] = -extract
                                    }
                                }
                                else
                                {
                                    request += " - через " + NameLibrary.ParseFutureTime(Data.buildings[Data.cities[k].id][i].lastActivityTime)
                                }
                            }
                        }
                        if(!Data.buildings[Data.cities[k].id])
                        {
                            request += " - нет построек"
                        }
                        request += "\n\n"
                    }
                }
                if(!flag)
                {
                    await context.send("⚠ В фракции нет государственных построек для добычи ресурсов принадлежащих государству.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                request += isVoid ? "" : ("\n\nДобыто всего:\n" + NameLibrary.GetPrice(extraction))
                extraction = NameLibrary.ReversePrice(extraction)
                await Data.AddCountryResources(context.country.id, extraction)
                await context.send(request)
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GetAllCountryResources", e)
            }
        })
    }

    async CountryTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let kb = [
                    ["🔀 Игроку", "user"],
                    ["🔀 Городу", "city"],
                    ["🔀 Фракции", "country"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "Выберите, куда вы хотите отправить ресурсы", kb, current_keyboard)
                if(!action) return resolve()
                action === "user" && await this.CountryToUserTransaction(context, current_keyboard)
                action === "city" && await this.CountryToCityTransaction(context, current_keyboard)
                action === "country" && await this.CountryToCountryTransaction(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CountryToCityTransaction", e)
            }
        })
    }

    async CountryToUserTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let user = await InputManager.InputUser(context, "1️⃣ Выберите игрока, которому вы хотите перевести ресурсы из бюджета фракции:", current_keyboard)
                if(!user) return resolve()
                user = user.dataValues
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `2️⃣ ${context.country.GetResources()}\n\nВыберите какой ресурс вы хотите перевести`, resources, current_keyboard)
                if (resource === "cancel")
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(context.country[resource] <= 0)
                {
                    context.send("⚠ В бюджете нет этого ресурса.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count
                if(context.country[resource] > 1)
                {
                    count = await InputManager.InputInteger(context, `3️⃣ Введите количество (от 1 до ${context.country[resource]} шт)`, current_keyboard, 1, context.country[resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `4️⃣ Подтвердите перевод:\n\nКому: игрок *id${user.id}(${user.nick})\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddCountryResources(context.country.id, objIN)
                await Data.AddPlayerResources(user.id, objOUT)
                await api.SendMessage(user.id, `✅ Из бюджета фракции ${context.country.GetName()} к вам в инвентарь поступил перевод в размере:\n\n${NameLibrary.GetPrice(objOUT)}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CountryToUserTransaction", e)
            }
        })
    }

    async CountryToCountryTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const buttons = []
                Data.countries.forEach((key) =>
                {
                    if(key?.id !== context.country.id)
                    {
                        buttons.push([key.name, "ID" + key.id])
                    }
                })
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию, в бюджет которой хотите перевести ресурсы:", buttons, current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `2️⃣ ${context.country.GetResources()}\n\nВыберите какой ресурс вы хотите перевести в бюджет фракции ${country.GetName()}?`, resources, current_keyboard)
                if (resource === "cancel")
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(context.country[resource] <= 0)
                {
                    context.send("⚠ В бюджете нет этого ресурса.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count
                if(context.country[resource] > 1)
                {
                    count = await InputManager.InputInteger(context, `3️⃣ Введите количество (от 1 до ${context.country[resource]} шт)`, current_keyboard, 1, context.country[resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `4️⃣ Подтвердите перевод:\n\nКому: фракция ${country.GetName()}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddCountryResources(context.country.id, objIN)
                await Data.AddCountryResources(country.id, objOUT)
                await api.SendMessage(country.leaderID, `✅ Из бюджета фракции ${context.country.GetName()} в бюджет фракции ${country.GetName()} поступил перевод в размере:\n\n${NameLibrary.GetPrice(objOUT)}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CountryToCityTransaction", e)
            }
        })
    }

    async CountryToCityTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let cityID = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите город, в бюджет которого хотите перевести ресурсы:", Data.GetCityForCountryButtons(context.country.id), current_keyboard)
                if(!cityID) return resolve()
                cityID = Data.ParseButtonID(cityID)
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `2️⃣ ${context.country.GetResources()}\n\nПереводить ресурсы можно только в бюджет города фракции.\n\nВыберите какой ресурс вы хотите перевести в бюджет города ${Data.GetCityName(cityID)}?`, resources, current_keyboard)
                if (resource === "cancel")
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(context.country[resource] <= 0)
                {
                    context.send("⚠ В бюджете нет этого ресурса.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count
                if(context.country[resource] > 1)
                {
                    count = await InputManager.InputInteger(context, `3️⃣ Введите количество (от 1 до ${context.country[resource]} шт)`, current_keyboard, 1, context.country[resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `4️⃣ Подтвердите перевод:\nКому: ${Data.GetCityName(cityID)}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddCountryResources(context.country.id, objIN)
                await Data.AddCityResources(cityID, objOUT)
                await api.SendMessage(Data.cities[cityID].leaderID, `✅ Из бюджета фракции ${context.country.GetName()} поступил перевод в бюджет города ${Data.cities[cityID].name} в размере:\n${NameLibrary.GetPrice(objOUT)}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CountryToCityTransaction", e)
            }
        })
    }

    async GetCountryTax(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let time = new Date()
                if(context.country.lastTaxTime - time > 0)
                {
                    context.send("✡ Вы уже собирали налоги, следующий сбор будет доступен через " + NameLibrary.ParseFutureTime(context.country.lastTaxTime), {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let taxIncome = {}
                Object.keys(Prices["void_tax_price"]).forEach(key => {taxIncome[key] = Prices["void_tax_price"][key]})
                let totalIncome = {}
                Object.keys(Prices["void_tax_price"]).forEach(key => {totalIncome[key] = Prices["void_tax_price"][key]})
                let tax = context.country.tax / 100
                let count = 0
                for(let i = 0; i < Data.cities.length; i++)
                {
                    if(Data.cities[i]?.countryID === context.country.id)
                    {
                        Object.keys(taxIncome).forEach(key => {
                            taxIncome[key] = Math.round(parseInt(Data.cities[i][key]) * tax)
                            totalIncome[key] += taxIncome[key]
                        })
                        count++
                        taxIncome = NameLibrary.ReversePrice(taxIncome)
                        await Data.AddCityResources(Data.cities[i].id, taxIncome)
                        await api.SendMessage(Data.cities[i].leaderID, `ℹ Правитель фракции ${context.country.GetName()} собрал с городов фракции налоги в размере ${context.country.tax}%, из бюджета города \"${Data.cities[i].name}\" собрано:\n${NameLibrary.GetPrice(taxIncome)}`)
                    }
                }
                await Data.AddCountryResources(context.country.id, totalIncome)
                time.setHours(time.getHours() + 168)
                context.country.lastTaxTime = time
                await context.send(`ℹ С ${count} городов собрано:\n${NameLibrary.GetPrice(totalIncome)}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GetCountryTax", e)
            }
        })
    }

    async SetMayor(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let cityButtons
                if(NameLibrary.RoleEstimator(context.player.role) > 2)
                {
                    cityButtons = Data.GetCityButtons()
                }
                else
                {
                    cityButtons = Data.GetCityForCountryButtons(context.player.countryID)
                }
                let city = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите город", cityButtons, current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                city = Data.cities[city]
                const user = await InputManager.InputUser(context, `2️⃣ Выберите, кого назначить главой города ${city.name}`, current_keyboard)
                if(!user) return resolve()
                if(user.dataValues.status === "worker")
                {
                    await context.send("🚫 Назначать игроков со статусом ⚙ Работник на должность градоначальника запрещено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, `Назначить *id${user.dataValues.id}(${user.dataValues.nick}) главой города ${city.name}?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.users[user.dataValues.id]) Data.users[user.dataValues.id].status = "official"
                if(city.leaderID) await api.SendMessage(city.leaderID, `⚠ Вы были сняты с должности главы города ${city.name}`)
                await Player.update({status: "official"}, {where: {id: user.dataValues.id}})
                if(user.dataValues.id !== Data.countries[city.countryID].leaderID)
                {
                    await OfficialInfo.findOrCreate({
                        where: {id: user.dataValues.id},
                        defaults: {id: user.dataValues.id, nick: user.dataValues.nick, countryID: city.countryID}
                    })
                }
                await City.update({leaderID: user.dataValues.id}, {where: {id: city.id}})
                city.leaderID = user.dataValues.id
                await api.SendMessage(user.dataValues.id, `✅ Вы были назначены главой города ${city.name}`)
                await context.send(`✅ Игрок ${await NameLibrary.GetPlayerNick(user.dataValues.id)} назначен главой города ${city.name}`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/SetMayor", e)
            }
        })
    }

    async SetTax(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const taxButtons = [
                    ["🏙 Городской налог", "tax"],
                    ["🧑 Гражданский налог", "citizenTax"],
                    ["🧑‍🦯 Туристический налог", "nonCitizenTax"],
                    ["⏩ Въездная пошлина", "entranceFee"],
                ]
                const taxType = await InputManager.KeyboardBuilder(context, "1️⃣ Какой тип налога вы хотите установить?", taxButtons, current_keyboard)
                if(!taxType) return resolve()
                const taxSamples = {
                    tax: "2️⃣ Укажите городской налог в процентах (этот налог вы можете снимать с городов раз в неделю)",
                    citizenTax: "2️⃣ Укажите налог для граждан в процентах (этот налог будет сниматься с граждан при добыче ресурсов и обмене ресурсами)",
                    nonCitizenTax: "2️⃣ Укажите налог для граждан другой фракции и апатридов в процентах (этот налог будет сниматься с игроков, не являющихся гражданами фракции, при добыче ресурсов и обмене ресурсами)",
                    entranceFee: "2️⃣ Укажите въездную пошлину в монетах (это та сумма, которую надо оплатить перед отправкой в вашу фракцию)"
                }
                const tax = await InputManager.InputInteger(context, taxSamples[taxType], current_keyboard, 0, taxType === "entranceFee" ? Number.MAX_SAFE_INTEGER : 100)
                if(tax === null) return resolve()
                context.country[taxType] = tax
                let newTax = {}
                newTax[taxType] = tax
                await Country.update(newTax, {where: {id: context.country.id}})
                await context.send("✅ Налог изменен.", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/SetTax", e)
            }
        })
    }

    async BuildNewCity(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let leader = await InputManager.InputUser(context, `${context.country.GetResources()}\n\nСтоимость строительства нового города:\n${NameLibrary.GetPrice(Prices["new_city"])}\n\n1️⃣ Укажите градоначальника`, current_keyboard)
                if(!leader) return resolve()
                if(leader.dataValues.status === "worker")
                {
                    await context.send("⚠ Назначать игроков со статусом ⚙ Работник на должность градоначальника запрещено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let leaderInfo = await PlayerStatus.findOne({where: {id: leader.dataValues.id}})
                if(leaderInfo.dataValues.citizenship !== context.country.id)
                {
                    await context.send(`⚠ Игрок не является гражданином фракции ${context.country.GetName()}`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(!context.country.CanPay(Prices["new_city"]))
                {
                    await context.send(`⚠ В бюджете не хватает ресурсов`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let city = await City.findOne({where: {leaderID: leader.dataValues.id}})
                while(city)
                {
                    leader = await InputManager.InputUser(context, `⚠ Игрок *id${leader.dataValues.id}(${leader.dataValues.nick})уже является главой города ${city.dataValues.name}`, current_keyboard)
                    if(!leader) return resolve()
                    if(leader.dataValues.status === "worker")
                    {
                        await context.send("⚠ Назначать игроков со статусом ⚙ Работник на должность градоначальника запрещено", {keyboard: keyboard.build(current_keyboard)})
                        return resolve()
                    }
                    leaderInfo = await PlayerStatus.findOne({where: {id: leader.dataValues.id}})
                    if(leaderInfo.dataValues.citizenship !== context.country.id)
                    {
                        await context.send(`⚠ Игрок *id${leader.dataValues.id}(${leader.dataValues.nick}) не является гражданином фракции ${context.country.GetName()}\`, {keyboard: keyboard.build(current_keyboard)}`, {keyboard: keyboard.build(current_keyboard)})
                        return resolve()
                    }
                    city = await City.findOne({where: {leaderID: leader.dataValues.id}})
                }
                let name = await InputManager.InputString(context, "2️⃣ Введите название нового города (от 2 до 100 символов)", current_keyboard, 2, 100)
                if(!name) return resolve()
                city = await City.findOne({where: {name: name}})
                while(city)
                {
                    name = await InputManager.InputString(context, "⚠ Город с таким названием уже существует, повторите ввод.", current_keyboard, 2, 100)
                    if(!name) return resolve()
                    city = await City.findOne({where: {name: name}})
                }
                let description = await InputManager.InputString(context, "3️⃣ Введите описание города (от 2 до 1000 символов)", current_keyboard, 2, 1000)
                if(!description) return resolve()
                const newCity = await City.create({
                    countryID: context.country.id,
                    leaderID: leader.dataValues.id,
                    name: name,
                    description: description
                })
                await CityRoads.create({fromID: context.country.capitalID, toID: newCity.dataValues.id, time: Data.variables["cityToCityTime"], isBlocked: false})
                await CityRoads.create({fromID: newCity.dataValues.id, toID: context.country.capitalID, time: Data.variables["cityToCityTime"], isBlocked: false})
                await CityResources.create({id: newCity.dataValues.id})
                if(Data.users[leader.dataValues.id]) Data.users[leader.dataValues.id].status = "official"
                if(leader.dataValues.status.match(/citizen|/))
                {
                    leader.set({status: "official"})
                    await leader.save()
                }
                await Data.AddCountryResources(context.country.id, Prices["new_city"])
                await OfficialInfo.findOrCreate({
                    where: {id: leader.dataValues.id},
                    defaults: {id: leader.dataValues.id, countryID: context.country.id}
                })
                await Data.LoadCities()
                await api.SendMessage(leader.dataValues.id, `✅ Правитель фракции ${context.country.GetName()} построил новый город \"${newCity.dataValues.name}\" и вы были назначены его главой, ваш статус изменен на "Чиновник"`)
                await context.send("✅ Город создан.", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/BuildNewCity", e)
            }
        })
    }

    async BuildTheRoad(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(Data.cities[context.cityID].isCapital)
                {
                    await context.send("ℹ Вы находитесь в столице, все дороги фракции соединены со столицей, нет нужды строить дополнительные дороги")
                    return resolve()
                }
                const roads = await CityRoads.findAll({where: {fromID: context.cityID}, attributes: ["id", "toID"]})
                let nonRoadCityButtons = []
                const cities = Data.GetCountryCities(Data.cities[context.cityID].countryID)
                let roadFlag = true
                for(const city of cities)
                {
                    if(city.id === context.cityID) continue
                    roadFlag = true
                    for(const road of roads)
                    {
                        if(city.id === road.dataValues.toID)
                        {
                            roadFlag = false
                            break
                        }
                    }
                    if(roadFlag)
                    {
                        nonRoadCityButtons.push([city.name, "ID" + city.id])
                    }
                }
                if(nonRoadCityButtons.length === 0)
                {
                    await context.send("ℹ Вы провели все доступные вам дороги.")
                    return resolve()
                }
                let city = await InputManager.KeyboardBuilder(context, `${Data.cities[context.cityID].GetResources()}\n\nПостройка новой дороги стоит:\n${NameLibrary.GetPrice(Prices["new_road"])}\n\nℹ Выберите город, к которому вы хотите провести дорогу:`, nonRoadCityButtons, current_keyboard)
                if(!city) return resolve()
                city = Data.cities[Data.ParseButtonID(city)]
                if(!Data.cities[context.cityID].CanPay(Prices["new_road"]))
                {
                    await context.send("⚠ В бюджете не хватает ресурсов", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, `Построить дорогу от ${Data.cities[context.cityID].name} до ${city.name}?`)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddCityResources(context.cityID, Prices["new_road"])
                const roadFrom = await CityRoads.create({fromID: context.cityID, toID: city.id, isBlocked: true})
                const roadTo = await CityRoads.create({fromID: city.id, toID: context.cityID, isBlocked: true})
                await api.GMMailing(`ℹ Глава города ${Data.cities[context.cityID].name} построил дорогу к городу ${city.name}, необходимо заполнить данные о расстоянии.`, [[keyboard.startCallbackButton({command: "set_road_distance", item: roadTo.dataValues.id, addition: roadFrom.dataValues.id})]])
                await context.send("✅ Дорога построена, осталось чтобы ГМ-ы обработали заявку", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/BuildTheRoad", e)
            }
        })
    }

    async CreateCountryBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let city = await InputManager.KeyboardBuilder(context, "Выберите город, в котором хотите разместить новую постройку", Data.GetCityForCountryButtons(context.country.id), current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                const buildingButtons = [
                    ["⚔ Казарма", "barracks"],
                    ["🛟 Порт", "port"],
                    ["🪙 Монетный двор", "mint"],
                    ["✝ Храм", "church"],
                    ["🏦 Банк", "bank"],
                    ["🗿 Памятник", "monument"]
                ]
                context.country.resources.match(/wheat/) && buildingButtons.push(["🌾 Сельское хозяйство", "wheat"])
                context.country.resources.match(/stone/) && buildingButtons.push(["🪨 Каменоломня", "stone"])
                context.country.resources.match(/wood/) && buildingButtons.push(["🪵 Лесозаготовки", "wood"])
                context.country.resources.match(/iron/) && buildingButtons.push(["🌑 Железный рудник", "iron"])
                context.country.resources.match(/silver/) && buildingButtons.push(["🥈 Серебряный рудник", "silver"])

                let request = "ℹ Цены на постройки:\n\n"
                request += context.country.GetResources() + "\n\n"
                buildingButtons.forEach(key => {
                    request += key[0] + ":\n" + NameLibrary.GetPrice(Prices["new_" + key[1]]) + "\n"
                })
                const building = await InputManager.KeyboardBuilder(context, request + "\n1️⃣ Какую постройку вы хотите возвести?\nСейчас в городе " + Data.cities[city].buildingsScore + "/" + Data.cities[city].maxBuildings + " построек", buildingButtons, current_keyboard)
                if(!building) return resolve()
                if(Data.cities[city].buildingsScore >= Data.cities[city].maxBuildings && building !== "monument")
                {
                    await context.send("⚠ Лимит на постройки исчерпан " + Data.cities[city].buildingsScore + "/" + Data.cities[city].maxBuildings + "\n\nЧтобы построить государственное здание, требуется расширить город или снести какое-то из находящихся в городе.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(!context.country.CanPay(Prices["new_" + building]))
                {
                    await context.send("⚠ В бюджете не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(building.match(/port|barracks/))
                {
                    for(let i = 0; i < Data.cities.length; i++)
                    {
                        if(Data.cities[i]?.countryID === context.country.id)
                        {
                            for(let j = 0; j < Data.buildings[Data.cities[i].id].length; j++)
                            {
                                if(Data.buildings[Data.cities[i].id][j]?.type === "building_of_" + building)
                                {
                                    await context.send(`⚠ В фракции ${context.country.GetName()} уже имеется ${NameLibrary.GetBuildingType("building_of_" + building)}`, {keyboard: keyboard.build(current_keyboard)})
                                    return resolve()
                                }
                            }
                        }
                    }
                }
                const name = await InputManager.InputString(context, "2️⃣ Назовите постройку. (от 2 до 100 символов)", current_keyboard, 2, 100)
                if(!name) return resolve()
                const description = await InputManager.InputString(context, "3️⃣ Введите описание для постройки (нажмите \"Отмена\" чтобы оставить без описания)", current_keyboard, 1)
                await Data.AddCountryResources(context.country.id, Prices["new_" + building])
                await Buildings.create({
                    cityID: city,
                    name: name,
                    description: description,
                    type: "building_of_" + building,
                    ownerID: 0,
                    ownerType: "country",
                    level: 1,
                    freezing: false
                })
                if(building !== "monument")
                {
                    Data.cities[city].buildingsScore++
                    await City.update({buildingsScore: Data.cities[city].buildingsScore}, {where: {id: city}})
                }
                await Data.LoadBuildings()
                await api.SendMessage(Data.cities[city].leaderID, `ℹ Правитель фракции ${context.country.GetName()} возвел в вашем городе ${NameLibrary.GetBuildingType("building_of_" + building)}`)
                await context.send("✅ Постройка возведена.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CreateCountryBuilding", e)
            }
        })
    }

    async UpgradeCountryBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = "🏢 Постройки:\n\n"
                const buildingButtons = []
                for(let i = 0; i < Data.cities.length; i++)
                {
                    if(Data.cities[i]?.countryID === context.country.id)
                    {
                        request += `🌇 Город ${Data.cities[i].name}:\n`
                        if(Data.buildings[Data.cities[i].id])
                        {
                            for(let j = 0; j < Data.buildings[Data.cities[i].id].length; j++)
                            {
                                if(Data.buildings[Data.cities[i].id][j].ownerType === "country")
                                {
                                    buildingButtons.push([NameLibrary.GetBuildingEmoji(Data.buildings[Data.cities[i].id][j].type) + Data.buildings[Data.cities[i].id][j].name, "ID" + Data.buildings[Data.cities[i].id][j].id])
                                    request += `${NameLibrary.GetBuildingType(Data.buildings[Data.cities[i].id][j].type)} \"${Data.buildings[Data.cities[i].id][j].name}\" ${Data.buildings[Data.cities[i].id][j].level} ур\n`
                                }
                            }
                        }
                        if(!Data.buildings[Data.cities[i].id])
                        {
                            request += "⛺ В городе нет построек"
                        }
                        request += "\n\n"
                    }
                }
                if(buildingButtons.length === 0)
                {
                    await context.send("⛺ В фракции нет государственных построек", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let building = await InputManager.KeyboardBuilder(context, request + "\n\n1️⃣ Выберите постройку для улучшения", buildingButtons, current_keyboard)
                if(!building) return resolve()
                building = Data.ParseButtonID(building)
                for(let i = 0; i < Data.cities.length; i++)
                {
                    if(Data.cities[i]?.countryID === context.country.id)
                    {
                        for(let j = 0; j < Data.buildings[Data.cities[i].id]?.length; j++)
                        {
                            if(Data.buildings[Data.cities[i].id][j].id === building)
                            {
                                building = Data.buildings[Data.cities[i].id][j]
                                break
                            }
                        }
                    }
                }
                if(building.level >= 4)
                {
                    await context.send(`⚠ ${NameLibrary.GetBuildingType(building.type)} \"${building.name}\" имеет максимальный уровень улучшения.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(building.type.match(/church|mint|monument/))
                {
                    await context.send(NameLibrary.GetBuildingType(building.type) + " не нуждается в улучшении", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await context.send(`2️⃣ Улучшение для ${NameLibrary.GetBuildingType(building.type)} \"${building.name}\":\n ${building.level} уровень => ${building.level + 1} уровень\n${NameLibrary.GetPrice(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])}`)
                if(!context.country.CanPay(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)]))
                {
                    await context.send("⚠ В бюджете не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, "Продолжить?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddCountryResources(context.country.id, Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])
                await Buildings.update({level: building.level + 1}, {where: {id: building.id}})
                building.Upgrade(building.level + 1)
                await context.send(`✅ Постройка улучшена до ${building.level} уровня.`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/UpgradeCountryBuilding", e)
            }
        })
    }

    async GetCountryOfficials(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = `ℹ Чиновники фракции ${context.country.GetName()}:\n\n`
                let flag = true
                if(Data.officials[context.country.id])
                {
                    for(const official of Object.keys(Data.officials[context.country.id]))
                    {
                        flag = true
                        request += `🔸 *id${official}(${Data.officials[context.country.id][official].nick}) может:\n`
                        if(Data.officials[context.country.id][official].canBeDelegate)
                        {
                            flag = false
                            request += "- принимать граждан\n"
                        }
                        if(Data.officials[context.country.id][official].canBuildCity)
                        {
                            flag = false
                            request += "- возводить города\n"
                        }
                        if(Data.officials[context.country.id][official].canUseResources)
                        {
                            flag = false
                            request += "- распоряжаться бюджетом\n"
                        }
                        if(Data.officials[context.country.id][official].canUseArmy)
                        {
                            flag = false
                            request += "- распоряжаться армией\n"
                        }
                        if(Data.officials[context.country.id][official].canAppointOfficial)
                        {
                            flag = false
                            request += "- назначать чиновников\n"
                        }
                        if(Data.officials[context.country.id][official].canAppointMayors)
                        {
                            flag = false
                            request += "- назначать градоначальников\n"
                        }
                        if(flag) request += "ничего не может"
                        request += "\n"
                    }
                }
                else
                {
                    await context.send("⚠ Вы не назначали чиновников", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await context.send(request, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GetCountryOfficials", e)
            }
        })
    }

    async SetOfficial(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Выберите игрока", current_keyboard)
                if(!user) return resolve()
                if(user.dataValues.status === "worker")
                {
                    await context.send("🚫 Назначать игроков со статусом ⚙ Работник на должность чиновника запрещено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const userStatus = await PlayerStatus.findOne({where: {id: user.dataValues.id}})
                if(userStatus?.dataValues.id === context.country.leaderID)
                {
                    await context.send("⚠ Это правитель, правителя невозможно сделать чиновником", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(userStatus?.dataValues.citizenship !== context.country.id)
                {
                    await context.send("⚠ Вы не можете назначить чиновником игрока, не имеющего гражданство вашей фракции", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const offInfo = await OfficialInfo.findOne({where: {id: user.dataValues.id}})
                if(offInfo)
                {
                    await context.send(`⚠ Игрок *id${user.dataValues.id}(${user.dataValues.nick}) уже является чиновником`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await OfficialInfo.create({
                    id: user.dataValues.id,
                    countryID: context.country.id,
                    nick: user.dataValues.nick
                })
                await Player.update({status: "official"}, {where: {id: user.dataValues.id}})
                if(Data.users[user.dataValues.id]) Data.users[user.dataValues.id].status = "official"
                await Data.LoadOfficials()
                await api.SendMessage(user.dataValues.id, `Правитель фракции ${context.country.GetName()} назначил вас чиновником`)
                await context.send(`✅ Игрок *id${user.dataValues.id}(${user.dataValues.nick}) назначен чиновником`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/SetOfficial", e)
            }
        })
    }

    async ChangeOfficial(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const officialButtons = []
                if (Data.officials[context.country.id])
                {
                    for(const official of Object.keys(Data.officials[context.country.id]))
                    {
                        officialButtons.push([Data.officials[context.country.id][official].nick, "ID" + official])
                    }
                }
                else
                {
                    await context.send("⚠ В вашей фракции нет чиновников", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let official = await InputManager.KeyboardBuilder(context, "Выберите чиновника", officialButtons, current_keyboard)
                if(!official) return resolve()
                official = Data.ParseButtonID(official)
                official = Data.officials[context.country.id][official]
                const request = "ℹ Возможности:\n\n🔸Делегат - может принимать гражданство\n🔸Города - может возводить города\n🔸Ресурсы - может распоряжаться бюджетом\n🔸Чиновники - может назначать других чиновников, но не может выдавать им права\n🔸Градоначальники - может менять глав городов"
                const rulesData = [
                    ["🔸Делегат", "canBeDelegate", official.canBeDelegate],
                    ["🔸Города", "canBuildCity", official.canBuildCity],
                    ["🔸Ресурсы", "canUseResources", official.canUseResources],
                    ["🔸Чиновники", "canAppointOfficial", official.canAppointOfficial],
                    ["🔸Градоначальники", "canAppointMayors", official.canAppointMayors]
                ]
                const rules = await InputManager.RadioKeyboardBuilder(context, request, rulesData, current_keyboard)
                if(!rules) return resolve()
                let newRules = {}
                for(let i = 0; i < rules.length; i++)
                {
                    newRules[rules[i][0]] = rules[i][1]
                    official[rules[i][0]] = rules[i][1]
                }
                await OfficialInfo.update(newRules, {where: {id: official.id}})
                await api.SendMessage(official.id, `ℹ Ваши права как чиновника изменены, теперь вы:\n\n🔸Можете принимать гражданство - ${newRules.canBeDelegate?"Да":"Нет"}\n🔸Можете возводить города - ${newRules.canBuildCity?"Да":"Нет"}\n🔸Может распоряжаться бюджетом - ${newRules.canUseResources?"Да":"Нет"}\n🔸Может назначать других чиновников - ${newRules.canAppointOfficial?"Да":"Нет"}\n🔸Может менять глав городов - ${newRules.canAppointMayors?"Да":"Нет"}`)
                await context.send("✅ Права чиновника изменены", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeOfficial", e)
            }
        })
    }

    async TakeAwayOfficial(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const officialButtons = []
                if(Data.officials[context.country.id])
                {
                    for(const official of Object.keys(Data.officials[context.country.id]))
                    {
                        officialButtons.push([Data.officials[context.country.id][official].nick, "ID" + official])
                    }
                }
                else
                {
                    await context.send("⚠ В вашей фракции нет чиновников", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let official = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите чиновника", officialButtons, current_keyboard)
                if(!official) return resolve()
                official = Data.ParseButtonID(official)
                official = Data.officials[context.country.id][official]
                const accept = await InputManager.InputBoolean(context, `❓ Вы действительно хотите забрать права чиновника у игрока *id${official.id}(${official.nick})?`)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await OfficialInfo.destroy({where: {id: official.id}})
                const user = await Player.findOne({where: {id: official.id}})
                if(user.dataValues.status !== "worker")
                {
                    user.set({status: "citizen"})
                    await user.save()
                    if(Data.users[user.dataValues.id]) Data.users[user.dataValues.id].status = "citizen"
                }
                await api.SendMessage(official.id, `⚠ Правитель фракции ${context.country.GetName()} забрал у вас права чиновника.`)
                await Data.LoadOfficials()
                await context.send(`✅ Игрок *id${user.dataValues.id}(${user.dataValues.nick}) лишен статуса чиновника`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/TakeAwayOfficial", e)
            }
        })
    }

    async TakeAwayCitizenship(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Выберите игрока", current_keyboard)
                if(!user) return resolve()
                const status = await PlayerStatus.findOne({where: {id: user.dataValues.id}})
                if(status.dataValues.citizenship !== context.country.id)
                {
                    await context.send(`⚠ Игрок *id${user.dataValues.id}(${user.dataValues.nick}) не является гражданином фракции ${context.country.GetName()}`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(user.dataValues.id === context.country.leaderID)
                {
                    await context.send(`🚫 Невозможно забрать гражданство у правителя`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(user.dataValues.status?.match(/official|leader/))
                {
                    await context.send(`⚠ Перед тем как забрать гражданство у игрока необходимо сместить его с должности чиновника`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, `❓ Лишить игрока *id${user.dataValues.id}(${user.dataValues.nick}) гражданства фракции ${context.country.GetName()}?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                status.set({citizenship: null})
                await status.save()
                if(user.dataValues.status !== "worker")
                {
                    await Player.update({status: "stateless"}, )
                    if(Data.users[user.dataValues.id])
                    {
                        Data.users[user.dataValues.id].status = "stateless"
                    }
                }
                if(Data.users[user.dataValues.id])
                {
                    Data.users[user.dataValues.id].citizenship = null
                }
                await api.SendMessage(user.dataValues.id, `⚠ Правительство фракции ${context.country.GetName()} лишило вас гражданства`)
                await context.send("✅ Игрок лишен гражданства", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/TakeAwayCitizenship", e)
            }
        })
    }

    async OfferMarry(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.player.isMarried)
                {
                    await context.send("⚠ Вы уже помолвлены", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const user = await InputManager.InputUser(context, "1️⃣ Кому вы хотите сделать предложение?", current_keyboard)
                if(!user) return resolve()
                const userInfo = await PlayerInfo.findOne({where: {id: user.dataValues.id}})
                if(userInfo.dataValues.marriedID !== null)
                {
                    await context.send(`⚠ ${await NameLibrary.GetPlayerNick(user.dataValues.id)} уже состоит в браке!`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(NameLibrary.GetGender(user.dataValues.gender) === context.player.gender && context.player.nation !== "Грек 🏛️")
                {
                    await context.send("✝ Мы такое не одобряем.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const text = await InputManager.InputString(context, "2️⃣ Напишите текст предложения.", current_keyboard)
                if (!text) return resolve()

                const accept = await InputManager.InputBoolean(context, `ℹ Текст предложения:\n${text}\n\nСделать предложение вступления в брак игроку *id${user.dataValues.id}(${user.dataValues.nick})?\n\nℹ Если игрок согласится, то у вас будет заключен брак.`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await api.api.messages.send({
                    user_id: user.dataValues.id,
                    random_id: Math.round(Math.random() * 100000),
                    message: `💌 Игрок *id${context.player.id}(${context.player.nick}) отправил вам предложение руки и сердца с текстом:\n${text}`,
                    keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "merry", item: context.player.id}), keyboard.declineCallbackButton({command: "decline_merry", item: context.player.id})]]).inline().oneTime()
                })
                Data.users[context.player.id].isMarried = true
                await context.send("✅ Предложение отправлено", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/OfferMarry", e)
            }
        })
    }

    async Divorce(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(!context.player.marriedID)
                {
                    await context.send("⚠ Вы не состоите в браке.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, `❓ Вы хотите расторгнуть брак с игроком ${await NameLibrary.GetPlayerNick(context.player.marriedID)}?\nℹ Если игрок тоже согласится на это, то ваш брак будет расторгнут.`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено")
                    return resolve()
                }
                await api.api.messages.send({
                    user_id: context.player.marriedID,
                    random_id: Math.round(Math.random() * 100000),
                    message: `❤️‍🩹 Игрок *id${context.player.id}(${context.player.nick}) отправил вам предложение расторгнуть брак`,
                    keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "divorce", item: context.player.id}), keyboard.declineCallbackButton({command: "decline_divorce", item: context.player.id})]]).inline().oneTime()
                })
                await context.send("✅ Предложение отправлено", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/Divorce", e)
            }
        })
    }

    async GetCitizenship(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.player.status.match(/official|leader/))
                {
                    await context.send("⚠ Правители и чиновники не могут менять гражданство", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(context.player.status.match(/candidate/))
                {
                    await context.send("⚠ Вы уже подали на гражданство", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(context.player.citizenship !== null)
                {
                    const firstAccept = await InputManager.InputBoolean(context, `❓ Вы точно хотите отказаться от гражданства фракции ${Data.GetCountryName(context.player.citizenship)}?\nПосле отказа ваш статус изменится на \"апатрид\".`, current_keyboard)
                    if(!firstAccept) return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию, гражданином которой хотите стать", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                if(country === context.player.citizenship)
                {
                    await context.send("⚠ Вы уже являетесь гражданином этой страны.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await api.api.messages.send({
                    user_id: Data.countries[country].leaderID,
                    random_id: Math.round(Math.random() * 100000),
                    message: `🪪 Игрок ${context.player.GetName()} подал на гражданство в вашу фракцию: \n\n${context.player.GetInfo()}`,
                    keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "give_citizenship", item: context.player.id, parameter: country}), keyboard.declineCallbackButton({command: "decline_citizenship", item: context.player.id, parameter: country})]]).inline().oneTime()
                })
                for(let i = 0; i < Data.officials[country]?.length; i++)
                {
                    if(Data.officials[country][i].canBeDelegate)
                    {
                        await api.api.messages.send({
                            user_id: Data.officials[country][i].id,
                            random_id: Math.round(Math.random() * 100000),
                            message: `🪪 Игрок ${context.player.GetName()} подал на гражданство в вашу фракцию: \n\n${context.player.GetInfo()}`,
                            keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "give_citizenship", item: context.player.id, parameter: country}), keyboard.declineCallbackButton({command: "decline_citizenship", item: context.player.id, parameter: country})]]).inline().oneTime()
                        })
                    }
                }

                if(!context.player.status.match(/worker/))
                {
                    Data.users[context.player.id].status = "candidate"
                }
                context.player.waitingCitizenship = setTimeout(() => {
                    if(!context.player.status.match(/worker/))
                    {
                        Data.users[context.player.id].status = "stateless"
                    }
                }, 86400000)
                await context.send("✅ Заявка отправлена.\nПравитель или чиновники в течении 24 часов рассмотрят вашу кандидатуру и примут решение.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GetCitizenship", e)
            }
        })
    }

    async RefuseCitizenship(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.player.status.match(/official|leader/))
                {
                    await context.send("⚠ Правители и чиновники не могут отказаться от гражданства", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const firstAccept = await InputManager.InputBoolean(context, `❓ Вы точно хотите отказаться от гражданства фракции ${Data.GetCountryName(context.player.citizenship)}?\nПосле отказа ваш статус изменится на \"апатрид\" и пропадет прописка, ваше имущество останется у вас.`, current_keyboard)
                if(!firstAccept)
                {
                    await context.send("🚫 Отклонено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const secondAccept = await  InputManager.InputBoolean(context, "❓ Вы уверены?", current_keyboard)
                if(!secondAccept)
                {
                    await context.send("🚫 Отклонено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const country = await Country.findOne({where: {id: context.player.citizenship}})
                country.set({
                    population: country.population - 1
                })
                await country.save()
                await PlayerStatus.update({
                    citizenship: null,
                    registration: null
                },{where: {id: context.player.id}})
                if(!context.player.status.match(/worker/))
                {
                    Data.users[context.player.id].status = "stateless"
                    await Player.update({
                        status: "stateless"
                    },{where: {id: context.player.id}})
                }
                context.player.citizenship = null
                context.player.registration = null
                context.send("ℹ Теперь вы апатрид.", {keyboard: keyboard.build(await scenes.keyboard(context))})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/RefuseCitizenship", e)
            }
        })
    }

    async GetRegistration(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(context.player.registration === "candidate")
                {
                    await context.send("⚠ Вы уже подали заявку", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await api.api.messages.send({
                    user_id: Data.cities[context.player.location].leaderID,
                    random_id: Math.round(Math.random() * 100000),
                    message: `🪪 Игрок *id${context.player.id}(${context.player.nick}) подал заявку на прописку в вашем городе\n\n${context.player.GetInfo()}`,
                    keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "give_registration", item: context.player.id, parameter: context.player.location}), keyboard.declineCallbackButton({command: "decline_registration", item: context.player.id, parameter: context.player.location})]]).inline().oneTime()
                })
                context.player.registration = "candidate"
                context.player.waitingRegistration = setTimeout(() => {
                    context.player.registration = null
                }, 86400000)
                await context.send("✅ Заявка отправлена.\nГлава города в течении 24 часов рассмотрит вашу кандидатуру и примет решение.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GetRegistration", e)
            }
        })
    }

    async RefuseRegistration(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const firstAccept = await InputManager.InputBoolean(context, `❓ Вы точно хотите отказаться от прописки в городе ${Data.GetCityName(context.player.registration)}?`, current_keyboard)
                if(!firstAccept)
                {
                    await context.send("🚫 Отклонено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const secondAccept = await  InputManager.InputBoolean(context, "❓ Вы уверены?", current_keyboard)
                if(!secondAccept)
                {
                    await context.send("🚫 Отклонено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await PlayerInfo.update({registration: null},{where: {id: context.player.id}})
                context.player.registration = null
                context.send("ℹ Теперь вы без прописки.", {keyboard: keyboard.build(await scenes.keyboard(context))})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/RefuseRegistration", e)
            }
        })
    }

    async Transaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let kb = [
                    ["🔀 Игроку", "user"],
                    ["🔀 Городу", "city"]
                ]
                if(context.player.location === Data.countries[context.player.countryID].capitalID) kb.push(["🔀 Фракции", "country"])
                const action = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите, куда вы хотите отправить ресурсы", kb, current_keyboard)
                if(!action) return resolve()
                action === "user" && await this.UserToUserTransaction(context, current_keyboard)
                action === "city" && await this.UserToCityTransaction(context, current_keyboard)
                action === "country" && await this.UserToCountryTransaction(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/Transaction", e)
            }
        })
    }

    async UserToCountryTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `${context.player.GetResources()}\n\n2️⃣ Выберите какой ресурс вы хотите перевести в бюджет фракции ${Data.countries[context.player.countryID].GetName()}:`, resources, current_keyboard)
                if (!resource) return resolve()
                if(resource.match(/cancel/))
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.users[context.player.id][resource] === 0)
                {
                    context.send("⚠ У вас нет этого ресурса.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count
                if(Data.users[context.player.id][resource] > 1)
                {
                    count = await InputManager.InputInteger(context, `3️⃣ Введите количество (от 1 до ${Data.users[context.player.id][resource]} шт)`, current_keyboard, 1, Data.users[context.player.id][resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `4️⃣ Подтвердите перевод:\n\nКому: фракция ${Data.countries[context.player.countryID].GetName()}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddCountryResources(context.player.countryID, objOUT)
                await Data.AddPlayerResources(context.player.id, objIN)
                await api.SendMessage(Data.countries[context.player.countryID].leaderID, `✅ В бюджет фракции ${Data.countries[context.player.countryID].GetName()} поступил перевод:\n\nОт кого: *id${context.player.id}(${context.player.nick})\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/UserToCountryTransaction", e)
            }
        })
    }

    async UserToCityTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `${context.player.GetResources()}\n\n2️⃣ Выберите какой ресурс вы хотите перевести городу ${Data.cities[context.player.location].name}:`, resources, current_keyboard)
                if (!resource) return resolve()
                if(resource.match(/cancel/))
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.users[context.player.id][resource] === 0)
                {
                    context.send("⚠ У вас нет этого ресурса.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count
                if(Data.users[context.player.id][resource] > 1)
                {
                    count = await InputManager.InputInteger(context, `3️⃣ Введите количество (от 1 до ${Data.users[context.player.id][resource]} шт)`, current_keyboard, 1, Data.users[context.player.id][resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `4️⃣ Подтвердите перевод:\n\nКому: город ${Data.cities[context.player.location].name}\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddCityResources(context.player.location, objOUT)
                await Data.AddPlayerResources(context.player.id, objIN)
                await api.SendMessage(Data.cities[context.player.location].leaderID, `✅ В бюджет города ${Data.cities[context.player.location].name} поступил перевод:\n\nОт кого: *id${context.player.id}(${context.player.nick})\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/UserToCityTransaction", e)
            }
        })
    }

    async UserToUserTransaction(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "2️⃣ Кому вы хотите перевести ресурс?", current_keyboard)
                if(!user) return resolve()
                if(user.dataValues.id === context.player.id)
                {
                    context.send("🚫 Какой смысл переводить самому себе?", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await context.send(`*id${context.player.id}(Ваш) инвентарь:\n💵 Деньги:  ${context.player.money}\n🪨 Камень:${context.player.stone}\n🌾 Зерно:${context.player.wheat}\n🪵 Дерево:${context.player.wood}\n🌑 Железо:${context.player.iron}\n🪙 Медь:${context.player.copper}\n🥈 Серебро:${context.player.silver}\n💎 Алмазы:${context.player.diamond}`)
                const resources = [[keyboard.moneyButton, keyboard.diamondButton],
                    [keyboard.wheatButton, keyboard.woodButton, keyboard.stoneButton],
                    [keyboard.ironButton, keyboard.copperButton, keyboard.silverButton],
                    [keyboard.cancelButton]]
                const resource = await InputManager.ChooseButton(context, `3️⃣ Выберите какой ресурс вы хотите перевести игроку *id${user.dataValues.id}(${user.dataValues.nick}):`, resources, current_keyboard)
                if (!resource) return resolve()
                if(resource.match(/cancel/))
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.users[context.player.id][resource] === 0)
                {
                    context.send("⚠ У вас нет этого ресурса.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count
                if(Data.users[context.player.id][resource] > 1)
                {
                    count = await InputManager.InputInteger(context, `4️⃣ Введите количество (от 1 до ${Data.users[context.player.id][resource]} шт)`, current_keyboard, 1, Data.users[context.player.id][resource])
                    if(count === null) return resolve()
                }
                else
                {
                    count = 1
                }
                const accept = await InputManager.InputBoolean(context, `5️⃣ Подтвердите перевод:\n\nКому: *id${user.dataValues.id}(${user.dataValues.nick})\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {}
                let objOUT = {}
                objIN[resource] = count * -1
                objOUT[resource] = count

                await Data.AddPlayerResources(user.dataValues.id, objOUT)
                await Data.AddPlayerResources(context.player.id, objIN)
                await api.SendMessage(user.dataValues.id, `✅ Вам поступил перевод:\n\nОт кого: *id${context.player.id}(${context.player.nick})\nРесурс: ${NameLibrary.GetResourceName(resource)}\nКоличество: ${count} шт`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/UserToUserTransaction", e)
            }
        })
    }

    async GoToOtherCity(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(Data.cities[context.player.location].isSiege && context.player.status !== "worker")
                {
                    await context.send("🚫 Город находится под осадой", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.countries[context.player.countryID].isSiege && context.player.status !== "worker")
                {
                    await context.send("🚫 В фракции введено военное положение, перемещение между городами невозможно", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.countries[context.player.countryID].roadMap)
                {
                    await context.send(`ℹ Карта фракции ${Data.countries[context.player.countryID].GetName()}`, {attachment: Data.countries[context.player.countryID].roadMap})
                }
                const cityButtons = []
                const roads = await CityRoads.findAll({where: {fromID: context.player.location}, attributes: ["toID", "isBlocked", "time"]})
                if(context.player.status === "worker")
                {
                    const cities = Data.GetCountryCities(context.player.countryID)
                    for(const city of cities)
                    {
                        if(city.id !== context.player.location)
                        {
                            cityButtons.push([city.name, "ID" + city.id])
                        }
                    }
                }
                else
                {
                    for(const road of roads)
                    {
                        cityButtons.push([Data.cities[road.dataValues.toID].name, "ID" + road.dataValues.toID])
                    }
                }
                if(cityButtons.length === 0)
                {
                    await context.send("ℹ Вы находитесь в единственном городе фракции " + Data.GetCountryName(Data.GetCountryForCity(context.player.location).id))
                    return resolve()
                }
                let city = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите в какой город вы хотите отправиться", cityButtons, current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                city = Data.cities[city]
                let road = {time: 0}
                roads.forEach(key => {if(key.dataValues.toID === city.id) road = key.dataValues})
                if(road?.isBlocked)
                {
                    await context.send("ℹ В данный момент эта дорога перекрыта из-за ивента.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(city.isSiege && context.player.status !== "worker")
                {
                    await context.send("ℹ В данный момент город, в который вы хотите отправиться находится в осаде, въезд в него не возможен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, `2️⃣ Перемещение в другой город займет ${road?.time ? road?.time : 0} минут, на это время вы будете заморожены.\nПродолжить?`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(context.player.status === "worker")
                {
                    await context.send("🏙 Вы пришли в город " + city.name + "\n" + city.description, {attachment: city.photoURL, keyboard: keyboard.build(scenes.finishKeyboard(context))})
                    context.player.location = city.id
                    await PlayerStatus.update(
                        {location: city.id},
                        {where: {id: context.player.id}}
                    )
                    context.player.state = scenes.finish
                }
                else
                {
                    const time = new Date()
                    time.setMinutes(time.getMinutes() + parseInt(road.time))
                    context.player.lastActionTime = time
                    context.player.state = scenes.moving
                    context.send("ℹ Вы отправились в город " + city.name, {keyboard: keyboard.none})
                    context.player.timeout = setTimeout(async () => {
                        await context.send("🏙 Вы пришли в город " + city.name + "\n" + city.description, {attachment: city.photoURL, keyboard: keyboard.build(scenes.finishKeyboard(context))})
                        context.player.location = city.id
                        context.player.state = scenes.finish
                        await PlayerStatus.update(
                            {location: city.id},
                            {where: {id: context.player.id}}
                        )
                        if(city.notifications)
                        {
                            await api.SendMessage(city.leaderID, `ℹ Игрок ${context.player.GetName()} зашел в город ${city.name}`)
                        }
                    }, road.time * 60000)
                }
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GoToOtherCity", e)
            }
        })
    }

    async GoToOtherCountry(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                if(Data.cities[context.player.location].isSiege)
                {
                    await context.send("🚫 Город находится под осадой", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.countries[context.player.countryID].isSiege)
                {
                    await context.send("🚫 В фракции введено военное положение, выезд запрещен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await context.send("ℹ Карта дорог:", {attachment: Data.variables.roadMap})
                const playerPlace = Data.GetCountryForCity(context.player.location).id
                const roads = await CountryRoads.findAll({where: {fromID: playerPlace}})
                const countryButtons = []
                if(context.player.status === "worker")
                {
                    for(let i = 0; i < Data.countries?.length; i++)
                    {
                        if(Data.countries[i]?.id !== context.player.countryID && Data.countries[i])
                        {
                            countryButtons.push([Data.countries[i].name, "ID" + Data.countries[i].id])
                        }
                    }
                }
                else
                {
                    for(let i = 0; i < roads.length; i++)
                    {
                        countryButtons.push([Data.countries[roads[i].dataValues.toID].name, "ID" + roads[i].dataValues.toID])
                    }
                }
                if(countryButtons.length === 0)
                {
                    await context.send("ℹ Для того чтобы уехать из фракции нужна дорога, но из фракции, в которой вы находитесь, не ведет ни одна дорога.\nВсе вопросы о дорогах к Гейм-Мастерам")
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите в какую фракцию вы хотите отправиться", countryButtons, current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                let road = null
                roads.forEach(key => {if(key.dataValues.toID === country) road = key.dataValues})
                if(road?.isBlocked)
                {
                    await context.send("⚠ В данный момент эта дорога перекрыта из-за ивента.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.countries[country].isSiege)
                {
                    await context.send("⚠ В данный момент фракция, в которую вы хотите отправиться находится под блокадой, въезд в нее не возможен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let accept
                if (Data.countries[country].entranceFee !== 0 && context.player.status !== "worker")
                {
                    accept = await InputManager.InputBoolean(context, `ℹ Перемещение в ${Data.GetCountryName(country)} займет ${road.time} минут, на это время вы будете заморожены.\nУ фракции ${Data.GetCountryName(country)} есть входная пошлина в размере ${Data.countries[country].entranceFee} монет\nПродолжить?`, current_keyboard)
                    if(context.player.money - Data.countries[country].entranceFee < 0)
                    {
                        await context.send("⚠ У вас не хватает средств для оплаты входной пошлины", {keyboard: keyboard.build(current_keyboard)})
                        return resolve()
                    }
                }
                else
                {
                    accept = await InputManager.InputBoolean(context, `ℹ Перемещение в ${Data.GetCountryName(country)} займет ${road?.time ? road?.time : 0} минут, на это время вы будете заморожены, а повернуть назад невозможно.\nПродолжить?`, current_keyboard)
                }
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(context.player.status === "worker")
                {
                    await context.send("🏙 Вы пришли в город " + Data.GetCityName(Data.countries[country].capitalID) + "\n" + Data.cities[Data.countries[country].capitalID].description, {attachment: Data.countries[country].welcomePhotoURL, keyboard: keyboard.build(scenes.finishKeyboard(context))})
                    context.player.location = Data.countries[country].capitalID
                    context.player.countryID = Data.countries[country].id
                    await PlayerStatus.update(
                        {location: Data.countries[country].capitalID, countryID: Data.countries[country].id},
                        {where: {id: context.player.id}}
                    )
                    context.player.state = scenes.finish
                }
                else
                {
                    const time = new Date()
                    time.setMinutes(time.getMinutes() + road.time)
                    context.player.state = scenes.moving
                    await context.send("ℹ Вы отправились в фракцию " + Data.countries[country].GetName(), {keyboard: keyboard.none})
                    context.player.lastActionTime = time
                    context.player.timeout = setTimeout(async () => {
                        await context.send("🏙 Вы пришли в город " + Data.GetCityName(Data.countries[country].capitalID) + "\n" + Data.cities[Data.countries[country].capitalID].description, {attachment: Data.countries[country].welcomePhotoURL, keyboard: keyboard.build(scenes.finishKeyboard(context))})
                        context.player.location = Data.countries[country].capitalID
                        context.player.countryID = Data.countries[country].id
                        if (Data.countries[country].entranceFee !== 0)
                        {
                            await Data.AddPlayerResources(context.player.id, {money: -Data.countries[country].entranceFee})
                            await Data.AddCountryResources(country, {money: Data.countries[country].entranceFee})
                        }
                        await PlayerStatus.update(
                            {location: Data.countries[country].capitalID, countryID: Data.countries[country].id},
                            {where: {id: context.player.id}}
                        )
                        if(Data.countries[country].notifications)
                        {
                            await api.SendMessage(Data.countries[country].leaderID, `ℹ Игрок ${context.player.GetName()} зашел в вашу фракцию ${Data.countries[country].name}`)
                        }
                        if(Data.cities[Data.countries[country].capitalID].notifications)
                        {
                            await api.SendMessage(Data.cities[Data.countries[country].capitalID].leaderID, `ℹ Игрок ${context.player.GetName()} зашел в город ${Data.cities[Data.countries[country].capitalID].name}`)
                        }
                        context.player.state = scenes.finish
                    }, road.time * 60000)
                }
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GoToOtherCountry", e)
            }
        })
    }

    async GiveKey(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const keys = await Keys.findAll({where: {ownerID: context.player.id}})
                const keysButton = []
                if(keys.length === 0)
                {
                    await context.send("⚠ У вас нет ключей", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const user = await InputManager.InputUser(context, "1️⃣ Кому вы хотите отдать этот ключ?", current_keyboard)
                if(!user) return resolve()
                if(await Data.PlayersAreNearby(context.player.id, user.dataValues.id))
                {
                    await context.send("⚠ Вы находитесь в разных городах", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                for(let i = 0; i < keys.length; i++)
                {
                    keysButton.push([keys[i].dataValues.name, "ID" + keys[i].dataValues.id])
                }
                let key = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите ключ, который вы хотите передать", keysButton, current_keyboard)
                if(!key) return resolve()
                key = Data.ParseButtonID(key)
                await Keys.update({ownerID: user.dataValues.id}, {where: {id: key}})
                await context.send("✅ Ключ отдан.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GiveKey", e)
            }
        })
    }

    async CopyKey(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const keys = await Keys.findAll({where: {ownerID: context.player.id}})
                const keysButton = []
                if(keys.length === 0)
                {
                    await context.send("⚠ У вас нет ключей", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                for(let i = 0; i < keys.length; i++)
                {
                    keysButton.push([keys[i].dataValues.name, "ID" + keys[i].dataValues.id])
                }
                let key = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите ключ, дубликат которого вы хотите сделать.\n\n" + context.player.GetResources() + "\n\nСтоимость:\n" + NameLibrary.GetPrice(Prices["copy_key"]), keysButton, current_keyboard)
                if(!key) return resolve()
                if (!context.player.CanPay(Prices["copy_key"]))
                {
                    await context.send("⚠ У вас не хватает ресурсов", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddPlayerResources(context.player.id, Prices["copy_key"])
                key = Data.ParseButtonID(key)
                keys.forEach((i) => {if(parseInt(i.dataValues.id)  === parseInt(key)) key = i.dataValues})
                await Keys.create({
                    houseID: key.houseID,
                    ownerID: key.ownerID,
                    name: key.name.includes("-дубликат") ? key.name : key.name + "-дубликат"
                })
                await context.send("✅ Ключ продублирован.", {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CopyKey", e)
            }
        })
    }
    async GetAllProperty(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const buildings = await Buildings.findAll({where: {ownerID: context.player.id}})
                let request = "ℹ *id"+ context.player.id +"(Ваши) постройки:\n"
                for(let i = 0; i < buildings.length; i++)
                {
                    request += (i+1) +
                        ": " +
                        NameLibrary.GetBuildingType(buildings[i].dataValues.type) +
                        " \"" +
                        buildings[i].dataValues.name +
                        "\" " +
                        buildings[i].dataValues.level +
                        " ур, г. " +
                        Data.GetCityName(buildings[i].dataValues.cityID) +
                        "\n"
                }
                if(buildings.length === 0)
                {
                    request += "⛺ У вас нет построек\n"
                }

                const keys = await Keys.findAll({where: {ownerID: context.player.id}})
                request += "\nℹ *id"+ context.player.id +"(Ваши) ключи:\n"
                for(let i = 0; i < keys.length; i++)
                {
                    request += "🔸 " + keys[i].dataValues.name + "\n"
                }
                if(keys.length === 0)
                {
                    request += "📎 У вас нет ключей"
                }

                await context.send(request, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GetAllProperty", e)
            }
        })
    }

    async NewUserBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const country = Data.GetCountryForCity(context.player.location)
                if(parseInt(context.player.citizenship) !== country.id)
                {
                    await context.send("⚠ Вы не являетесь гражданином фракции " + Data.GetCountryName(country.id), {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const buildingButtons = [
                    ["🏠 Жилой дом", "house"],
                    ["🏦 Банк", "bank"]
                ]
                country.resources.match(/wheat/) && buildingButtons.push(["🌾 Сельское хозяйство", "wheat"])
                country.resources.match(/stone/) && buildingButtons.push(["🪨 Каменоломня", "stone"])
                country.resources.match(/wood/) && buildingButtons.push(["🪵 Лесозаготовки", "wood"])
                country.resources.match(/iron/) && buildingButtons.push(["🌑 Железный рудник", "iron"])
                country.resources.match(/silver/) && buildingButtons.push(["🥈 Серебряный рудник", "silver"])

                let request = "Цены на постройки:\n\n"
                request += context.player.GetResources() + "\n\n"
                buildingButtons.forEach(key => {
                    request += key[0] + ":\n" + NameLibrary.GetPrice(Prices["new_" + key[1]]) + "\n"
                })
                const building = await InputManager.KeyboardBuilder(context, request + "\n1️⃣ Какую постройку вы хотите возвести?\n\n⚠ Любая постройка кроме жилого дома занимает полезное место в городе, поэтому для строительства вам надо получить разрешение от главы города.\n\n⚠ Если вы прописаны в этом городе, то можно не получать разрешение на строительство от главы города.", buildingButtons, current_keyboard)
                if(!building) return resolve()
                if(!context.player.CanPay(Prices["new_" + building]))
                {
                    await context.send("⚠ У вас не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(Data.cities[context.player.location].buildingsScore >= Data.cities[context.player.location].maxBuildings && building !== "house")
                {
                    await context.send("⚠ В городе не осталось мест для строительства нового здания.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const name = await InputManager.InputString(context, "2️⃣ Назовите свою постройку. (от 2 до 100 символов)", current_keyboard, 2, 100)
                if(!name) return resolve()
                const description = await InputManager.InputString(context, "3️⃣ Сделайте описание постройки. (чтобы пропустить - нажмите \"отмена\")", current_keyboard, 2, 100)
                await Data.AddPlayerResources(context.player.id, Prices["new_" + building])
                const build = await Buildings.create({
                    cityID: context.player.location,
                    name: name,
                    description: description,
                    type: "building_of_" + building,
                    ownerID: context.player.id,
                    ownerType: "user",
                    level: 1,
                    freezing: (parseInt(context.player.location) !== parseInt(context.player.registration)) && building === "house"
                })
                if(parseInt(context.player.location) === parseInt(context.player.registration) && building === "house")
                {
                    await Data.LoadBuildings()
                    await Keys.create({
                        houseID: build.dataValues.id,
                        ownerID: context.player.id,
                        name: "🔑 " + build.dataValues.name
                    })
                    await context.send("✅ Постройка возведена. Вам выдан ключ от нее.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                else
                {
                    if(!context.player.waitingAllowBuilding) context.player.waitingAllowBuilding = []
                    context.player.waitingAllowBuilding.push([
                        build.dataValues.id,
                        setTimeout(async () =>
                        {
                            const price = NameLibrary.ReversePrice(Prices["new_" + building])
                            await Data.AddPlayerResources(context.player.id, price)
                            await Buildings.destroy({where: {id: build.dataValues.id}})
                            await context.send(`⚠ Время ожидания одобрения строительства постройки \"${NameLibrary.GetBuildingType(build.dataValues.type)}\" вышло, ресурсы возвращены.`)
                            let length = 0
                            for(let i = 0; i < context.player.waitingAllowBuilding?.length; i++)
                            {
                                if(context.player.waitingAllowBuilding[i])
                                {
                                    length ++
                                }
                            }
                            if(length === 0)
                            {
                                context.player.waitingAllowBuilding = null
                            }
                        }, 86400000)
                    ])
                    await api.api.messages.send({
                        user_id: Data.GetCity(context.player.location).leaderID,
                        random_id: Math.round(Math.random() * 100000),
                        message: `Игрок ${context.player.GetName()} хочет построить ${NameLibrary.GetBuildingType(build.dataValues.type)}.\n\n${context.player.GetInfo()}\n\n Разрешить строительство?`,
                        keyboard: keyboard.build([[keyboard.acceptCallbackButton({command: "allow_user_building", item: context.player.id, parameter: build.dataValues.id}), keyboard.declineCallbackButton({command: "decline_user_building", item: context.player.id, parameter: build.dataValues.id})]]).inline().oneTime()
                    })
                    await context.send("✅ Заявка на возведение постройки подана, ресурсы зарезервированы", {keyboard: keyboard.build(current_keyboard)})
                }
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/NewUserBuilding", e)
            }
        })
    }

    async UpgradeUserBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const buildings = await Buildings.findAll({where: {ownerID: context.player.id}})
                if(buildings.length === 0)
                {
                    await context.send("⚠ У вас нет построек.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let request = "🏢 Ваши постройки:\n"
                const buildingButtons = []
                for(let i = 0; i < buildings.length; i++)
                {
                    buildingButtons.push([NameLibrary.GetBuildingEmoji(buildings[i].dataValues.type) + buildings[i].dataValues.name, "ID" + buildings[i].dataValues.id])
                    request += `${NameLibrary.GetBuildingType(buildings[i].dataValues.type)} \"${buildings[i].dataValues.name}\" ${buildings[i].dataValues.level} уровня\n`
                }
                let building = await InputManager.KeyboardBuilder(context, request, buildingButtons, current_keyboard)
                if(!building) return resolve()

                building = Data.ParseButtonID(building)
                buildings.forEach(key => {if(parseInt(key.dataValues.id) === parseInt(building)) building = key.dataValues})
                if(building.level >= 4)
                {
                    await context.send(`⚠ ${NameLibrary.GetBuildingType(building.type)} \"${building.name}\" имеет максимальный уровень улучшения.`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await context.send(`ℹ Улучшение для ${NameLibrary.GetBuildingType(building.type)} \"${building.name}\":\n ${building.level} уровень => ${building.level + 1} уровень\n${NameLibrary.GetPrice(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])}`)
                if(!context.player.CanPay(Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)]))
                {
                    await context.send("⚠ У вас не хватает ресурсов.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const accept = await InputManager.InputBoolean(context, "Продолжить?", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Data.AddPlayerResources(context.player.id ,Prices[building.type.replace("building_of_", "") + "_lvl" + (building.level + 1)])
                await Buildings.update({level: building.level + 1}, {where: {id: building.id}})
                for(let i = 0; i < Data.buildings[building.cityID].length; i++)
                {
                    if(Data.buildings[building.cityID][i].id === building.id)
                    {
                        Data.buildings[building.cityID][i].Upgrade(building.level + 1)
                        break
                    }
                }
                await context.send(`✅ Постройка улучшена до ${building.level + 1} уровня.`, {keyboard: keyboard.build(current_keyboard)})
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/UpgradeUserBuilding", e)
            }
        })
    }

    async EnterBuilding(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const keys = await Keys.findAll({where: {ownerID: context.player.id}})
                let request = "ℹ Постройки в городе " + Data.GetCityName(context.player.location) + " :\n"
                const buildingButtons = []
                if(!Data.buildings[context.player.location])
                {
                    await context.send("⛺ В городе нет построек", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                for(let i = 0; i < Data.buildings[context.player.location].length; i++)
                {
                    request += (i+1) + ": " + NameLibrary.GetBuildingType(Data.buildings[context.player.location][i].type) + " \"" + Data.buildings[context.player.location][i].name + "\" " + Data.buildings[context.player.location][i].level + " уровня\n"
                    if(Data.officials[context.player.countryID] || context.player.id === Data.countries[context.player.countryID].leaderID)
                    {
                        if(Data.officials[context.player.countryID][context.player.id]?.canUseResources || context.player.id === Data.countries[context.player.countryID].leaderID)
                        {
                            if(Data.buildings[context.player.location][i].type.match(/mint/))
                            {
                                buildingButtons.push([NameLibrary.GetBuildingEmoji(Data.buildings[context.player.location][i].type) + Data.buildings[context.player.location][i].name, "ID" + Data.buildings[context.player.location][i].id])
                                continue
                            }
                        }
                    }
                    for(let j = 0; j < keys.length; j++)
                    {
                        if(keys[j].dataValues.houseID === Data.buildings[context.player.location][i].id)
                        {
                            buildingButtons.push([NameLibrary.GetBuildingEmoji(Data.buildings[context.player.location][i].type) + Data.buildings[context.player.location][i].name, "ID" + Data.buildings[context.player.location][i].id])
                            break
                        }
                    }
                }
                if(buildingButtons.length === 0)
                {
                    await context.send(request + "🏘 В городе нет построек, которые вы можете посетить.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let building = await InputManager.KeyboardBuilder(context, request + "\nℹ Выберите, куда вы хотите зайти.", buildingButtons, current_keyboard)
                if(!building) return resolve()
                building = Data.ParseButtonID(building)
                for(let i = 0; i < Data.buildings[context.player.location].length; i++)
                {
                    if(parseInt(Data.buildings[context.player.location][i].id) === parseInt(building))
                    {
                        context.player.inBuild = Data.buildings[context.player.location][i]
                        context.player.state = scenes.build
                        context.send("Вы зашли в " + NameLibrary.GetBuildingType(context.player.inBuild.type) + " \"" + context.player.inBuild.name + "\"", {keyboard: keyboard.build(scenes.buildKeyboard(context))})
                    }
                }
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/EnterBuilding", e)
            }
        })
    }

    async GetResourcesFormBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const time = new Date()
                if(context.player.inBuild.lastActivityTime - time > 0)
                {
                    await context.send("👀 Ресурсы еще не добыты, приходите через " + NameLibrary.ParseFutureTime(context.player.inBuild.lastActivityTime), {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                time.setHours(time.getHours() + 6)
                const country = Data.GetCountryForCity(context.player.inBuild.cityID)
                const resource = context.player.inBuild.type.replace("building_of_", "")
                let playerBalance = {}
                let cityBalance = {}
                let extraction = NameLibrary.GetFarmRandom(resource + "_lvl" + context.player.inBuild.level)
                const extractionTax = parseInt(context.player.citizenship) === parseInt(country.id) ? country.citizenTax : country.nonCitizenTax
                const tax = Math.round(extraction * (extractionTax * 0.01))
                extraction -= tax
                playerBalance[resource] = extraction
                cityBalance[resource] = tax
                await Data.AddPlayerResources(context.player.id, playerBalance)
                await Data.AddCityResources(context.player.location, cityBalance)
                context.player.inBuild.lastActivityTime = time
                await context.send("ℹ Собрано: " + NameLibrary.GetPrice(NameLibrary.ReversePrice(playerBalance)) + "\nНалог составил: " + NameLibrary.GetPrice(cityBalance) + "(" + extractionTax + "%)", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GetResourcesFormBuilding", e)
            }
        })
    }

    async GetChangeSilverInMintBuilding(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let time = new Date()
                if(context.player.inBuild.lastActivityTime - time > 0)
                {
                    await context.send("ℹ Монетный двор пока занят чеканкой монет, приходите через " + NameLibrary.ParseFutureTime(context.player.inBuild.lastActivityTime), {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                if(context.player.silver === 0)
                {
                    await context.send("⚠ У вас нет серебра для размена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const lvls = {
                    1: {from: 0.4, to: 0.6, max: 125},
                    2: {from: 0.45, to: 0.6, max: 250},
                    3: {from: 0.5, to: 0.6, max: 500},
                    4: {from: 0.55, to: 0.6, max: 1000}
                }
                let request = `Сейчас вы можете отчеканить из своего серебра монеты. \n\nМонетный двор имеет оборудование ${context.player.inBuild.level} уровня, это значит что КПД от чеканки будет от ${Math.round(lvls[context.player.inBuild.level].from * 100)} до ${Math.round(lvls[context.player.inBuild.level].to * 100)} процентов.\nМаксимально можно до ${lvls[context.player.inBuild.level].max} серебра единоразово.`
                const silver = await InputManager.InputInteger(context, request + `\nℹ У вас на счету ${context.player.silver} серебра.\n\nВведите количество серебра, которое вы хотите запустить на чеканку. Имейте ввиду, если загрузить слишком мало (< 2), то из-за шанса брака вы можете не получить монет.\nДоступный для ввода диапазон: от 1 до ${Math.min(lvls[context.player.inBuild.level].max, context.player.silver)}`, 1, Math.min(lvls[context.player.inBuild.level].max, context.player.silver))
                if(!silver) return resolve()
                const accept = await InputManager.InputBoolean(context, `❓ Обменять ${silver} серебра на монеты?`)
                if(!accept) return resolve()
                let seconds = Math.round(silver * (21600 / lvls[context.player.inBuild.level].max))
                time.setSeconds(time.getSeconds() + seconds)
                context.player.inBuild.lastActivityTime = time
                const extraction = NameLibrary.GetRandomNumb(Math.round(silver * lvls[context.player.inBuild.level].from), Math.round(silver * lvls[context.player.inBuild.level].to))
                await Data.AddPlayerResources(context.player.id, {money: extraction, silver: -silver})
                await Data.AddCityResources(context.player.location, {silver: silver})
                await context.send(`✅ Из ${silver} серебра отчеканено ${extraction} монет`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GetChangeSilverInMintBuilding", e)
            }
        })
    }

    async RelaxInTheHouse(context, current_keyboard, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                let need
                switch (context.player.inBuild.level)
                {
                    case 1:
                        need = (100 - context.player.fatigue) * 3.3
                        break
                    case 2:
                        need = (100 - context.player.fatigue) * 3.0
                        break
                    case 3:
                        need = (100 - context.player.fatigue) * 2.7
                        break
                    case 4:
                        need = (100 - context.player.fatigue) * 2.4
                        break
                }
                if(need === 0)
                {
                    await context.send("💪 Вы полны сил.", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const time = new Date()
                time.setMinutes(time.getMinutes() + need)
                context.player.lastActionTime = time
                if (context.player.timeout)
                {
                    clearTimeout(context.player.timeout)
                }
                context.player.timeout = setTimeout(() => {
                    context.send("☕ С добрым утром, теперь вы полны сил.", {
                        keyboard: keyboard.build(current_keyboard)
                    })
                    context.player.fatigue = 100
                    context.player.isFreezed = false
                    context.player.inBuild = null
                    context.player.state = scenes.Menu
                }, need * 60000)
                context.player.state = scenes.Relaxing
                context.player.isFreezed = true
                await context.send(`💤 Спокойной ночи, до полного восстановления сил ${NameLibrary.ParseFutureTime(time)}`,
                    {
                        keyboard: keyboard.build([[keyboard.checkTimeButton], [keyboard.wakeupButton]])
                    })
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/RelaxInTheHouse", e)
            }
        })
    }

    async FillingOutTheRoad(context, current_keyboard, inputData, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const road = await CityRoads.findOne({where: {id: inputData.roadFromID}})
                if(road?.dataValues.isBlocked)
                {
                    let time = await InputManager.InputInteger(context, "1️⃣ Введите в минутах время перемещения по дороге. (Требуется ввести целое значение)", current_keyboard, 1)
                    if(time === null) return resolve(false)
                    await CityRoads.update({time: time, isBlocked: false}, {where: {id: inputData.roadFromID}})
                    await CityRoads.update({time: time, isBlocked: false}, {where: {id: inputData.roadToID}})
                    await context.send("✅ Принято, спасибо за участие.", {keyboard: keyboard.build(current_keyboard)})
                    context.player.state = scenes.startMenu
                    return resolve(true)
                }
                else
                {
                    await context.send("⚠ Кто-то из ГМ-ов уже заполнил данные вместо вас, спасибо за участие.", {keyboard: keyboard.build(current_keyboard)})
                    context.player.state = scenes.startMenu
                    return resolve(true)
                }
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/FillingOutTheRoad", e)
            }
        })
    }

    async SQLSession(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = "ℹ Вы введены в режим SQL-терминала\n\nℹ Введите SQL-запрос, если вы не знаете что это такое, то лучше это не трогать."
                let query = null
                do
                {
                    try
                    {
                        query = await InputManager.InputString(context, request, current_keyboard)
                        if(!query) break
                        query = await sequelize.query(query)
                        if(query[0]) request = JSON.stringify(query[0], null, "\t")
                        else request = "🚫 Не обработанная ошибка"
                    }
                    catch (e)
                    {
                        await context.send("🚫 Ошибка: " + e.message)
                        request = "ℹ Введите запрос повторно"
                    }
                }
                while(query)
                await context.send("ℹ Сеанс завершен.", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/SQLSession", e)
            }
        })
    }

    async SendLog(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const log = await InputManager.InputString(context, "1️⃣ Введите название файла", current_keyboard)
                if(!log) return resolve()
                try
                {
                    const file = await upload.messageDocument({
                        peer_id: context.player.id,
                        source: {
                            value: "./logs/" + log
                        },
                        title: log
                    })
                    await context.send("✅ Лови:", {attachment: file, keyboard: keyboard.build(current_keyboard)})
                }
                catch (e)
                {
                    await context.send("⚠ Файл не найден", {keyboard: keyboard.build(current_keyboard)})
                }
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/SendLog", e)
            }
        })
    }

    async SendLogList(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const logs = fs.readdirSync("./logs/")
                let request = "ℹ Список логов:\n\n"
                logs.forEach(key => {
                    request += "🔸 " + key + "\n"
                })
                if(logs.length === 0) request += "⭕ Пусто"
                await context.send(request, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/SendLogList", e)
            }
        })
    }

    async ClearLogs(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                fs.readdir("./logs/", (err, files) => {
                    if (err) throw err;

                    for (const file of files) {
                        fs.unlink(path.join("./logs/", file), (err) => {
                            if (err) throw err;
                        });
                    }
                })
                await context.send("✅ Логи очищены.", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ClearLogs", e)
            }
        })
    }

    async ClearUserCache(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const accept = await InputManager.InputBoolean(context, "⚠ Вы действительно хотите очистить кэш пользователей?\n\n⚠⚠⚠ Это приведет к выбрасыванию всех игроков в главное меню, усталость всех игроков сбросится, те игроки, что спят или куда-то идут, окажутся в главном меню и не получат уведомления об окончании процесса.", current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                Data.users = {}
                await context.send("✅ Кэш пользователей очищен", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ClearUserCache", e)
            }
        })
    }

    async ChangeMap(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const kb = [
                    ["🗺 Карта мира", "global_map"],
                    ["🌐 Карта дорог", "road_map"],
                    ["🗾 Карта фракции", "country_map"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите тип карты, которую вы хотите поменять", kb, current_keyboard)
                if(!action) return resolve()

                action === "global_map" && await this.ChangeGlobalMap(context, current_keyboard)
                action === "road_map" && await this.ChangeRoadMap(context, current_keyboard)
                action === "country_map" && await this.ChangeCountryMap(context, current_keyboard)

                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeMap", e)
            }
        })
    }

    async ChangeGlobalMap(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const newMap = await InputManager.InputPhoto(context, "2️⃣ Отправьте новую карту", current_keyboard)
                if(!newMap) return resolve()
                Data.variables.globalMap = newMap
                await Data.SaveVariables()
                await context.send("✅ Карта обновлена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeMap", e)
            }
        })
    }

    async ChangeRoadMap(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const newMap = await InputManager.InputPhoto(context, "2️⃣ Отправьте новую карту", current_keyboard)
                if(!newMap) return resolve()
                Data.variables.roadMap = newMap
                await Data.SaveVariables()
                await context.send("✅ Карта обновлена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeMap", e)
            }
        })
    }

    async ChangeCountryMap(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const newMap = await InputManager.InputPhoto(context, "3️⃣ Отправьте новую карту", current_keyboard)
                if(!newMap) return resolve()
                country.map = newMap
                await Country.update({map: newMap}, {where: {id: country.id}})
                await Data.SaveVariables()
                await context.send("✅ Карта обновлена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeMap", e)
            }
        })
    }

    async ChangeVariables(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const vars = Object.keys(Data.variables)
                const varButtons = []
                let request = "ℹ Список переменных:\n\n"
                for(let i = 0; i < vars.length; i++)
                {
                    varButtons.push([vars[i], vars[i]])
                    request += "🔸 " + vars[i] + "   =   " + Data.variables[vars[i]] + "\n"
                }
                request += "\nℹ Выберите переменную которую хотите изменить"
                const variable = await InputManager.KeyboardBuilder(context, request, varButtons, current_keyboard)
                if(!variable) return resolve()
                const newValue = await InputManager.InputString(context, "1️⃣ Введите новое значение переменной " + variable, current_keyboard)
                if(!newValue) return resolve()
                Data.variables[variable] = newValue
                await Data.SaveVariables()
                await context.send("✅ Сохранено новое значение переменной", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeVariables", e)
            }
        })
    }

    async AddMessage(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const text = await InputManager.InputString(context, "1️⃣ Введите текст сообщения, это сообщение смогут видеть все игроки по нажатию кнопки \"Сообщения\" в меню", current_keyboard, 1)
                if(!text) return resolve()
                const isNoisy = await InputManager.InputBoolean(context, "2️⃣ Отправить уведомление о новом сообщении?\n\n🔸 Да - Всем подписанным на уведомления игрокам придет оповещение о новом сообщении\n🔸 Нет - Сообщение отправится без уведомления подписанных игроков, посмотреть его можно будет только через меню сообщений", current_keyboard)
                const accept = await InputManager.InputBoolean(context, `3️⃣ Проверьте сообщение:\n\nТекст:\n${text}\nТихое сообщение: ${isNoisy ? "Нет" : "Да"}`, current_keyboard)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await Messages.create({
                    text: text,
                    isSilent: !isNoisy
                })
                if(isNoisy)
                {
                    const subscribedUsers = await PlayerStatus.findAll({where: {notifications: true}, attributes: ["id"]})
                    await context.send("✅ Начинаю отправку, время отправки зависит от количества игроков")
                    for(const user of subscribedUsers)
                    {
                        await api.SendNotification(user.dataValues.id, "ℹНовое объявление!\n\n" + text + "\n\nℹПри желании вы можете отписаться от рассылки в Меню>>Параметры>>Отключить уведомления")
                    }
                }
                await context.send("✅ Сообщение отправлено", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/AddMessage", e)
            }
        })
    }

    async RoadControls(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const kb = [
                    ["➕ Новая гос дорога", "create_country_road"],
                    ["⏳ Изменить гос дорогу", "edit_country_road"],
                    ["🚳 Удалить гос дорогу", "delete_country_road"],
                    ["⏳ Изменить гор дорогу", "edit_city_road"],
                    ["🚳 Удалить гор дорогу", "delete_city_road"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action === "create_country_road" && await this.CreateRoad(context, current_keyboard)
                action === "edit_country_road" && await this.ChangeTheRoad(context, current_keyboard)
                action === "delete_country_road" && await this.DeleteRoad(context, current_keyboard)
                action === "edit_city_road" && await this.ChangeCityRoad(context, current_keyboard)
                action === "delete_city_road" && await this.DeleteCityRoad(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeTheRoad", e)
            }
        })
    }

    async DeleteCityRoad(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const roads = await CityRoads.findAll({where: {fromID: Data.cities.filter(city => {return city.countryID === country.id}).map(city => {return city.id})}})
                let request = "ℹ ID городов:\n\n"
                const roadButtons = []
                Data.cities.filter(city => {return city.countryID === country.id}).forEach(city => {request += "🔸 " + city.name + "  -  " + city.id + "\n"})
                request += "\nℹ Дороги удаляются попарно, если изменить дорогу A->B, то изменится и дорога B->A"
                for(let i = 0; i < roads.length; i++)
                {
                    roadButtons.push([roads[i].dataValues.fromID + " -> " + roads[i].dataValues.toID, "ID" + i])
                }
                if(roadButtons.length === 0)
                {
                    await context.send(`⚠ В фракции ${country.GetName()} нет междугородних дорог`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let road = await InputManager.KeyboardBuilder(context, request, roadButtons, current_keyboard)
                if(!road) return resolve()
                road = Data.ParseButtonID(road)
                road = roads[road]
                const time = await InputManager.InputBoolean(context, `❓ Вы действительно хотите удалить дорогу соединяющую города ${Data.cities[road.dataValues.fromID].name} и ${Data.cities[road.dataValues.toID].name}?`, current_keyboard, 0)
                if(!time) return resolve()
                await CityRoads.destroy({where: {fromID: road.dataValues.fromID, toID: road.dataValues.toID}})
                await CityRoads.destroy({where: {fromID: road.dataValues.toID, toID: road.dataValues.fromID}})
                await context.send("✅ Дорога удалена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeCityRoad", e)
            }
        })
    }

    async ChangeCityRoad(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const roads = await CityRoads.findAll({where: {fromID: Data.cities.filter(city => {return city.countryID === country.id}).map(city => {return city.id})}})
                let request = "ℹ ID городов:\n\n"
                const roadButtons = []
                Data.cities.filter(city => {return city.countryID === country.id}).forEach(city => {request += "🔸 " + city.name + "  -  " + city.id + "\n"})
                request += "\nℹ Дороги изменяются попарно, если изменить дорогу A->B, то изменится и дорога B->A"
                for(let i = 0; i < roads.length; i++)
                {
                    roadButtons.push([roads[i].dataValues.fromID + " -> " + roads[i].dataValues.toID, "ID" + i])
                }
                if(roadButtons.length === 0)
                {
                    await context.send(`⚠ В фракции ${country.GetName()} нет междугородних дорог`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let road = await InputManager.KeyboardBuilder(context, request, roadButtons, current_keyboard)
                if(!road) return resolve()
                road = Data.ParseButtonID(road)
                road = roads[road]
                const time = await InputManager.InputInteger(context, "Введите в минутах новое значение времени перемещения по этой дороге", current_keyboard, 0)
                if(time === null) return resolve()
                await CityRoads.update({time: time}, {where: {fromID: road.dataValues.fromID, toID: road.dataValues.toID}})
                await CityRoads.update({time: time}, {where: {fromID: road.dataValues.toID, toID: road.dataValues.fromID}})
                await context.send("✅ Дорога изменена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeCityRoad", e)
            }
        })
    }

    async DeleteRoad(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const roads = await CountryRoads.findAll()
                let request = "ID фракций:\n\n"
                const roadButtons = []
                for(let i = 0; i < Data.countries.length; i++)
                {
                    if(Data.countries[i])
                    {
                        request += "🔸 " + Data.countries[i].GetName() + "  -  " + Data.countries[i].id + "\n"
                    }
                }
                request += "\nℹ Дороги удаляются попарно, если удалить дорогу A->B, то удалится и дорога B->A"
                for(let i = 0; i < roads.length; i++)
                {
                    roadButtons.push([roads[i].dataValues.fromID + " -> " + roads[i].dataValues.toID, "ID" + i])
                }
                let road = await InputManager.KeyboardBuilder(context, request, roadButtons, current_keyboard)
                if(!road) return resolve()
                road = Data.ParseButtonID(road)
                road = roads[road]
                const accept = await InputManager.InputBoolean(context, `❓ Удалить дорогу соединяющую ${Data.countries[road.dataValues.fromID].GetName()} и ${Data.countries[road.dataValues.toID].GetName()}`)
                if(!accept)
                {
                    await context.send("🚫 Отменено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                await CountryRoads.destroy({where: {fromID: road.dataValues.fromID, toID: road.dataValues.toID}})
                await CountryRoads.destroy({where: {fromID: road.dataValues.toID, toID: road.dataValues.fromID}})
                await context.send("✅ Дорога удалена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/DeleteRoad", e)
            }
        })
    }

    async CreateRoad(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const firstCountryButtons = Data.GetCountryButtons()
                let firstCountry = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите первую фракцию", firstCountryButtons, current_keyboard)
                if(!firstCountry) return resolve()
                firstCountry = Data.ParseButtonID(firstCountry)
                firstCountry = Data.countries[firstCountry]
                const secondCountryButtons = firstCountryButtons.filter(key => {return key[0] !== firstCountry.name})
                let secondCountry = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите вторую фракцию", secondCountryButtons, current_keyboard)
                if(!secondCountry) return resolve()
                secondCountry = Data.ParseButtonID(secondCountry)
                secondCountry = Data.countries[secondCountry]
                const road = await CountryRoads.count({where: {fromID: firstCountry.id, toID: secondCountry.id}})
                if(road !== 0)
                {
                    await context.send("⚠ Такая дорога уже существует", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const time = await InputManager.InputInteger(context, "3️⃣ Введите в минутах новое значение времени перемещения по этой дороге", current_keyboard, 0)
                if(time === null) return resolve()
                await CountryRoads.create({
                    time: time,
                    fromID: firstCountry.id,
                    toID: secondCountry.id,
                    isBlocked: false
                })
                await CountryRoads.create({
                    time: time,
                    fromID: secondCountry.id,
                    toID: firstCountry.id,
                    isBlocked: false
                })
                await context.send("✅ Дорога создана", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CreateRoad", e)
            }
        })
    }

    async ChangeTheRoad(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const roads = await CountryRoads.findAll()
                let request = "ℹ ID фракций:\n\n"
                const roadButtons = []
                for(let i = 0; i < Data.countries.length; i++)
                {
                    if(Data.countries[i])
                    {
                        request += "🔸 " + Data.countries[i].GetName() + "  -  " + Data.countries[i].id + "\n"
                    }
                }
                request += "\nℹ Дороги изменяются попарно, если изменить дорогу A->B, то изменится и дорога B->A"
                for(let i = 0; i < roads.length; i++)
                {
                    roadButtons.push([roads[i].dataValues.fromID + " -> " + roads[i].dataValues.toID, "ID" + i])
                }
                let road = await InputManager.KeyboardBuilder(context, request, roadButtons, current_keyboard)
                if(!road) return resolve()
                road = Data.ParseButtonID(road)
                road = roads[road]
                const time = await InputManager.InputInteger(context, "Введите в минутах новое значение времени перемещения по этой дороге", current_keyboard, 0)
                if(time === null) return resolve()
                await CountryRoads.update({time: time}, {where: {fromID: road.dataValues.fromID, toID: road.dataValues.toID}})
                await CountryRoads.update({time: time}, {where: {fromID: road.dataValues.toID, toID: road.dataValues.fromID}})
                await context.send("✅ Дорога изменена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeTheRoad", e)
            }
        })
    }

    async ChatControls(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const kb = [
                    ["➕ Добавить чат", "add"],
                    ["❌ Удалить чат", "delete"]
                ]
                const action = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action === "add" && await this.AddTheChat(context, current_keyboard)
                action === "delete" && await this.DeleteChat(context, current_keyboard)
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChatControls", e)
            }
        })
    }

    async DeleteChat(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let buttons = []
                for(let i = 0; i < Data.countries.length; i++)
                {
                    if(Data.countries[i])
                    {
                        buttons.push([Data.countries[i].name, "ID" + Data.countries[i].id])
                    }
                }
                let country = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите к какой фракции будет относиться чат", buttons, current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]

                const chats = await Chats.findAll({where: {countryID: country.id}})
                if(chats.length === 0)
                {
                    await context.send(`⚠ Для фракции ${country.GetName()} не добавлено чатов`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                buttons = []
                let request = `Список чатов фракции ${country.GetName()}:\n\n`
                for(let i = 0; i < chats.length; i++)
                {
                    if(chats[i])
                    {
                        buttons.push([chats[i].name, chats[i].link])
                        request += "🔸" + chats[i].name + "  -  " + "https://vk.cc/" + chats[i].link + "\n"
                    }
                }
                const chat = await InputManager.KeyboardBuilder(context, request + "\n\n3️⃣ Выберите чат, который хотите удалить", buttons, current_keyboard)
                if(!chat) return resolve()
                await Chats.destroy({where: {link: chat}})
                await context.send("✅ Чат удален", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/DeleteChat", e)
            }
        })
    }

    async AddTheChat(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const countryButtons = []
                for(let i = 0; i < Data.countries.length; i++)
                {
                    if(Data.countries[i])
                    {
                        countryButtons.push([Data.countries[i].name, "ID" + Data.countries[i].id])
                    }
                }
                let country = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите к какой фракции будет относиться чат", countryButtons, current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]

                const name = await InputManager.InputString(context, "3️⃣ Введите название чата", current_keyboard)
                if(!name) return resolve()

                const link = await InputManager.InputString(context, "4️⃣ Вставьте ссылку приглашения в чат", current_keyboard)
                if(!link) return resolve()
                if(!link.match(/vk\.me\/join/))
                {
                    await context.send("🚫 Это не приглашение в беседу", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const shortLink = await api.api.utils.getShortLink({
                    url: link,
                    private: 0
                })
                await Chats.create({
                    countryID: country.id,
                    link: shortLink.key,
                    name: name
                })
                await context.send("✅ Чат добавлен", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/AddTheChat", e)
            }
        })
    }

    async GetCountryInfo(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                await context.send("ℹ Информация о фракции " + country.GetName() + "\n\n" + await country.GetAllInfo() + "\n\n" + country.GetResources(), {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GetCountryInfo", e)
            }
        })
    }

    async GetCityInfo(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let city = await InputManager.KeyboardBuilder(context, "Выберите город", Data.GetCityButtons(), current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                city = Data.cities[city]
                await context.send("ℹ Информация о городе " + city.name + "\n\n" + await city.GetAllInfo() + "\n\n" + city.GetResources(), {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GetCityInfo", e)
            }
        })
    }

    async GetUserInfo(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let user = await InputManager.InputUser(context, "1️⃣ Выберите пользователя", current_keyboard)
                if(!user) return resolve()
                await context.send(await NameLibrary.GetFullUserInfo(user.dataValues.id, User), {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GetUserInfo", e)
            }
        })
    }

    async GetBuildingInfo(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let city = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите город", Data.GetCityButtons(), current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                if(!Data.buildings[city])
                {
                    await context.send("🚫 В городе нет зданий", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const buttons = []
                for(let i = 0; i < Data.buildings[city].length; i++)
                {
                    buttons.push([Data.buildings[city][i].name, "ID" + i])
                }
                let build = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите здание", buttons, current_keyboard)
                if(!build) return resolve()
                build = Data.ParseButtonID(build)
                console.log(city, build)
                console.log(Data.buildings)
                build = Data.buildings[city][build]
                await context.send("ℹ Информация о здании:" + "\n\n" + build.GetAllInfo(), {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GetBuildingInfo", e)
            }
        })
    }

    async RemoveEffect(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let user = await InputManager.InputUser(context, "1️⃣ Выберите игрока", current_keyboard)
                if(!user) return resolve()
                if(!Data.users[user.dataValues.id])
                {
                    await context.send(`⚠ Данные игрока ${user.dataValues.id}(${user.dataValues.nick}) отсутствуют в кэше, похоже что он давно не заходил`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                user = Data.users[user.dataValues.id]
                user.effects = []
                await context.send(`ℹ Список эффектов игрока ${user.GetName()} очищен`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/RemoveEffect", e)
            }
        })
    }

    async AddEffect(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let user = await InputManager.InputUser(context, "1️⃣ Выберите игрока, на которого хотите наложить эффект", current_keyboard)
                if(!user) return resolve()
                if(!Data.users[user.dataValues.id])
                {
                    await context.send(`⚠ Данные игрока ${user.dataValues.id}(${user.dataValues.nick}) отсутствуют в кэше, похоже что он давно не заходил`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                user = Data.users[user.dataValues.id]
                if(user.status === "worker")
                {
                    await context.send("⚠ Запрещается накладывать эффекты на игроков со статусом ⚙ Работник", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const effectButtons = []
                for(let i = 0; i < Effects["length"]; i++)
                {
                    effectButtons.push([NameLibrary.GetEffectName(Effects[i].type), "ID" + i])
                }
                let effect = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите эффект", effectButtons, current_keyboard)
                if(!effect) return resolve()
                effect = Data.ParseButtonID(effect)
                effect = Effects[effect]
                let time = await InputManager.InputDefaultInteger(context, "3️⃣ Введите время действия эффекта (не более недели (10080 мин))", current_keyboard, 1, 10080, effect.time)
                if(!time) return resolve()
                user.AddEffect(effect, time)
                await context.send(`✅ Игрок ${user.GetName()} получил эффект ${NameLibrary.GetEffectName(effect.type)}`, {keyboard: keyboard.build(current_keyboard)})
                await api.SendMessage(user.id, "ℹ На вас был наложен эффект " + NameLibrary.GetEffectName(effect.type) + " на " + time + " минут")
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/AddEffect", e)
            }
        })
    }

    async Events(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let kb = [["➕ Начать", "start"], ["🚫 Прекратить", "stop"]]
                let action = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите действие", kb, current_keyboard)
                if(!action) return resolve()
                action = action === "start"
                kb = [
                    ["🛣 Блокировка дороги", "block_road"],
                    ["🌇 Осада города", "block_city"],
                    ["🔰 Блокада фракции", "block_country"],
                    ["🔰 Санкции для граждан", "block_country_citizen"],
                    ["🌇 Санкции для горожан", "block_city_citizen"]
                ]
                const type = await InputManager.KeyboardBuilder(context, "ℹ Справка:\n\n🔸 🛣 Блокировка дороги - запрещает перемещение по дороге\n\n🔸 🌇 Осада города - блокирует переводы ресурсов из бюджета города и запрещает въезд/выезд\n\n🔸 🔰 Блокада фракции - блокирует переводы ресурсов из бюджета фракции и запрещает въезд/выезд\n\n🔸 🔰 Санкции для граждан - блокирует распоряжение ресурсами и имуществом игроков имеющих гражданство конкретной фракции\n\n🔸 🌇 Санкции для горожан - блокирует распоряжение ресурсами и имуществом игроков имеющих прописку конкретного города\n\n2️⃣ Выберите событие", kb, current_keyboard)
                if(!type) return resolve()
                type === "block_road" && await this.BlockRoadEvent(context, current_keyboard, action)
                type === "block_city" && await this.BlockCityEvent(context, current_keyboard, action)
                type === "block_country" && await this.BlockCountryEvent(context, current_keyboard, action)
                type === "block_country_citizen" && await this.CountrySanctionsEvent(context, current_keyboard, action)
                type === "block_city_citizen" && await this.CitySanctionsEvent(context, current_keyboard, action)
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/Events", e)
            }
        })
    }

    async BlockRoadEvent(context, current_keyboard, action)
    {
        return new Promise(async (resolve) => {
            try
            {
                const roads = await CountryRoads.findAll({where: {isBlocked: !action}})
                let request = "ID фракций:\n\n"
                const roadButtons = []
                for(let i = 0; i < Data.countries.length; i++)
                {
                    if(Data.countries[i])
                    {
                        request += "🔸 " + Data.countries[i].GetName() + "  -  " + Data.countries[i].id + "\n"
                    }
                }
                request += `\nℹ Дороги блокируются попарно, если заблокировать дорогу A->B, то изменится и дорога B->A\n\nВыберите какую дорогу вы хотите ${action ? "заблокировать" : "разблокировать"}`
                for(let i = 0; i < roads.length; i++)
                {
                    roadButtons.push([roads[i].dataValues.fromID + " -> " + roads[i].dataValues.toID, "ID" + i])
                }
                if(roadButtons.length === 0)
                {
                    await context.send(`⚠ Нет ${action ? "не заблокированных" : "заблокированных"} дорог`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let road = await InputManager.KeyboardBuilder(context, request, roadButtons, current_keyboard)
                if(!road) return resolve()
                road = Data.ParseButtonID(road)
                road = roads[road].dataValues
                await CountryRoads.update({isBlocked: action}, {where: {fromID: road.fromID, toID: road.toID}})
                await CountryRoads.update({isBlocked: action}, {where: {fromID: road.toID, toID: road.fromID}})
                await api.SendMessage(Data.countries[road.fromID].leaderID, `ℹ Дорога соединяющая фракции ${Data.countries[road.fromID].GetName()} и ${Data.countries[road.toID].GetName()} ${action ? "заблокирована" : "разблокирована"}`)
                await api.SendMessage(Data.countries[road.toID].leaderID, `ℹ Дорога соединяющая фракции ${Data.countries[road.toID].GetName()} и ${Data.countries[road.fromID].GetName()} ${action ? "заблокирована" : "разблокирована"}`)
                await context.send(`✅ Дорога ${action ? "заблокирована" : "разблокирована"}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/BlockRoadEvent", e)
            }
        })
    }

    async BlockCityEvent(context, current_keyboard, action)
    {
        return new Promise(async (resolve) => {
            try
            {
                const cities = await City.findAll({where: {isSiege: !action}})
                const cityButtons = []
                for(let i = 0; i < cities.length; i++)
                {
                    cityButtons.push([cities[i].dataValues.name, "ID" + i])
                }
                if(cityButtons.length === 0)
                {
                    await context.send(`⚠ Не осталось городов, ${action ? "не находящихся под осадой" : "находящихся под осадой"}`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let city = await InputManager.KeyboardBuilder(context, "Выберите город", cityButtons, current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                city = Data.cities[cities[city].dataValues.id]
                const users = await PlayerStatus.findAll({where: {location: city.id, notifications: true}})
                city.isSiege = action
                await City.update({isSiege: action}, {where: {id: city.id}})
                for(const user of users)
                {
                    await api.SendMessage(user.dataValues.id, `⚠ Город в котором вы находитесь ${action ? "попал в осаду, теперь вы не сможете покинуть город до конца осады" : "вышел из осады, теперь вы можете свободно перемещаться"}`)
                }
                await api.SendMessage(city.leaderID, `⚠ Город ${city.name} ${action ? "попал в осаду" : "больше не в осаде"}`)
                await api.SendMessage(Data.countries[city.countryID].leaderID, `⚠ Город ${city.name} ${action ? "попал в осаду" : "больше не в осаде"}`)
                await context.send(`✅ Город ${action ? "осажен" : "больше не в осаде"}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/BlockCityEvent", e)
            }
        })
    }

    async BlockCountryEvent(context, current_keyboard, action)
    {
        return new Promise(async (resolve) => {
            try
            {
                const countries = await Country.findAll({where: {isSiege: !action}})
                const countryButtons = []
                for(let i = 0; i < countries.length; i++)
                {
                    countryButtons.push([countries[i].dataValues.name, "ID" + i])
                }
                if(countryButtons.length === 0)
                {
                    await context.send(`⚠ Не осталось фракций, ${action ? "не находящихся в блокаде" : "находящихся в блокаде"}`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "Выберите фракцию", countryButtons, current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[countries[country].dataValues.id]
                const users = await PlayerStatus.findAll({where: {countryID: country.id, notifications: true}})
                country.isSiege = action
                await Country.update({isSiege: action}, {where: {id: country.id}})
                for(const user of users)
                {
                    await api.SendMessage(user.dataValues.id, `⚠ Фракция в которой вы находитесь ${action ? "попала в блокаду, теперь вы не можете перемещаться до конца блокады" : "вышел из блокады, теперь вы можете свободно перемещаться"}`)
                }
                await api.SendMessage(country.leaderID, `⚠ Ваша фракция ${country.GetName()} ${action ? "попала в блокаду" : "больше не в блокаде"}`)
                await context.send(`✅ Фракция ${action ? "теперь в блокаде" : "больше не в блокаде"}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/BlockCountryEvent", e)
            }
        })
    }

    async CitySanctionsEvent(context, current_keyboard, action)
    {
        return new Promise(async (resolve) => {
            try
            {
                const cities = await City.findAll({where: {isUnderSanctions: !action}})
                const cityButtons = []
                for(let i = 0; i < cities.length; i++)
                {
                    cityButtons.push([cities[i].dataValues.name, "ID" + i])
                }
                if(cityButtons.length === 0)
                {
                    await context.send(`⚠ Не осталось городов, ${action ? "не находящихся под санкциями" : "находящихся под санкциями"}`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let city = await InputManager.KeyboardBuilder(context, "Выберите город", cityButtons, current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                city = Data.cities[cities[city].dataValues.id]
                const users = await PlayerStatus.findAll({where: {registration: city.id, notifications: true}})
                city.isUnderSanctions = action
                await City.update({isUnderSanctions: action}, {where: {id: city.id}})
                for(const user of users)
                {
                    await api.SendMessage(user.dataValues.id, `⚠ Город в котором вы прописаны ${action ? "попал под санкции, теперь вы не сможете переводить ресурсы и пользоваться имуществом" : "вышел из под санкций, теперь вы можете переводить ресурсы и пользоваться имуществом"}`)
                }
                await api.SendMessage(city.leaderID, `⚠ Город ${city.name} ${action ? "попал под санкции" : "больше не под санкциями"}`)
                await api.SendMessage(Data.countries[city.countryID].leaderID, `⚠ Город ${city.name} ${action ? "попал под санкции" : "больше не под санкциями"}`)
                await context.send(`✅ Город ${action ? "под санкциями" : "больше не под санкциями"}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CitySanctionsEvent", e)
            }
        })
    }

    async CountrySanctionsEvent(context, current_keyboard, action)
    {
        return new Promise(async (resolve) => {
            try
            {
                const countries = await Country.findAll({where: {isUnderSanctions: !action}})
                const countryButtons = []
                for(let i = 0; i < countries.length; i++)
                {
                    countryButtons.push([countries[i].dataValues.name, "ID" + i])
                }
                if(countryButtons.length === 0)
                {
                    await context.send(`⚠ Не осталось фракций, ${action ? "не находящихся под санкциями" : "находящихся под санкциями"}`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию", countryButtons, current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[countries[country].dataValues.id]
                const users = await PlayerStatus.findAll({where: {citizenship: country.id, notifications: true}})
                country.isUnderSanctions = action
                await Country.update({isUnderSanctions: action}, {where: {id: country.id}})
                for(const user of users)
                {
                    await api.SendMessage(user.dataValues.id, `⚠ Фракция в которой вы являетесь гражданином ${action ? "попала под санкции, теперь вы не сможете переводить ресурсы и пользоваться имуществом" : "вышла из под санкций, теперь вы можете переводить ресурсы и пользоваться имуществом"}`)
                }
                await api.SendMessage(country.leaderID, `⚠ Ваша фракция ${country.GetName()} ${action ? "попала под санкции" : "больше не под санкциями"}`)
                await context.send(`✅ Фракция ${action ? "теперь под санкциями" : "больше не под санкциями"}`, {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CountrySanctionsEvent", e)
            }
        })
    }

    async CreateWarning(context, current_keyboard, data, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const users = data.users.split(";")
                const reason = await InputManager.InputString(context, "1️⃣ Введите краткую причину (для самого игрока)", current_keyboard)
                if(!reason) return resolve(false)
                const explanation = await InputManager.InputString(context, "2️⃣ Введите полную причину (для админов)", current_keyboard)
                if(!explanation) return resolve(false)
                const time = await InputManager.InputDefaultInteger(context, "Введите время действия предупреждения в днях (от 1 до 365 дней)", current_keyboard, 1, 365, 90)
                const proof = await InputManager.InputPhoto(context, "3️⃣ Отправьте фото-доказательство (обязательно)", current_keyboard)
                if(!proof) return resolve(false)
                let warnCount = 0
                for(const i of users)
                {
                    await Warning.create({
                        userID: i,
                        reason: reason,
                        explanation: explanation,
                        proofImage: proof,
                        time: time
                    })
                    warnCount = await Warning.count({where: {userID: i}})
                    await Player.update({warningScore: warnCount, isBanned: warnCount >= 3}, {where: {id: i}})
                    await api.SendMessage(i, `⚠ Вам выдано предупреждение, срок его действия ${time} дней, причина:\n\n${reason}`)
                    if(warnCount >= 3)
                    {
                        await api.SendMessageWithKeyboard(i, `⚠⚠⚠ Вы получили бан.\n\nКоличество ваших предупреждений равно 3, ваш аккаунт получает блокировку в проекте.\n\nЕсли вы не согласны с блокировкой, то свяжитесь с админами:\n${Data.GiveAdminList()}`, [])
                        if(Data.projectHead) await api.SendMessage(Data.projectHead.id, `⚠ Игрок ${context.player.GetName()} выдал предупреждение игроку *id${i}(${i}), количество репортов достигло 3-х, игрок забанен`)
                        if(Data.users[i]) Data.users[i].isBanned = true
                        await api.BanUser(i)
                        await Ban.create({
                            userID: i,
                            reason: "3 предупреждения",
                            explanation: "Игрок заблокирован потому что имеет 3 предупреждения",
                        })
                        await Warning.update({banned: true}, {where: {userID: i}})
                    }
                }
                await context.send("✅ Предупреждение выдано", {keyboard: keyboard.build(current_keyboard)})
                for(const id of Object.keys(Data.supports))
                {
                    await api.api.messages.send({
                        user_id: id,
                        random_id: Math.round(Math.random() * 100000),
                        message: `⚠ Игрок ${context.player.GetName()} отправил репорт на игрок${users.length > 1 ? "ов" : "а"}:\n${users.map(user => {return "*id" + user + "(" + user + ")"})}`,
                        attachment: proof
                    })
                }
                context.player.lastReportTime = new Date()
                context.player.state = scenes.startMenu
                return resolve(true)
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CreateWarning", e)
            }
        })
    }

    async NewReport(context, current_keyboard, data, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const users = data.users.split(";")
                const reason = await InputManager.InputString(context, "1️⃣ Введите опишите причину, по которой вы отправляете жалобу", current_keyboard)
                if(!reason) return resolve(false)
                const proof = await InputManager.InputPhoto(context, "2️⃣ Отправьте фото-доказательство (не обязательно, чтобы пропустить нажмите \"Отмена\")", current_keyboard)
                for(const id of Object.keys(Data.administrators))
                {
                    await api.api.messages.send({
                        user_id: id,
                        random_id: Math.round(Math.random() * 100000),
                        message: `⚠ Игрок ${context.player.GetName()} отправил жалобу на игрок${users.length > 1 ? "ов" : "а"}:\n${users.map(user => {return "*id" + user + "(" + user + ")"})}\n\nТекст жалобы:\n${reason}`,
                        attachment: proof
                    })
                }
                await context.send("✅ Жалоба отправлена", {keyboard: keyboard.build(current_keyboard)})
                context.player.lastReportTime = new Date()
                context.player.state = scenes.startMenu
                return resolve(true)
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CreateWarning", e)
            }
        })
    }

    async Ban(context, current_keyboard, data, scenes)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = parseInt(data.users)
                const reason = await InputManager.InputString(context, "1️⃣ Введите краткую причину (для самого игрока)", current_keyboard)
                if(!reason) return resolve(false)
                const explanation = await InputManager.InputString(context, "2️⃣ Введите полную причину (для админов)", current_keyboard)
                if(!explanation) return resolve(false)
                await Warning.create({
                    userID: user,
                    reason: reason,
                    explanation: explanation
                })
                await Player.update({isBanned: true}, {where: {id: user}})
                if(Data.users[user]) Data.users[user].isBanned = true
                await api.SendMessageWithKeyboard(user, `⚠⚠⚠ Вы получили бан по причине: ${reason}\n\nЕсли вы не согласны с блокировкой, то свяжитесь с админами:\n${Data.GiveAdminList()}`, [])
                await Ban.create({
                    userID: user,
                    reason: reason,
                    explanation: explanation
                })
                await api.BanUser(user)
                await Warning.update({banned: true}, {where: {userID: user}})
                await context.send("✅ Бан выдан", {keyboard: keyboard.build(current_keyboard)})
                const banned = await Player.findOne({where: {id: user}, attributes: ["id", "nick"]})
                if(Data.projectHead) await api.SendMessage(Data.projectHead.id, `⚠ Игрок ${context.player.GetName()} выдал бан игроку *id${banned.dataValues.id}(${banned.dataValues.nick})`)
                context.player.lastReportTime = new Date()
                context.player.state = scenes.startMenu
                return resolve(true)
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/Ban", e)
            }
        })
    }

    async NewWarning(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Выберите игрока")
                if(!user) return resolve()
                if(NameLibrary.RoleEstimator(user.dataValues.role) >= NameLibrary.RoleEstimator(context.player.role))
                {
                    await context.send(`⚠ Роль игрока *id${user.dataValues.id}(${user.dataValues.nick}) находится на вашем уровне или выше, у вас нет права выдавать ему предупреждения`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const reason = await InputManager.InputString(context, "2️⃣ Введите краткую причину (для самого игрока)", current_keyboard)
                if(!reason) return resolve(false)
                const explanation = await InputManager.InputString(context, "3️⃣ Введите полную причину (для админов)", current_keyboard)
                if(!explanation) return resolve(false)
                const time = await InputManager.InputDefaultInteger(context, "4️⃣ Введите время действия предупреждения в днях (от 1 до 365 дней)", current_keyboard, 1, 365, 90)
                const proof = await InputManager.InputPhoto(context, "5️⃣ Отправьте фото-доказательство (обязательно)", current_keyboard)
                if(!proof) return resolve(false)
                await Warning.create({
                    userID: user.dataValues.id,
                    reason: reason,
                    explanation: explanation,
                    proofImage: proof,
                    time: time
                })
                let warnCount = await Warning.count({where: {userID: user.dataValues.id}})
                await Player.update({warningScore: warnCount, isBanned: warnCount >= 3}, {where: {id: user.dataValues.id}})
                await api.SendMessage(user.dataValues.id, `⚠ Вам выдано предупреждение, срок его действия ${time} дней, причина:\n\n${reason}`)
                if(warnCount >= 3)
                {
                    await api.SendMessageWithKeyboard(user.dataValues.id, `⚠⚠⚠ Вы получили бан.\n\nКоличество ваших предупреждений равно 3, ваш аккаунт получает блокировку в проекте.\n\nЕсли вы не согласны с блокировкой, то свяжитесь с админами:\n${Data.GiveAdminList()}`, [])
                    if(Data.projectHead) await api.SendMessage(Data.projectHead.id, `⚠ Игрок ${context.player.GetName()} выдал предупреждение игроку *id${user.dataValues.id}(${user.dataValues.nick}), количество репортов достигло 3-х, игрок забанен`)
                    if(Data.users[user.dataValues.id]) Data.users[user.dataValues.id].isBanned = true
                    await Ban.create({
                        userID: user.dataValues.id,
                        reason: "3 предупреждения",
                        explanation: "Игрок заблокирован потому что имеет 3 предупреждения",
                    })
                    await api.BanUser(user.dataValues.id)
                    await Warning.update({banned: true}, {where: {userID: user.dataValues.id}})
                }

                await context.send("✅ Предупреждение выдано", {keyboard: keyboard.build(current_keyboard)})
                for(const id of Object.keys(Data.supports))
                {
                    await api.api.messages.send({
                        user_id: id,
                        random_id: Math.round(Math.random() * 100000),
                        message: `⚠ Игрок ${context.player.GetName()} отправил репорт на игрока *id${user.dataValues.id}(${user.dataValues.nick})`,
                        attachment: proof
                    })
                }
                context.player.lastReportTime = new Date()
                return resolve(true)
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CreateWarning", e)
            }
        })
    }

    async NewBan(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                const user = await InputManager.InputUser(context, "1️⃣ Выберите игрока")
                if(!user) return resolve()
                if(NameLibrary.RoleEstimator(user.dataValues.role) >= NameLibrary.RoleEstimator(context.player.role))
                {
                    await context.send(`⚠ Роль игрока *id${user.dataValues.id}(${user.dataValues.nick}) находится на вашем уровне или выше, вы не можете его забанить`, {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const reason = await InputManager.InputString(context, "2️⃣ Введите краткую причину (для самого игрока)", current_keyboard)
                if(!reason) return resolve(false)
                const explanation = await InputManager.InputString(context, "3️⃣ Введите полную причину (для админов)", current_keyboard)
                if(!explanation) return resolve(false)
                await Warning.create({
                    userID: user.dataValues.id,
                    reason: reason,
                    explanation: explanation
                })
                await Player.update({isBanned: true}, {where: {id: user.dataValues.id}})
                if(Data.users[user.dataValues.id]) Data.users[user.dataValues.id].isBanned = true
                await api.SendMessageWithKeyboard(user.dataValues.id, `⚠⚠⚠ Вы получили бан по причине: ${reason}\n\nЕсли вы не согласны с блокировкой, то свяжитесь с админами:\n${Data.GiveAdminList()}`, [])
                await Ban.create({
                    userID: user.dataValues.id,
                    reason: reason,
                    explanation: explanation
                })
                await api.BanUser(user.dataValues.id)
                await Warning.update({banned: true}, {where: {userID: user.dataValues.id}})
                await context.send("✅ Бан выдан", {keyboard: keyboard.build(current_keyboard)})
                if(Data.projectHead) await api.SendMessage(Data.projectHead.id, `⚠ Игрок ${context.player.GetName()} выдал бан игроку *id${user.dataValues.id}(${user.dataValues.nick})`)
                context.player.lastReportTime = new Date()
                return resolve(true)
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/Ban", e)
            }
        })
    }

    async ImportUsers()
    {
        return new Promise(async (resolve) => {
            const getCountryID = (country, isCitizen) =>
            {
                if(country.toLowerCase().match(/рим/)) return [1, 1]
                if(country.toLowerCase().match(/саксы/)) return [10, 10]
                if(country.toLowerCase().match(/ицены/)) return [3, 3]
                if(country.toLowerCase().match(/кимвры/)) return [2, 2]
                if(country.toLowerCase().match(/македония/)) return [7, 7]
                if(country.toLowerCase().match(/афины/)) return [6, 6]
                if(country.toLowerCase().match(/тила/)) return [8, 8]
                if(country.toLowerCase().match(/понт/)) return [5, 5]
                if(country.toLowerCase().match(/cклавины/)) return [11, 11]
                if(country.toLowerCase().match(/елевкид/)) return [4, 4]
                if(country.toLowerCase().match(/египет/)) return [9, 9]
                if(isCitizen) return [null, null]
                return [1, 1]
            }
            const getNation = (nation) =>
            {
                if(nation.match(/римлянин/gi)) return "Римлянин 🔱"
                if(nation.match(/кельт/gi)) return "Кельт 🍀"
                if(nation.match(/грек/gi)) return "Грек 🏛️"
                if(nation.match(/армянин/gi)) return "Армянин 💃"
                if(nation.match(/перс/gi)) return "Перс 🐘"
                if(nation.match(/германец/gi)) return "Германец ⚔"
                if(nation.match(/египтянин/gi)) return "Египтянин ☀"
                return nation
            }
            const getRoleState = (id, citizen) => {
                switch (id)
                {
                    case 212554134:
                        return ["owner", "worker"]
                    case 565472458:
                        return ["support", "worker"]
                }
                return ["player", citizen ? "citizen" : "stateless"]
            }
            const data = fs.readFileSync('./files/users.csv', 'utf8');
            const rows = data.split("\n")
            let user = null
            let marryID = []
            let userInfo = {
                id: null,
                nick: null,
                description: null,
                location: null,
                nation: null,
                age: null,
                role: null,
                status: null,
                married: null,
                gender: null,
                citizenship: null,
                money: null,
                wheat: null,
                stone: null,
                wood: null,
                iron: null,
                silver: null,
                copper: null,
                isBanned: null,
                msgs: null,
                audios: null,
                stickers: null,
                swords: null
            }
            for(let i = 1; i < rows.length; i++)
            {
                user = rows[i].split(";")
                if(user[12]?.match(/^пройдена/))
                {
                    userInfo.id = parseInt(user[0])
                    userInfo.nick = user[11]
                    userInfo.description = user[13]
                    userInfo.nation = getNation(user[43])
                    userInfo.location = getCountryID(user[28], false)[1]
                    userInfo.countryID = getCountryID(user[28], false)[0]
                    userInfo.age = parseInt(user[5])
                    userInfo.gender = user[7] === "male"
                    userInfo.citizenship = getCountryID(user[28], true)[0]
                    userInfo.role = getRoleState(userInfo.id, userInfo.citizenship)[0]
                    userInfo.status = getRoleState(userInfo.id, userInfo.citizenship)[1]
                    userInfo.isBanned = user[26] === "да"
                    userInfo.money = parseInt(user[10])
                    userInfo.wheat = parseInt(user[15])
                    userInfo.stone = parseInt(user[14])
                    userInfo.wood = parseInt(user[16])
                    userInfo.iron = parseInt(user[8])
                    userInfo.silver = parseInt(user[54])
                    userInfo.copper = parseInt(user[19])
                    userInfo.msgs = parseInt(user[57])
                    userInfo.audios = parseInt(user[42])
                    userInfo.stickers = parseInt(user[59])
                    userInfo.swords = parseInt(user[41])
                    marryID = user[6]?.match(/id\d+/)
                    if(marryID) userInfo.married = parseInt(marryID[0]?.replace("id", ""))
                    else userInfo.married = null
                    try
                    {
                        await Player.findOrCreate({
                            where: {id: userInfo.id},
                            defaults : {
                                id: userInfo.id,
                                nick: userInfo.nick,
                                gender: userInfo.gender,
                                isBanned: userInfo.isBanned,
                                role: userInfo.role,
                                status: userInfo.status
                            }
                        })
                        await PlayerStatus.findOrCreate({
                            where: {id: userInfo.id},
                            defaults : {
                                id: userInfo.id,
                                location: userInfo.location,
                                countryID: userInfo.countryID,
                                citizenship: userInfo.citizenship
                            }
                        })
                        await PlayerInfo.findOrCreate({
                            where: {id: userInfo.id},
                            defaults : {
                                id: userInfo.id,
                                description: userInfo.description,
                                nationality: userInfo.nation,
                                age: userInfo.age,
                                msgs: userInfo.msgs,
                                audios: userInfo.audios,
                                stickers: userInfo.stickers,
                                swords: userInfo.swords
                            }
                        })
                        await PlayerResources.findOrCreate({
                            where: {id: userInfo.id},
                            defaults : {
                                id: userInfo.id,
                                money: userInfo.money,
                                wheat: userInfo.wheat,
                                stone: userInfo.stone,
                                wood: userInfo.wood,
                                iron: userInfo.iron,
                                silver: userInfo.silver,
                                copper: userInfo.copper
                            }
                        })
                        if(userInfo.isBanned)
                        {
                            await Ban.findOrCreate({
                                where: {userID: userInfo.id},
                                defaults : {
                                    userID: userInfo.id,
                                    reason: "Старый бан, причины не помню",
                                    explanation: "Бан импортированный со старой версии бота, причина не известна"
                                }
                            })
                        }
                    }
                    catch (e)
                    {
                        console.log(e)
                    }
                }
            }

            return resolve()
        })
    }

    async CheatingUserDiamonds(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                await api.SendAccessKey(`Накрутка алмазов игроку. Игрок ${context.player.GetName()}`)
                const accessKey = await InputManager.InputString(context, "⚠ Введите ключ доступа", current_keyboard)
                if(!accessKey) return resolve()
                if(accessKey !== Data.accessKey)
                {
                    context.send("🚫 Не верный ключ", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const user = await InputManager.InputUser(context, "1️⃣ Кому вы хотите накрутить алмазы?", current_keyboard)
                if(!user) return resolve()
                if(user.dataValues.status === "worker")
                {
                    context.send("🚫 Накрутка алмазов работникам запрещена", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let count = await InputManager.InputInteger(context, "2️⃣ Введите количество", current_keyboard)
                if(count === null) return resolve()
                const accept = await InputManager.InputBoolean(context, `3️⃣ Подтвердите перевод:\nКому: *id${user.dataValues.id}(${user.dataValues.nick})\nРесурс: 💎 Алмазы\nКоличество: ${count} шт\n\nВерно?`, current_keyboard)
                if(!accept)
                {
                    context.send("🚫 Перевод отменен", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }

                let objIN = {diamond: count}
                await Data.AddPlayerResources(user.dataValues.id, objIN)
                await api.SendMessage(user.dataValues.id, `✅ Вам поступил перевод:\n💎 Алмазы: ${count}`)
                await context.send("✅ Успешно", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CheatingUserResources", e)
            }
        })
    }

    async CreateNewCity(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let leader = await InputManager.InputUser(context, `1️⃣ Укажите градоначальника`, current_keyboard)
                if(!leader) return resolve()
                if(leader.dataValues.status === "worker")
                {
                    await context.send("🚫 Назначать работников на должность градоначальника запрещено", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let city = await City.findOne({where: {leaderID: leader.dataValues.id}, attributes: ["id"]})
                while(city)
                {
                    leader = await InputManager.InputUser(context, `⚠ Игрок *id${leader.dataValues.id}(${leader.dataValues.nick})уже является главой города ${city.dataValues.name}`, current_keyboard)
                    if(!leader) return resolve()
                    if(leader.dataValues.status === "worker")
                    {
                        await context.send("🚫 Назначать игроков со статусом ⚙ Работник на должность градоначальника запрещено", {keyboard: keyboard.build(current_keyboard)})
                        return resolve()
                    }
                    city = await City.findOne({where: {leaderID: leader.dataValues.id}, attributes: ["id"]})
                }
                let country = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                let name = await InputManager.InputString(context, "3️⃣ Введите название нового города (от 2 до 100 символов)", current_keyboard, 2, 100)
                if(!name) return resolve()
                city = await City.findOne({where: {name: name}})
                while(city)
                {
                    name = await InputManager.InputString(context, "⚠ Город с таким названием уже существует, повторите ввод.", current_keyboard, 2, 100)
                    if(!name) return resolve()
                    city = await City.findOne({where: {name: name}})
                }
                let description = await InputManager.InputString(context, "4️⃣ Введите описание города (от 2 до 1000 символов)", current_keyboard, 2, 1000)
                if(!description) return resolve()
                const newCity = await City.create({
                    countryID: country.id,
                    leaderID: leader.dataValues.id,
                    name: name,
                    description: description
                })
                await CityRoads.create({fromID: country.capitalID, toID: newCity.dataValues.id, time: Data.variables["cityToCityTime"], isBlocked: false})
                await CityRoads.create({fromID: newCity.dataValues.id, toID: country.capitalID, time: Data.variables["cityToCityTime"], isBlocked: false})
                await CityResources.create({id: newCity.dataValues.id})
                if(Data.users[leader.dataValues.id]) Data.users[leader.dataValues.id].status = "official"
                if(leader.dataValues.status.match(/citizen|/))
                {
                    leader.set({status: "official"})
                    await leader.save()
                }
                await OfficialInfo.findOrCreate({
                    where: {id: leader.dataValues.id},
                    defaults: {id: leader.dataValues.id, countryID: country.id, nick: leader.dataValues.nick}
                })
                await Data.LoadCities()
                await api.SendMessage(leader.dataValues.id, `Вы были назначены главой нового города \"${newCity.dataValues.name}\", ваш статус изменен на "Чиновник"`)
                await context.send("✅ Город создан.", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/CreateNewCity", e)
            }
        })
    }

    async RemoveCity(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                await api.SendAccessKey(`Удаление города. Игрок ${context.player.GetName()}`)
                const accessKey = await InputManager.InputString(context, "⚠ Введите ключ доступа", current_keyboard)
                if(!accessKey) return resolve()
                if(accessKey !== Data.accessKey)
                {
                    await context.send("🚫 Не верный ключ", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                let city = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите город", Data.GetCityForCountryButtons(country.id), current_keyboard)
                if(!city) return resolve()
                city = Data.ParseButtonID(city)
                city = Data.cities[city]
                if(city.isCapital)
                {
                    await context.send("🚫 Столицу можно удалить только вместе с фракцией", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                const users = await PlayerStatus.findAll({where: {location: city.id}})
                for (const user of users)
                {
                    user.set({location: country.capitalID})
                    await user.save()
                    if(user.dataValues.notifications)
                    {
                        await api.SendMessage(user.dataValues.id, "Администраторы удалили город в котором вы находились, вы перенесены в столицу фракции " + country.GetName())
                    }
                }
                await City.destroy({where: {id: city.id}})
                await CityResources.destroy({where: {id: city.id}})
                await Data.LoadCities()
                await api.SendMessage(city.leaderID, `⚠ Администрация удалила ваш город \"${city.name}\"`)
                await context.send("✅ Город удален.", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/RemoveCity", e)
            }
        })
    }

    async RemoveCountry(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                await api.SendAccessKey(`Удаление фракции. Игрок ${context.player.GetName()}`)
                const accessKey = await InputManager.InputString(context, "⚠ Введите ключ доступа", current_keyboard)
                if(!accessKey) return resolve()
                if(accessKey !== Data.accessKey)
                {
                    await context.send("🚫 Не верный ключ", {keyboard: keyboard.build(current_keyboard)})
                    return resolve()
                }
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const buttons = []
                Data.countries.forEach((key) => {
                    if(key?.id !== country.id)
                    {
                        buttons.push([key.name, "ID" + key.id])
                    }
                })
                let newPlace = await InputManager.KeyboardBuilder(context, "2️⃣ Куда переселить всех игроков, которые находятся в фракции?", buttons, current_keyboard)
                if(!newPlace) return resolve()
                newPlace = Data.ParseButtonID(newPlace)
                newPlace = Data.countries[newPlace]
                const users = await PlayerStatus.findAll({where: {location: Data.cities.filter(key => {return key.countryID === country.id}).map(key => {return key.id})}})
                for (const user of users)
                {
                    user.set({location: newPlace.capitalID, countryID: newPlace.id})
                    await user.save()
                    if(user.dataValues.notifications)
                    {
                        await api.SendMessage(user.dataValues.id, "⚠ Администраторы удалили фракцию в которой вы находились, вы перенесены в столицу фракции " + newPlace.GetName())
                    }
                }
                await PlayerStatus.update({status: "stateless"}, {where: {id: country.leaderID}})
                if(Data.users[country.leaderID]) Data.users[country.leaderID].status = "stateless"
                await api.SendMessage(country.leaderID, "⚠ Администраторы удалили вашу фракцию, теперь вы апатрид")
                if(Data.officials[country.id])
                {
                    for(const id of Object.keys(Data.officials[country.id]))
                    {
                        await PlayerStatus.update({status: "stateless"}, {where: {id: id}})
                        if(Data.users[id]) Data.users[id].status = "stateless"
                        await api.SendMessage(id, "⚠ Администраторы удалили вашу фракцию, теперь вы апатрид")
                    }
                }
                await api.SendMessage(country.leaderID, `⚠ Администрация удалила вашу фракцию ${country.GetName()}`)
                await Country.destroy({where: country.id})
                await CountryResources.destroy({where: country.id})
                await CityRoads.destroy({where: {fromID: Data.cities.filter(key => {return key.countryID === country.id}).map(key => {return key.id})}})
                await City.destroy({where: {id: Data.cities.filter(key => {return key.countryID === country.id}).map(key => {return key.id})}})
                await CityResources.destroy({where: {id: Data.cities.filter(key => {return key.countryID === country.id}).map(key => {return key.id})}})
                await OfficialInfo.destroy({where: {countryID: country.id}})
                await CountryRoads.destroy({where: {fromID: country.id}})
                await CountryRoads.destroy({where: {toID: country.id}})
                await Data.LoadCountries()
                await Data.LoadCities()
                await Data.LoadOfficials()
                await context.send("✅ Фракция удалена", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/RemoveCountry", e)
            }
        })
    }

    async ChangeCountryResource(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let country = await InputManager.KeyboardBuilder(context, "1️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                let resourcesKeyboard = [
                    ["🌾 Зерно", "wheat", false],
                    ["🪵 Древесина", "wood", false],
                    ["🪨 Камень", "stone", false],
                    ["🌑 Железо", "iron", false],
                    ["🥉 Бронза", "copper", false],
                    ["🥈 Серебро", "silver", false]
                ]
                if(country.resources.match(/wheat/)) resourcesKeyboard[0][2] = true
                if(country.resources.match(/wood/)) resourcesKeyboard[1][2] = true
                if(country.resources.match(/stone/)) resourcesKeyboard[2][2] = true
                if(country.resources.match(/iron/)) resourcesKeyboard[3][2] = true
                if(country.resources.match(/copper/)) resourcesKeyboard[4][2] = true
                if(country.resources.match(/silver/)) resourcesKeyboard[5][2] = true
                let resources = await InputManager.RadioKeyboardBuilder(context, "2️⃣ Выберите ресурсы фракции:", resourcesKeyboard, current_keyboard)
                if(!resources) return resolve()
                resources = resources.filter(key => {
                    return key[1]
                }).map(key => {
                    return key[0]
                })
                let resName = ""
                resources.forEach(key => {
                    resName += NameLibrary.GetResourceName(key) + "\n"
                })
                resources = resources.join(".")
                country.resources = resources
                await Country.update({resources: resources}, {where: {id: country.id}})
                await context.send("✅ Ресурсы изменены", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeCountryResource", e)
            }
        })
    }

    async TeleportUser(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let user = await InputManager.InputUser(context, "1️⃣ Выберите игрока", current_keyboard)
                if(!user) return resolve()
                let country = await InputManager.KeyboardBuilder(context, "2️⃣ Выберите фракцию", Data.GetCountryButtons(), current_keyboard)
                if(!country) return resolve()
                country = Data.ParseButtonID(country)
                country = Data.countries[country]
                const cities = Data.GetCityForCountryButtons(country.id)
                let city
                if(cities.length > 1)
                {
                    city = await InputManager.KeyboardBuilder(context, "3️⃣ Выберите город", cities, current_keyboard)
                    if(!city) return resolve()
                    city = Data.ParseButtonID(city)
                }
                else
                {
                    city = country.capitalID
                }
                await PlayerStatus.update({location: city, countryID: country.id}, {where: {id: user.dataValues.id}})
                if(Data.users[user.dataValues.id])
                {
                    Data.users[user.dataValues.id].location = city
                    Data.users[user.dataValues.id].countryID = country.id
                }
                await api.SendMessage(user.dataValues.id, `✅ Вы были телепортированы в город ${Data.cities[city].name} фракции ${country.GetName()}`)
                await context.send("✅ Игрок телепортирован", {keyboard: keyboard.build(current_keyboard)})
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeCountryResource", e)
            }
        })
    }

    async GetMostRich(context)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = "💰 Самые богатые люди Античности\n\n"
                const theRich = await sequelize.query("SELECT \"id\", \"money\" FROM \"player-resources\" ORDER BY money DESC LIMIT 10")
                const players = await Player.findAll({
                    where: {id: theRich[0].map(key => {return key.id})},
                    attributes: ["id", "nick"]
                })
                for(let i = 0; i < theRich[0].length; i++)
                {
                    for(const player of players)
                    {
                        if(theRich[0][i].id === player.dataValues.id)
                        {
                            request += `🟠 ${i+1}: *id${player.dataValues.id}(${player.dataValues.nick}) - ${theRich[0][i].money} 🪙\n\n`
                            break
                        }
                    }
                }
                await context.send(request)
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GetMostRich", e)
            }
        })
    }

    async GetCityPlayersList(context)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = "📍 Сейчас в вашем городе находятся:\n\n"
                const playersStatus = await PlayerStatus.findAll({where: {location: context.cityID}, attributes: ["id"]})
                if(playersStatus.length === 0)
                {
                    await context.send("‼ В вашем городе никого нет")
                    return resolve()
                }
                const players = await Player.findAll({where: {id: playersStatus.map(key => {return key.dataValues.id})}, attributes: ["id", "nick", "status"]})
                for(const player of players)
                {
                    request += `🔸 *id${player.dataValues.id}(${player.dataValues.nick}) - ${NameLibrary.GetStatusName(player.dataValues.status)}\n`
                }
                await context.send(request)
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GetCityPlayersList", e)
            }
        })
    }

    async GetCountryPlayersList(context)
    {
        return new Promise(async (resolve) => {
            try
            {
                let request = "📍 Сейчас в вашей фракции находятся:\n"
                const playersStatus = await PlayerStatus.findAll({where: {countryID: context.country.id}, attributes: ["id", "location", "citizenship"]})
                const players = await Player.findAll({where: {id: playersStatus.map(key => {return key.dataValues.id})}, attributes: ["id", "nick", "status"]})
                const users = []
                for(const status of playersStatus)
                {
                    for(const player of players)
                    {
                        if(status.dataValues.id === player.dataValues.id)
                        {
                            users.push({
                                id: player.dataValues.id,
                                nick: player.dataValues.nick,
                                status: player.dataValues.status,
                                location: status.dataValues.location,
                                citizenship: status.dataValues.citizenship
                            })
                            break
                        }
                    }
                }
                let count = 0
                for(const city of Data.cities)
                {
                    if(city?.countryID === context.country.id)
                    {
                        count = 0
                        request += `\n🌇 Город ${city.name}:\n`
                        for(const player of users)
                        {
                            if(player.location === city.id)
                            {
                                request += `🔸 *id${player.id}(${player.nick}) - ${player.citizenship !== context.country.id ? "Мигрант" : NameLibrary.GetStatusName(player.status)}\n`
                            }
                        }
                    }
                }
                await context.send(request)
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/GetCountryPlayersList", e)
            }
        })
    }

    async ChangeNick(context, current_keyboard)
    {
        return new Promise(async (resolve) => {
            try
            {
                let name = await InputManager.InputString(context, `1️⃣ Введите новый ник`, current_keyboard,2, 20)
                if(!name) return resolve()
                let temp = await Player.findOne({where: {nick: name}})
                while(temp)
                {
                    name = await InputManager.InputString(context, `⚠ Этот ник занят`, current_keyboard, 2, 20)
                    if(!name) return resolve()
                    temp = await Player.findOne({where: {nick: name}})
                }
                context.player.nick = name
                await Player.update({nick: name}, {where: {id: context.player.id}})
                await context.send("✅ Ник изменен", {keyboard: keyboard.build(current_keyboard)})
                if(context.player.status === "worker")
                {
                    await Data.LoadWorkers()
                }
                return resolve()
            }
            catch (e)
            {
                await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/ChangeNick", e)
            }
        })
    }

    async TestCorusel(context)
    {
        try
        {
            await OutputManager.SendCountryCarousel(context)
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "BuildersAndControlsScripts/TestCorusel", e)
        }
    }
}

module.exports = new BuildersAndControlsScripts()