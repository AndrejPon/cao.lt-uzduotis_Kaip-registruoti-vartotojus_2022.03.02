const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const mysql = require('mysql2/promise');

const dbConfig = require('./dbConfig');

const PORT = process.env.SERVER_PORT || 3000;
const userSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});
const app = express();

// middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello');
});

app.post('/register', async (req, res) => {
  let userData = req.body;
  try {
    userData = await userSchema.validateAsync(userData);
  } catch (error) {
    console.log(error);
    return res.status(400).send({ error: 'Incorrect data sent' });
  }
  try {
    const hashedPassword = bcrypt.hashSync(userData.password, 10);
    const conn = await mysql.createConnection(dbConfig);
    const sql = `
    INSERT INTO users (username, password)
    VALUES (?, ?)
    `;
    const [newUserdata] = await conn.execute(sql, [
      userData.username,
      hashedPassword,
    ]);

    await conn.close();
    return res.send(newUserdata);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: 'Unexpected error. Please try again.' });
  }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
