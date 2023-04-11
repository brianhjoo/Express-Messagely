"use strict";

const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { NotFoundError } = require("../expressError");
const db = require("../db");


/** User of the site. */

class User {
  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hash = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users(username,
                        password,
                        first_name,
                        last_name,
                        phone,
                        join_at,
                        last_login_at)
        VALUES
            ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, password, first_name, last_name, phone`,
      [username, hash, first_name, last_name, phone]
    );

    return result.rows[0];
  }


  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
        FROM users
        WHERE username = $1`,
        [username]
    );

    const hash = result.rows[0].password;

    return (await bcrypt.compare(password, hash) === true);
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
        SET last_login_at = current_timestamp
        WHERE username = $1
        RETURNING last_login_at`,
        [username]
    );

    if (!result.rows[0]) throw new NotFoundError(`User ${username}, not found!`);

    console.log('Login timestamp updated!');
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name
        FROM users
        ORDER BY username`
    );

    const allUsers = result.rows; //doublecheck each row is {username:, ...}

    return allUsers;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username,
              first_name,
              last_name,
              phone,
              join_at,
              last_login_at
        FROM users
        WHERE username = $1`,
        [username]
    );

    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT
          m.id as id,
          m.to_username as to_user,
          m.body as body,
          m.sent_at as sent_at,
          m.read_at as read_at,
          u.username as username,
          u.first_name as first_name,
          u.last_name as last_name,
          u.phone as phone
        FROM messages as m
          JOIN users as u ON m.to_username = u.username
        WHERE from_username = $1`,
        [username]
    );

    const msgsFrom = result.rows;

    return msgsFrom.map(function(m) {
      return {
        id: m.id,
        to_user: {
          username: m.to_user,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone,
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at,
      };
    });
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT
          m.id AS id,
          m.from_username AS from_user,
          m.body AS body,
          m.sent_at AS sent_at,
          m.read_at AS read_at,
          u.username AS username,
          u.first_name AS first_name,
          u.last_name AS last_name,
          u.phone AS phone
       FROM messages AS m
         JOIN users AS u
           ON u.username = m.from_username
       WHERE m.to_username = $1`,
      [username]
    );

    const msgsTo = result.rows;

    return msgsTo.map(function (m) {
      return {
        id: m.id,
        from_user: {
          username: m.username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at
      };
    });
  }
}


module.exports = User;



