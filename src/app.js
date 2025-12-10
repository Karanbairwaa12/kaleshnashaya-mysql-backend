const express = require('express')
const session = require('express-session')
const passport = require("./config/oauth")
const cors = require('cors')
const morgan = require('morgan')
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const templateRoutes = require('./routes/templateRoutes');
const emailRoutes = require('./routes/emailRoutes');

const app = express()

app.use(cors({
    origin: process.env.FRONTED_URL,
    Credential: true,
}))

app.use(express.json())
app.use(morgan('dev'))
app.use(express.urlencoded({extended: true}))

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize())
app.use(passport.session())

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Kalesh Nashaya Backend API',
        version: '1.0.0'
    })
})


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/emails', emailRoutes);
module.exports = app
