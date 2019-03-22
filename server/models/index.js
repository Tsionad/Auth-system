/* eslint-disable import/no-mutable-exports */
import 'dotenv/config';
import Sequelize from 'sequelize';

let sequelize;
if (process.env.DATABASE_URL) {
  // Production env
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
  });
}
if (process.env.DATABASE) {
  // Postgres env
  sequelize = new Sequelize(
    process.env.DATABASE,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD,
    {
      dialect: 'postgres',
    },
  );
} else {
  // Sqlite
  sequelize = new Sequelize(process.env.TEST_DATABASE);
}

const models = {
  User: sequelize.import('./user'),
};

export { sequelize };

export default models;
