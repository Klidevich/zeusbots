const sequelize = require('./DataBase')
const {DataTypes} = require('sequelize')

//Характеристики игрока
const Player = sequelize.define("player", {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true},
    nick: {type: DataTypes.STRING, unique: false, allowNull: false},
    gender: {type: DataTypes.BOOLEAN, allowNull: false},
    isBanned: {type: DataTypes.BOOLEAN, defaultValue: false},
    warningScore: {type: DataTypes.INTEGER, defaultValue: 0},
    role: {type: DataTypes.STRING, allowNull: false, defaultValue: "player"},
    status: {type: DataTypes.STRING, allowNull: false, defaultValue: "stateless"}
})
const PlayerStatus = sequelize.define("player-status", {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true},
    location: {type: DataTypes.INTEGER, allowNull: false},
    countryID: {type: DataTypes.INTEGER, allowNull: false},
    citizenship: {type: DataTypes.INTEGER,  allowNull: true},
    registration: {type: DataTypes.INTEGER, allowNull: true, defaultValue: null},
    notifications: {type: DataTypes.BOOLEAN, defaultValue: true},
    isFreezing: {type: DataTypes.BOOLEAN, defaultValue: false},
    dodgeTaxScore: {type: DataTypes.INTEGER,  defaultValue: 0}
})
const PlayerInfo = sequelize.define("player-info", {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true},
    description: {type: DataTypes.TEXT, allowNull: false},
    marriedID: {type: DataTypes.INTEGER, unique: true, allowNull: true, defaultValue: null},
    nationality: {type: DataTypes.STRING, allowNull: false},
    age: {type: DataTypes.INTEGER, allowNull: false},
    msgs: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    audios: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    stickers: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    swords: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0}
})
const PlayerResources = sequelize.define("player-resources", {
    id: {type: DataTypes.INTEGER, unique: true, allowNull: false, primaryKey: true},
    money: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 100},
    stone: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    wood: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    wheat: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    iron: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    copper: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    silver: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    diamond: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0}
})
const OfficialInfo = sequelize.define("official-info", {
    id: {type: DataTypes.INTEGER, unique: true, allowNull: false, primaryKey: true},
    countryID: {type: DataTypes.INTEGER, allowNull: false},
    nick: {type: DataTypes.STRING, allowNull: false},
    canBeDelegate: {type: DataTypes.BOOLEAN, defaultValue: false},
    canBuildCity: {type: DataTypes.BOOLEAN, defaultValue: false},
    canUseResources: {type: DataTypes.BOOLEAN, defaultValue: false},
    canUseArmy: {type: DataTypes.BOOLEAN, defaultValue: false},
    canAppointOfficial: {type: DataTypes.BOOLEAN, defaultValue: false},
    canAppointMayors: {type: DataTypes.BOOLEAN, defaultValue: false},
})
const LastWills = sequelize.define("last-wills", {
    userID: {type: DataTypes.INTEGER, unique: true, allowNull: false, primaryKey: true},
    text: {type: DataTypes.STRING, allowNull: false},
    successorID: {type: DataTypes.INTEGER, allowNull: false},
})

//Государства
const Country = sequelize.define("country", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    name: {type: DataTypes.STRING, unique: true, allowNull: false},
    description: {type: DataTypes.TEXT, unique: true, allowNull: false},
    groupID: {type: DataTypes.INTEGER, allowNull: false,},
    photoURL: {type: DataTypes.STRING, allowNull: true},
    map: {type: DataTypes.STRING, allowNull: true},
    welcomePhotoURL: {type: DataTypes.STRING, allowNull: true},
    leaderID: {type: DataTypes.INTEGER, unique: false, allowNull: true},
    parliamentID: {type: DataTypes.INTEGER, unique: true, allowNull: true},
    governmentForm: {type: DataTypes.STRING, allowNull: false, defaultValue: "Монархия"},
    resources: {type: DataTypes.STRING, allowNull: false},
    capitalID: {type: DataTypes.INTEGER, unique: true, allowNull: false},
    citizenTax: {type: DataTypes.INTEGER, defaultValue: 0},
    nonCitizenTax: {type: DataTypes.INTEGER, defaultValue: 0},
    tax: {type: DataTypes.INTEGER, defaultValue: 0},
    entranceFee: {type: DataTypes.INTEGER, defaultValue: 0},
    isSiege: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    isUnderSanctions: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    notifications: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true},
    chatID: {type: DataTypes.INTEGER, allowNull: true, defaultValue: null},
    warnings: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    rating: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0}
})
const CountryResources = sequelize.define("country-resources", {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true},
    money: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    stone: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    wood: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    wheat: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    iron: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    copper: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    silver: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    diamond: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0}
})

const CountryRoads = sequelize.define("country-roads", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    fromID: {type: DataTypes.INTEGER, primaryKey: true, allowNull: false},
    toID : {type: DataTypes.INTEGER, allowNull: false},
    isBlocked: {type: DataTypes.BOOLEAN, defaultValue: false},
    time: {type: DataTypes.INTEGER, defaultValue: 0}
})

//Города
const City = sequelize.define("city", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    countryID: {type: DataTypes.INTEGER, allowNull: true},
    leaderID: {type: DataTypes.INTEGER, allowNull: false},
    name: {type: DataTypes.STRING, allowNull: false, unique: true},
    description: {type: DataTypes.STRING, allowNull: false},
    photoURL: {type: DataTypes.STRING, allowNull: true},
    buildingsScore: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    maxBuildings: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 4},
    isSiege: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    isCapital: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    isUnderSanctions: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    notifications: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true}
})

const CityResources = sequelize.define("city-resources", {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true},
    money: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    stone: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    wood: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    wheat: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    iron: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    copper: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    silver: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    diamond: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0}
})

const CityRoads = sequelize.define("city-roads", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    fromID: {type: DataTypes.INTEGER, primaryKey: true, allowNull: false},
    toID : {type: DataTypes.INTEGER, allowNull: false},
    isBlocked: {type: DataTypes.BOOLEAN, defaultValue: false},
    time: {type: DataTypes.INTEGER, defaultValue: 0}
})

//Строения
const Buildings = sequelize.define("buildings", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    cityID: {type: DataTypes.INTEGER, allowNull: false},
    name: {type: DataTypes.STRING, allowNull: false},
    description: {type: DataTypes.TEXT, allowNull: true},
    type: {type: DataTypes.STRING, allowNull: false},
    ownerID: {type: DataTypes.INTEGER, allowNull: false},
    ownerType: {type: DataTypes.STRING, allowNull: false, defaultValue: "user"},
    level: {type: DataTypes.INTEGER, allowNull: false},
    freezing: {type: DataTypes.BOOLEAN, defaultValue: false}
})

const BuildingAddon = sequelize.define("building-addons", {
    id: {type: DataTypes.INTEGER, primaryKey: true},
    name: {type: DataTypes.STRING, allowNull: false},
    type: {type: DataTypes.STRING, allowNull: false}
})

const Keys = sequelize.define("keys", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    houseID: {type: DataTypes.INTEGER, primaryKey: true, allowNull: false},
    ownerID: {type: DataTypes.INTEGER, allowNull: false},
    name: {type: DataTypes.STRING, allowNull: false}
})

//Предупреждения и баны
const Warning = sequelize.define("warnings", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    userID: {type: DataTypes.INTEGER, allowNull: false},
    reason: {type: DataTypes.STRING, allowNull: false},
    explanation: {type: DataTypes.STRING, allowNull: true},
    proofImage: {type: DataTypes.STRING, allowNull: true},
    time: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 90},
    banned: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false}
})
const Ban = sequelize.define("ban", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    userID: {type: DataTypes.INTEGER, allowNull: false},
    reason: {type: DataTypes.STRING, allowNull: false},
    explanation: {type: DataTypes.STRING, allowNull: true},
})

const Chats = sequelize.define("chats", {
    countryID: {type: DataTypes.INTEGER, primaryKey: true, allowNull: false},
    link: {type: DataTypes.STRING, allowNull: false},
    name: {type: DataTypes.STRING, allowNull: false}
})
const Messages = sequelize.define("messages", {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true},
    text: {type: DataTypes.TEXT, allowNull: false},
    isSilent: {type: DataTypes.BOOLEAN, defaultValue: true}
})

module.exports = {
    Player,
    PlayerStatus,
    PlayerInfo,
    PlayerResources,
    OfficialInfo,
    Country,
    CountryResources,
    CountryRoads,
    City,
    CityResources,
    CityRoads,
    Buildings,
    BuildingAddon,
    Warning,
    Ban,
    Keys,
    LastWills,
    Chats,
    Messages
}