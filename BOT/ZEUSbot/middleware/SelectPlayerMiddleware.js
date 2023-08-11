module.exports = (context, next) =>
{
    try
    {
        if(context.peerType === "chat")
        {
            context.replyPlayers = []
            const ids = context.command?.match(/id\d+/)
            let temp = null
            for(let i = 0; i < ids?.length; i++)
            {
                temp = parseInt(ids[i].replace("id", ""))
                if(!context.replyPlayers.includes(temp))
                {
                    context.replyPlayers.push(temp)
                }
            }
            if(context.replyMessage)
            {
                context.replyPlayers.push(context.replyMessage.senderId)
            }
            for(let i = 0; i < context.forwards.length; i++)
            {
                if(context.forwards[i].senderId > 0 && !context.replyPlayers.includes(context.forwards[i].senderId))
                {
                    context.replyPlayers.push(context.forwards[i].senderId)
                }
            }
            context.command = context.command?.replace(/\[.*?] /g, "")
            context.command = context.command?.replace(/ \[.*?]/g, "")
        }
        return next()
    }
    catch (e)
    {
        console.log(e)
    }
}