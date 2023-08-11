const {Upload} = require("vk-io")
const api = require("./API")

module.exports = new Upload({api: api.api})