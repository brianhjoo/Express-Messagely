"use strict";

const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { NotFoundError } = require("../expressError");

/** User of the site. */

class User {
  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hash = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users(username, password, first_name, last_name, phone)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING username, password, first_name, last_name, phone`,
      [username, hash, first_name, last_name, phone]
    );

    console.log("result:", result);

    const { username, password, first_name, last_name, phone } = result.rows[0];

    return { username, password, first_name, last_name, phone };
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
      FROM users
      WHERE username = $1`,
      [username]
    );
    console.log("result:", result);

    const hash = result.rows[0];
    //if no password returned, user does not exist
    if (!hash) return false;

    return await bcrypt.compare(password, hash);
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const now = new Date();
    const timestamp = `${now.toISOString()} ${now.getTimezoneOffset()}`;

    const result = await db.query(
      `UPDATE users
        SET last_login_at = $1
        WHERE username = $2
        RETURNING last_login_at`,
      [timestamp, username]
    );
    const lastLogin = result.rows[0];
    console.log("last login:", lastLogin);
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name
        FROM users`
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
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
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
        m.id as id
        m.to_user as to_user,
        m.body as body,
        m.sent_at as sent_at,
        m.read_at as read_at,
        t.username as username,
        t.first_name as first_name,
        t.last_name as last_name,
        t.phone as phone

        FROM messages as m
          JOIN users as t ON m.to_user = t.username
        WHERE from_username = $1`,
      [username]
    );
    const msgs = result.rows;
    if (!msgs) throw new NotFoundError(`No messages from ${username}!`);


    const msgsFrom = msgs.map((m) => {
      return {
        id: m.id,
        to_user: {
          username: m.username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone,
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at,
      };
    });

    return msgsFrom;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(`SELECT id, `);

  }
}

module.exports = User;
