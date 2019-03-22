/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
/* eslint-disable no-return-await */
/* eslint-disable func-names */
import bcrypt from 'bcrypt';

const user = (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
    firstName: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    lastName: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNulll: false,
      validate: {
        notEmpty: true,
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [7, 42],
      },
    },
    role: {
      type: DataTypes.STRING,
    },
    linkedinId: {
      type: DataTypes.STRING,
    },
  });

  User.beforeCreate(async (user) => {
    user.password = await user.generatePasswordHash();
  });
  User.prototype.generatePasswordHash = async function () {
    const saltRounds = 10;
    return await bcrypt.hash(this.password, saltRounds);
  };
  User.prototype.validatePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };
  User.findByLogin = async (login) => {
    let user = await User.findOne({
      where: { email: login },
    });

    if (!user) {
      user = await User.findOne({
        where: { linkedId: login },
      });
    }

    return user;
  };
  return User;
};

export default user;
