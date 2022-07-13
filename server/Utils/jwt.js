require("dotenv").config()
const jwt = require('jsonwebtoken')

const sign = (payload) => jwt.sign(payload, process.env.PAYLOAD_KEY, { expiresIn: "30d" })
module.exports = {
    sign
}