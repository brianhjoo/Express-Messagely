"use strict";

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */
  // TODO: password hashing required here??
  static async register({ username, password, first_name, last_name, phone }) {
    const result = await db.query(
      `INSERT INTO users(username, password, first_name, last_name, phone)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING username, password, first_name, last_name, phone`,
         [username, password, first_name, last_name, phone]
    );

    console.log('result:', result);

    const userData = result.rows[0];

    console.log(username);

    return {username, password, first_name, last_name, phone};
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
        FROM users
        WHERE username = $1
          AND password = $2`,
        [username, password]
    );

    console.log('result:', result);

    return result.rows[0].length > 0;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
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
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
  }
}


module.exports = User;
