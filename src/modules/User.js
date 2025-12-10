const User = (sequelize, DataTypes) => {
	return sequelize.define(
		"User",
		{
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			googleId: { type: DataTypes.STRING, unique: true, allowNull: false },
			email: {
				type: DataTypes.STRING,
				unique: true,
				allowNull: false,
				validate: { isEmail: true },
			},
			name: { type: DataTypes.STRING, allowNull: false },
			profilePicture: { type: DataTypes.STRING, allowNull: true },
			phone: { type: DataTypes.STRING, allowNull: true },
			bio: { type: DataTypes.TEXT, allowNull: true },
			accessToken: { type: DataTypes.TEXT, allowNull: true },
			refreshToken: { type: DataTypes.TEXT, allowNull: true },
			isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
		},
		{
			tableName: "users",
			timestamps: true,
		}
	);
};

module.exports = User;
