/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this._notes = notes;

    this.reservationCount = undefined;
  }

  /** set notes to empty string if it's originally set to a falsy value */
  set notes(txt) {
    if (!txt) {
      this.notes = '';
    } else {
      this.notes = txt;
    }
  }

  get notes() {
    return this._notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** find customers filtered by search string */
  static async searchCustomers(searchString) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       WHERE lower(concat(first_name, ' ', last_name)) like '%'||$1||'%'
       ORDER BY last_name, first_name`, [searchString.toLowerCase()]
    );
    return results.rows.map(c => new Customer(c));
  }

  static async getTop10Customers() {
    
    const customerResults = await db.query(
      `SELECT 
      c.id, c.first_name as "firstName", c.last_name as "lastName", c.phone as "phone", c.notes as "notes", count(r.id) as reservation_count from customers c
      left join reservations r on c.id = r.customer_id
      group by c.id
      order by reservation_count desc
      limit 10
      `
    )

    let out = customerResults.rows.map(c => new Customer(c));
    return out;
    
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`
  }
}

module.exports = Customer;
