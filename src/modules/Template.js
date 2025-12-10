const Template = (sequelize, DataTypes) => {
  return sequelize.define('Template', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    name: { type: DataTypes.STRING, allowNull: false },
    subject: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false }
  }, {
    tableName: 'templates',
    timestamps: true
  });
};

module.exports = Template;
