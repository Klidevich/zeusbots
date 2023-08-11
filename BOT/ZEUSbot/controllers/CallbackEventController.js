const api = require("../middleware/API")
const {PlayerInfo, PlayerStatus, Country, Player, Buildings, Keys, City, Warning, Ban, CityRoads} = require("../database/Models");
const Data = require("../models/CacheData");
const ErrorHandler = require("../error/ErrorHandler")
const keyboard = require("../variables/Keyboards")
const NameLibrary = require("../variables/NameLibrary");
const Prices = require("../variables/Prices");
const Scenes = require("./SceneController")
class CallbackEventController
{
    async Handler(context)
    {
        context.eventPayload?.command === "hide_message" && await this.HideMessage(context)
        context.eventPayload?.command === "merry" && await this.Merry(context)
        context.eventPayload?.command  === "decline_merry" && await this.DeclineMerry(context)
        context.eventPayload?.command === "divorce" && await this.Divorce(context)
        context.eventPayload?.command === "decline_divorce" && await this.DeclineDivorce(context)
        context.eventPayload?.command === "give_citizenship" && await this.GiveCitizenship(context)
        context.eventPayload?.command === "decline_citizenship" && await this.DeclineCitizenship(context)
        context.eventPayload?.command === "give_registration" && await this.GiveRegistration(context)
        context.eventPayload?.command === "decline_registration" && await this.DeclineRegistration(context)
        context.eventPayload?.command === "allow_user_building" && await this.AllowUserBuilding(context)
        context.eventPayload?.command === "decline_user_building" && await this.DeclineUserBuilding(context)
        context.eventPayload?.command === "set_road_distance" && await this.HideRoadDistance(context)
        context.eventPayload?.command === "appeal_warning" && await this.AppealWarning(context)
        context.eventPayload?.command === "appeal_ban" && await this.AppealBan(context)
    }

    async HideMessage(context)
    {
        await api.api.messages.edit({
            peer_id: context.peerId,
            message: "✖ Скрыто",
            conversation_message_id: context.conversationMessageId,
            keyboard: keyboard.inlineNone
        })
    }

    async Merry(context)
    {
        const firstUserID = context.peerId
        const firstUser = Data.users[firstUserID]
        const secondUserID = context.eventPayload.item
        const secondUser = Data.users[secondUserID]
        try
        {
            await PlayerInfo.update(
                {
                    marriedID: secondUserID
                },
                {where: {id: firstUserID}})
            Data.users[firstUserID].marriedID = secondUserID
            Data.users[firstUserID].isMarried = true
            await PlayerInfo.update(
                {
                    marriedID: firstUserID
                },
                {where: {id: secondUserID}})
            Data.users[secondUserID].marriedID = firstUserID
            Data.users[secondUserID].isMarried = true
            await api.api.messages.edit({
                peer_id: context.peerId,
                message: "✅ Принято",
                conversation_message_id: context.conversationMessageId,
                keyboard: keyboard.inlineNone
            })
            await api.SendMessage(firstUserID, `❤ Теперь *id${secondUser.id}(${secondUser.nick}) ваш${secondUser.gender ? " муж" : "а жена"}`)
            await api.SendMessage(secondUserID, `❤ Теперь *id${firstUser.id}(${firstUser.nick}) ваш${firstUser.gender ? " муж" : "а жена"}`)
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "CallbackEventController/Merry", e)
        }
    }

    async DeclineMerry(context)
    {
        const firstUserID = context.peerId
        const firstUser = Data.users[firstUserID]
        const secondUserID = context.eventPayload.item
        const secondUser = Data.users[secondUserID]
        try
        {
            Data.users[secondUserID].isMarried = false
            await api.api.messages.edit({
                peer_id: context.peerId,
                message: "❌ Отклонено",
                conversation_message_id: context.conversationMessageId,
                keyboard: keyboard.inlineNone
            })
            await api.SendMessage(firstUserID, `💔 Вы отвергли предложение брака от игрока *id${secondUser.id}(${secondUser.nick})`)
            await api.SendMessage(secondUserID, `💔 *id${firstUser.id}(${firstUser.nick}) ${firstUser.gender ? "отверг" : "отвергла"} ваше предложение вступить в брак.`)
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "CallbackEventController/DeclineMerry", e)
        }
    }

    async Divorce(context)
    {
        const firstUserID = context.peerId
        const firstUser = Data.users[firstUserID]
        const secondUserID = context.eventPayload.item
        const secondUser = Data.users[secondUserID]
        try
        {
            await PlayerInfo.update(
                {
                    marriedID: null
                },
                {where: {id: firstUserID}})
            Data.users[firstUserID].marriedID = null
            Data.users[firstUserID].isMarried = false
            await PlayerInfo.update(
                {
                    marriedID: null
                },
                {where: {id: secondUserID}})
            Data.users[secondUserID].marriedID = null
            Data.users[secondUserID].isMarried = false
            await api.api.messages.edit({
                peer_id: context.peerId,
                message: "✅ Принято",
                conversation_message_id: context.conversationMessageId,
                keyboard: keyboard.inlineNone
            })
            await api.SendMessage(firstUserID, `💔 Больше *id${secondUser.id}(${secondUser.nick}) не ваш${secondUser.gender ? " муж" : "а жена"}`)
            await api.SendMessage(secondUserID, `💔 Больше *id${firstUser.id}(${firstUser.nick}) не ваш${firstUser.gender ? " муж" : "а жена"}`)
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "CallbackEventController/Divorce", e)
        }
    }

    async DeclineDivorce(context)
    {
        const firstUserID = context.peerId
        const firstUser = Data.users[firstUserID]
        const secondUserID = context.eventPayload.item
        const secondUser = Data.users[secondUserID]
        try
        {
            await api.api.messages.edit({
                peer_id: context.peerId,
                message: "❌ Отклонено",
                conversation_message_id: context.conversationMessageId,
                keyboard: keyboard.inlineNone
            })
            await api.SendMessage(firstUserID, `❤ Вы отвергли предложение расторжения брака от игрока *id${secondUser.id}(${secondUser.nick})`)
            await api.SendMessage(secondUserID, `❤ *id${firstUser.id}(${firstUser.nick}) ${firstUser.gender ? "отверг" : "отвергла"} ваше предложение расторгнуть брак.`)
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "CallbackEventController/DeclineDivorce", e)
        }
    }

    async GiveCitizenship(context)
    {
        const secondUserID = context.eventPayload.item
        const countryID = context.eventPayload.addition
        try
        {
            if(Data.users[secondUserID].waitingCitizenship)
            {
                clearTimeout(Data.users[secondUserID].waitingCitizenship)
                await PlayerStatus.update({citizenship: countryID},{where: {id: secondUserID}})
                if(!context.player.status.match(/worker/))
                {
                    await Player.update({status: "stateless"},{where: {id: context.player.id}})
                }
                Data.users[secondUserID].citizenship = countryID
                if(Data.users[secondUserID].status !== "worker")
                {
                    Data.users[secondUserID].status = "citizen"
                    await Player.update({status: "citizen"}, {where: {id: secondUserID}})
                }
                const country = await Country.findOne({where: {id: countryID}})
                country.set({population: country.population + 1})
                await country.save()
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "✅ Принято",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
                await api.SendMessageWithKeyboard(secondUserID, `✅ Ваша заявка на гражданство принята.`, [[keyboard.backButton]])
            }
            else
            {
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "⚠ Не актуально",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "CallbackEventController/GiveCitizenship", e)
        }
    }

    async DeclineCitizenship(context)
    {
        const secondUserID = context.eventPayload.item
        const citizen = Data.users[secondUserID]
        try
        {
            if(citizen.waitingCitizenship)
            {
                clearTimeout(Data.users[secondUserID].waitingCitizenship)
                if(Data.users[secondUserID].status !== "worker")
                {
                    Data.users[secondUserID].status = "stateless"
                }
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "❌ Отклонено",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
                await api.SendMessage(secondUserID, `❌ Ваша заявка на гражданство отклонена.`)
            }
            else
            {
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "⚠ Не актуально",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "CallbackEventController/DeclineCitizenship", e)
        }
    }

    async GiveRegistration(context)
    {
        const secondUserID = context.eventPayload.item
        const cityID = context.eventPayload.addition
        try
        {
            if(Data.users[secondUserID].waitingRegistration)
            {
                clearTimeout(Data.users[secondUserID].waitingRegistration)
                await PlayerStatus.update({registration: cityID},{where: {id: secondUserID}})
                Data.users[secondUserID].registration = cityID
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "✅ Принято",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
                await api.SendMessageWithKeyboard(secondUserID, `✅ Ваша заявка принята. Теперь вы прописаны в городе ${Data.GetCityName(cityID)}`, [[keyboard.backButton]])
            }
            else
            {
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "⚠ Не актуально",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "CallbackEventController/GiveRegistration", e)
        }
    }

    async DeclineRegistration(context)
    {
        const secondUserID = context.eventPayload.item
        const citizen = Data.users[secondUserID]
        try
        {
            if(citizen.waitingRegistration)
            {
                clearTimeout(Data.users[secondUserID].waitingRegistration)
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "❌ Отклонено",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
                await api.SendMessage(secondUserID, `❌ Ваша заявка на получение прописки отклонена.`)
            }
            else
            {
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "⚠ Не актуально",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "CallbackEventController/DeclineRegistration", e)
        }
    }

    async AllowUserBuilding(context)
    {
        const userID = context.eventPayload.item
        const buildingID = context.eventPayload.addition
        try
        {
            let isActual = false
            let timeoutNum = null
            for (let i = 0; i < Data.users[userID]?.waitingAllowBuilding?.length; i++)
            {
                if(Data.users[userID]?.waitingAllowBuilding[i])
                {
                    if(Data.users[userID]?.waitingAllowBuilding[i][0] === buildingID)
                    {
                        isActual = true
                        timeoutNum = i
                        break
                    }
                }
            }
            if(isActual)
            {
                clearTimeout(Data.users[userID]?.waitingAllowBuilding[timeoutNum][1])
                delete Data.users[userID]?.waitingAllowBuilding[timeoutNum]
                let length = 0
                for(let i = 0; i < Data.users[userID]?.waitingAllowBuilding.length; i++)
                {
                    if(Data.users[userID].waitingAllowBuilding[i])
                    {
                        length ++
                    }
                }
                if(length === 0)
                {
                    Data.users[userID].waitingAllowBuilding = null
                }
                const building = await Buildings.findOne({where: {id: buildingID}})
                if(!building)
                {
                    await api.api.messages.edit({
                        peer_id: context.peerId,
                        message: "⚠ Не актуально",
                        conversation_message_id: context.conversationMessageId,
                        keyboard: keyboard.inlineNone
                    })
                    return
                }
                if(Data.cities[building.dataValues.cityID].buildingsScore >= Data.cities[building.dataValues.cityID].maxBuildings)
                {
                    await api.api.messages.edit({
                        peer_id: context.peerId,
                        message: "⚠ Не хватает места в городе",
                        conversation_message_id: context.conversationMessageId,
                        keyboard: keyboard.inlineNone
                    })
                    await Buildings.destroy({where: {id: buildingID}})
                    const price = NameLibrary.ReversePrice(Prices["new_" + building.dataValues.type.replace("building_of_", "")])
                    await Data.AddPlayerResources(userID, price)
                    await api.SendMessageWithKeyboard(userID, `❌ Ваша заявка на размещение в городе постройки ${NameLibrary.GetBuildingType(building.dataValues.type)} отклонена. В городе не нашлось места для вашей постройки. Ресурсы возвращены.`, [[keyboard.backButton]])
                    return
                }
                await Keys.create({
                    houseID: building.dataValues.id,
                    ownerID: userID,
                    name: "🔑 " + building.dataValues.name
                })
                building.set({freezing: false})
                await building.save()
                await Data.LoadBuildings()
                Data.cities[building.dataValues.cityID].buildingsScore++
                await City.update({buildingsScore: Data.cities[building.dataValues.cityID].buildingsScore}, {where: {id: building.dataValues.cityID}})
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "✅ Принято",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
                await api.SendMessageWithKeyboard(userID, `✅ Ваша заявка принята. Теперь вы владелец постройки ${NameLibrary.GetBuildingType(building.dataValues.type)} в городе ${Data.GetCityName(building.dataValues.cityID)}`, [[keyboard.backButton]])
            }
            else
            {
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "⚠ Не актуально",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "CallbackEventController/AllowUserBuilding", e)
        }
    }

    async DeclineUserBuilding(context)
    {
        const userID = context.eventPayload.item
        const buildingID = context.eventPayload.addition
        try
        {
            let isActual = false
            let timeoutNum = null
            for (let i = 0; i < Data.users[userID]?.waitingAllowBuilding.length; i++)
            {
                if(Data.users[userID]?.waitingAllowBuilding[i])
                {
                    console.log(Data.users[userID]?.waitingAllowBuilding[i])
                    if(Data.users[userID]?.waitingAllowBuilding[i][0] === buildingID)
                    {
                        isActual = true
                        timeoutNum = i
                        break
                    }
                }
            }
            if(isActual)
            {
                clearTimeout(Data.users[userID]?.waitingAllowBuilding[timeoutNum][1])
                delete Data.users[userID]?.waitingAllowBuilding[timeoutNum]
                let length = 0
                for(let i = 0; i < Data.users[userID]?.waitingAllowBuilding.length; i++)
                {
                    if(Data.users[userID].waitingAllowBuilding[i])
                    {
                        length ++
                    }
                }
                if(length === 0)
                {
                    Data.users[userID].waitingAllowBuilding = null
                }
                const building = await Buildings.findOne({where: {id: buildingID}})
                await Buildings.destroy({where: {id: buildingID}})
                const price = NameLibrary.ReversePrice(Prices["new_" + building.dataValues.type.replace("building_of_", "")])
                await Data.AddPlayerResources(userID, price)
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "❌ Отклонено",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
                await api.SendMessageWithKeyboard(userID, `❌ Ваша заявка на размещение в городе постройки ${NameLibrary.GetBuildingType(building.dataValues.type)} отклонена. Глава города не дал одобрение на строительство. Ресурсы возвращены.`, [[keyboard.backButton]])
            }
            else
            {
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "⚠ Не актуально",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "CallbackEventController/DeclineUserBuilding", e)
        }
    }

    async HideRoadDistance(context)
    {
        const roadToID = context.eventPayload.item
        const roadFromID = context.eventPayload.addition
        try
        {
            const road = await CityRoads.findOne({where: {id: roadFromID}})
            if(road?.dataValues.time === 0 && road?.dataValues.isBlocked)
            {
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "✅ Принято",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
                await api.SendMessageWithKeyboard(context.peerId, "ℹ Вы направлены в режим ввода данных.\n\nℹ Нажмите кнопку \"Начать\" для того чтобы начать ввод информации о новой дороге", [[keyboard.startButton({type: "build_the_road", roadFromID: roadFromID, roadToID: roadToID})]])
                Data.users[context.peerId].state = Scenes.FillingOutTheForm
            }
            else
            {
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "⚠ Не актуально",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "CallbackEventController/HideRoadDistance", e)
        }
    }

    async AppealWarning(context)
    {
        const warningID = context.eventPayload.item
        try
        {
            const warning = await Warning.findOne({where: {id: warningID}})
            if(warning)
            {
                const user = await Player.findOne({where: {id: warning.dataValues.userID}})
                await Warning.destroy({where: {id: warningID}})
                const warnCount = await Warning.count({where: {userID: user.dataValues.id}})
                let request = `✅ Администрация проекта приняла решение обжаловать вам жалобу от ${NameLibrary.ParseDateTime(warning.dataValues.createdAt)}`
                if(user.dataValues.isBanned && warnCount < 3)
                {
                    await Player.update({warningScore: warnCount, isBanned: false}, {where: {id: user.dataValues.id}})
                    await Ban.destroy({where: {userID: user.dataValues.id}})
                    if(Data.users[user.dataValues.id]) delete Data.users[user.dataValues.id]
                    request += "\n\n✅ Теперь у вас менее 3-х предупреждений, поэтому вы получаете разбан в проекте"
                }
                else
                {
                    await Player.update({warningScore: warnCount}, {where: {id: user.dataValues.id}})
                    if(Data.users[user.dataValues.id]) Data.users[user.dataValues.id].warningScore = warnCount
                }
                await api.SendMessage(user.dataValues.id, request)
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "✅ Обжаловано",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
            }
            else
            {
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "⚠ Не актуально",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "CallbackEventController/AppealWarning", e)
        }
    }

    async AppealBan(context)
    {
        const banID = context.eventPayload.item
        try
        {
            const ban = await Ban.findOne({where: {id: banID}})
            if(ban)
            {
                const user = await Player.findOne({where: {id: ban.dataValues.userID}})
                await Ban.destroy({where: {id: banID}})
                await Warning.destroy({where: {userID: ban.dataValues.userID}})
                await Player.update({warningScore: 0, isBanned: false}, {where: {id: user.dataValues.id}})
                if(Data.users[user.dataValues.id]) delete Data.users[user.dataValues.id]
                await api.SendMessage(user.dataValues.id, `✅ Администрация проекта приняла решение обжаловать ваш бан от ${NameLibrary.ParseDateTime(ban.dataValues.createdAt)}\n\n✅ Теперь вы можете свободно пользоваться ботом и писать в чатах`)
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "✅ Обжаловано",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
            }
            else
            {
                await api.api.messages.edit({
                    peer_id: context.peerId,
                    message: "⚠ Не актуально",
                    conversation_message_id: context.conversationMessageId,
                    keyboard: keyboard.inlineNone
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "CallbackEventController/AppealBan", e)
        }
    }
}

module.exports = new CallbackEventController()