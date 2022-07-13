require("dotenv").config()
const express = require("express")
const cors = require("cors")
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const moment = require("moment")
const { Server } = require('socket.io')
const { sign } = require("./Utils/jwt")
const cookieParser = require('cookie-parser')
const app = express()

app.use(express.json())
app.use(cors())
app.use(cookieParser())
const PORT = process.env.PORT || 9000
const { Pool } = require("pg")
moment.locale('us-latn')

const pool = new Pool({
    connectionString: 'postgres://alznxfga:byllwR16H_CGrv_sIcOkg9dIO-KiBl5r@tiny.db.elephantsql.com/alznxfga'
})

app.post("/login", async(req, res)=> {
    const { email, password } = req.body

    const client = await pool.connect()
    const existingUser = await client.query("SELECT * FROM msg WHERE user_email = $1", [email])

    if(existingUser.rowCount === 0){
        res.json({status: "You are not registered yet", loggedIn: false})

        return
    }else {
        const isSamePass = await bcrypt.compare(password, existingUser.rows[0]?.user_password)

        if(!isSamePass){
            res.json({status: "Your password is incorrect", loggedIn: false})
            return
        }else {
            let token = sign({user_id: existingUser.rows[0]?.user_id, user_email:  existingUser.rows[0]?.user_email})

            res.json({status: "Success!", loggedIn: true, full_name: existingUser.rows[0]?.user_fullname, token: token})

            return
        }
    }
})

app.get("/login", async(req, res) => {
    const { authtoken } = req.headers

    if(!authtoken) {
        res.json({status: "Token is not defined", loggedIn: false})

        return
    }

    jwt.verify(authtoken, process.env.PAYLOAD_KEY, (err, decode) => {
        if(err instanceof jwt.TokenExpiredError) {
            return res.json({status: "Token invalid", loggedIn: false})
        }

        if(err instanceof jwt.JsonWebTokenError) {
            return res.json({status: "Token invalid", loggedIn: false})
        }

        res.json({status: "Success!", loggedIn: true, token: authtoken})
    })
})

app.post("/regester", async(req, res) => {
    const { full_name, email, password, reset_password } = req.body

    if(password != reset_password){
        res.json({status: "Reseat password is not equal to password", loggedIn: false})

        return
    }else {
        const client = await pool.connect()
        const existingUser = await client.query("SELECT * FROM msg WHERE user_email = $1", [email])

        if(existingUser.rowCount === 0){
            const hashedPass = await bcrypt.hash(password, 10)

            const newUser = await pool.query(
                "INSERT INTO msg(user_fullname, user_email, user_password) VALUES($1, $2, $3) RETURNING user_id, user_email", [full_name, email, hashedPass]
            );

            let token = sign({user_id: newUser.rows[0]?.user_id, user_email:  newUser.rows[0]?.user_email})

            res.json({status: "Success!", loggedIn: true, full_name: full_name, token: token})

            return
        }else {
            res.json({status: "You have already registered", loggedIn: false})

            return
        }
    }
})

const server = app.listen(PORT, () => {
    console.log("APP LISTEN " + PORT + " PORT");
})

const io = new Server(server)

io.on('connection', async(socket) => {
    socket.on('new-message', async({ message }) => {
        const client = await pool.connect()

        const existingUser = await client.query("INSERT INTO user_msg(user_id, msg_text) VALUES($1, $2)", [message?.user_id, message?.msg_text])

        const allMsg = await client.query("SELECT m.user_id, m.user_fullname, m.user_email, um.msg_id, um.msg_text, um.send_data FROM msg m INNER JOIN user_msg um ON m.user_id = um.user_id ORDER BY um.msg_id")

        const momentUser_msg = await allMsg?.rows?.filter(e => e.send_data = moment(e.send_data).format('LLL'))

        client.release()
        io.emit('all-msg', { users: momentUser_msg })
    })
})

app.get("/msg", async(req, res) => {
    const client = await pool.connect()

    const allMsg = await client.query("SELECT m.user_id, m.user_fullname, m.user_email, um.msg_id, um.msg_text, um.send_data FROM msg m INNER JOIN user_msg um ON m.user_id = um.user_id ORDER BY um.msg_id")

    const momentUser_msg = await allMsg?.rows?.filter(e => e.send_data = moment(e.send_data).format('LLL'))

    client.release()

    res.json({ users: momentUser_msg })
})

app.get("/user", async(req, res) => {
    const client = await pool.connect()

    const allUsers =  await client.query("SELECT * FROM msg")
    client.release()
    res.json({ users: allUsers })
})