const api = require("../middleware/API")
const upload = require("../middleware/Upload")
const fs = require('fs')
const Data = require("../models/CacheData")
const NameLibrary = require("../variables/NameLibrary")

class ErrorHandler
{
    async SendLogs(context, place, error)
    {
        try
        {
            await api.SendMessage(context.player.id, "⛔Ошибка⛔\nПроизошла ошибка, вся информация отправлена поддержке, скоро это будет исправлено.")

            const filename = `error_${NameLibrary.GetDate() + "_" + NameLibrary.GetTime()}.log`
            await new Promise(res => {
                fs.appendFile("./logs/" + filename, error.stack,  (err) => {
                    if (err) throw err
                    return res()
                })
            })
            await upload.messageDocument({
                peer_id: context.player.id,
                source: {
                    value: "./logs/" + filename
                },
                title: filename
            }).then(async (log) => {

                for (const key of Object.keys(Data.supports))
                {
                    await api.api.messages.send({
                        user_id: Data.supports[key].id,
                        random_id: Math.round(Math.random() * 100000),
                        message: `⚠Произошла ошибка⚠\nИгрок: *id${context.player.id}(${context.player.nick})\nМесто: ${place}\nКод ошибки: ${error.message}`,
                        attachment: log
                    })
                }
            })
        }
        catch (e)
        {
            console.log(e)
        }
    }
}

module.exports = new ErrorHandler()