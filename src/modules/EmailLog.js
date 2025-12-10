const EmailLog = (sequelize, DataTypes) => {
	return sequelize.define(
		"EmailLog",
		{
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			userId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				references: { model: "users", key: "id" },
			},
			templateId: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: { model: "templates", key: "id" },
			},
			resumeId: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: { model: "resumes", key: "id" },
			},
			recipients: {
				type: DataTypes.TEXT,
				allowNull: false,
				get() {
					const value = this.getDataValue("recipients");
					return value ? JSON.parse(value) : [];
				},
				set(value) {
					this.setDataValue("recipients", JSON.stringify(value));
				},
			},
			subject: { type: DataTypes.STRING, allowNull: false },
			status: { type: DataTypes.ENUM("sent", "failed"), defaultValue: "sent" },
			errorMessage: { type: DataTypes.TEXT, allowNull: true },
		},
		{
			tableName: "email_logs",
			timestamps: true,
		}
	);
};

module.exports = EmailLog;
