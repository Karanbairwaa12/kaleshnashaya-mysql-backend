require('dotenv').config()
const app = require('./app');
const { sequelize } = require('./src/modules');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {

        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });

    }catch(error) {

        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

startServer();
