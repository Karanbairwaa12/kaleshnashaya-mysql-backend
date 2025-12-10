const Resume = (sequelize, DataTypes) => {
	return sequelize.define(
		"Resume",
		{
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			userId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				references: { model: "users", key: "id" },
			},
			title: { type: DataTypes.STRING, allowNull: false },
			fileName: { type: DataTypes.STRING, allowNull: false },
			filePath: { type: DataTypes.STRING, allowNull: false },
			fileSize: { type: DataTypes.INTEGER, allowNull: false },
			mimeType: { type: DataTypes.STRING, allowNull: false },
		},
		{
			tableName: "resumes",
			timestamps: true,
		}
	);
};

module.exports = Resume;
