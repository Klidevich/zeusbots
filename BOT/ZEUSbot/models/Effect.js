const NameLibrary = require("../variables/NameLibrary")
const Data = require("./CacheData")
class Effect
{
    constructor(effect, time, id)
    {
        this.type = effect.type
        this.id = id
        this.isValid = true
        this.time = new Date()
        this.time.setMinutes(this.time.getMinutes() + time)
        this.timeout = setTimeout(() =>
        {
            this.isValid = false
            Data.users[this.id]?.CheckEffectsList()
        }, time * 60000)
    }

    GetInfo()
    {
        return `${NameLibrary.GetEffectName(this.type)} - осталось ${NameLibrary.ParseFutureTime(this.time)}`
    }
}

module.exports = Effect