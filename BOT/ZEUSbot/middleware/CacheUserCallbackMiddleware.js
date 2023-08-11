const Data = require("../models/CacheData");
const {Player, PlayerStatus, PlayerInfo, PlayerResources} = require("../database/Models");
const User = require("../models/User");
const SceneManager = require("../controllers/SceneController");
const keyboard = require("../variables/Keyboards");
module.exports = async (context, next) =>
{
    try
    {
        const peerId = context.peerId
        if(Data.users[peerId])
        {
            context.player = Data.users[peerId]
            return next()
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
                    return next()
                }
                else if(context.peerType !== "chat")
                {
                    context.send(`🚫Внимание!🚫
                                Вы были забанены в проекте *public218388422 («ZEUS - Вселенная игроков»)
                                Если вы не согласны с блокировкой - напишите одному из админов:
                                ${Data.GiveAdminList()}`, {
                        keyboard: keyboard.none
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