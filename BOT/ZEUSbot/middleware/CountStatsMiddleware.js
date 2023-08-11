const Data = require("../models/CacheData")
const Commands = require("../variables/Commands")

module.exports = async (context, next) =>
{
    try
    {
        if(context.peerType === "chat")
        {
            if(context.player)
            {
                if(Data.activity[context.player.id])
                {
                    Data.activity[context.player.id]++
                }
                else
                {
                    Data.activity[context.player.id] = 1
                }
                if(context.command?.match(Commands.censorship))
                {
                    if(Data.uncultured[context.player.id])
                    {
                        Data.uncultured[context.player.id]++
                    }
                    else
                    {
                        Data.uncultured[context.player.id] = 1
                    }
                }
                for(let i = 0; i < context.attachments?.length; i++)
                {
                    if(context.attachments[i]?.type === "sticker")
                    {
                        if(Data.stickermans[context.player.id])
                        {
                            Data.stickermans[context.player.id]++
                        }
                        else
                        {
                            Data.stickermans[context.player.id] = 1
                        }
                    }
                    if(context.attachments[i]?.type === "audio")
                    {
                        if(Data.musicLovers[context.player.id])
                        {
                            Data.musicLovers[context.player.id]++
                        }
                        else
                        {
                            Data.musicLovers[context.player.id] = 1
                        }
                    }
                }
            }
        }
        next()
    }
    catch (e)
    {
        console.log(e)
    }
}