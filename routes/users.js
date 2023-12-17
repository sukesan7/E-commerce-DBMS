import { Router } from 'express';
import { rowToUser } from '../helpers/rowToObjects.js';
const router = Router();

// User registration route
router.post('/add', async (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(403).send('Permission denied');
  }
  const { name, email, password, phone } = req.body;
  const { id } = req.session.user;


  let [login_id, user_id] = (await req.db.execute(`SELECT MAX(login_id) FROM credentials UNION SELECT MAX(user_id) FROM consumers`)).rows.map(row => row[0]); // get the max login_id from credentials table
  login_id = `L${parseInt(login_id.slice(1)) + 1}`; // increment the login_id by 1
  user_id = `U${parseInt(user_id.slice(1)) + 1}`; // increment the user_id by 1

  req.db.execute(`INSERT ALL
      INTO credentials (login_id, password) VALUES ('${login_id}', '${password}')
      INTO consumers (user_id, name, email, phone_number, login_id) VALUES ('${user_id}', '${name}', '${email}', '${phone}', '${login_id}')
      INTO useraddition (user_id, admin_id, date_added) VALUES ('${user_id}', '${id}', SYSDATE)
      INTO usermanage (user_id, admin_id) VALUES ('${user_id}', '${id}')
    SELECT 1 FROM DUAL`)
    .then((result) => {
      if (result.rowsAffected > 0) {
        req.db.commit();
        res.status(200).send('User registered successfully');
      } else {
        res.status(500).send('Error registering user');
      }
    });
});

// User login route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // JOIN query based on administrators.login_id and credentials.login_id to match email from administrators table and password from credentials table for oracle 11g
  req.db.execute(`SELECT * FROM consumers, credentials
    WHERE consumers.login_id = credentials.login_id 
    AND email = '${email}' AND password = '${password}'`)
    .then((result) => {
      if (result.rows.length > 0) {
        const users = result.rows.map(rowToUser);
        req.session.user = users[0];
        req.session.isAdmin = false;

        res.redirect('/products.html');
      } else {
        res.status(401).send('Invalid email or password');
      }
    }).catch((err) => {
      console.error(err);
      res.status(500).send('Error authenticating user');
    });
});

// Admin login route
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;

  // JOIN query based on administrators.login_id and credentials.login_id to match email from administrators table and password from credentials table for oracle 11g
  req.db.execute(`SELECT * FROM administrators, credentials
    WHERE administrators.login_id = credentials.login_id 
    AND email = '${email}' AND password = '${password}'`)
    .then((result) => {
      if (result.rows.length > 0) {
        const admins = result.rows.map(rowToUser);
        req.session.user = admins[0];
        req.session.isAdmin = true;

        res.redirect('/adminDash.html');
      } else {
        res.status(401).send('Invalid email or password');
      }
    }).catch((err) => {
      console.error(err);
      res.status(500).send('Error authenticating admin');
    });
});

export default router;