const { Sequelize, DataTypes } = require("sequelize");
const config = require("../config/database");

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

const sequelize = new Sequelize(
	dbConfig.database,
	dbConfig.username,
	dbConfig.password,
	dbConfig
);

const User = require("./User")(sequelize, DataTypes);
// const Resume = require("./Resume")(sequelize, DataTypes);
// const Template = require("./Template")(sequelize, DataTypes);
// const EmailLog = require("./EmailLog")(sequelize, DataTypes);

// User → Resume
// User.hasMany(Resume, {
// 	foreignKey: "userId",
// 	as: "resumes",
// 	onDelete: "CASCADE",
// });
// Resume.belongsTo(User, { foreignKey: "userId", as: "user" });

// // User → Template
// User.hasMany(Template, {
// 	foreignKey: "userId",
// 	as: "templates",
// 	onDelete: "CASCADE",
// });
// Template.belongsTo(User, { foreignKey: "userId", as: "user" });

// // User → EmailLog
// User.hasMany(EmailLog, {
// 	foreignKey: "userId",
// 	as: "emailLogs",
// 	onDelete: "CASCADE",
// });
// EmailLog.belongsTo(User, { foreignKey: "userId", as: "user" });

// // Resume → EmailLog
// Resume.hasMany(EmailLog, { foreignKey: "resumeId", as: "emailLogs" });
// EmailLog.belongsTo(Resume, { foreignKey: "resumeId", as: "resume" });

// // Template → EmailLog
// Template.hasMany(EmailLog, { foreignKey: "templateId", as: "emailLogs" });
// EmailLog.belongsTo(Template, { foreignKey: "templateId", as: "template" });

module.exports = {
	sequelize,
	Sequelize,
	User,
	// Resume,
	// Template,
	// EmailLog,
};
