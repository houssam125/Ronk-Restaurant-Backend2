import { Pool } from "pg";

export const pool = new Pool({
  user: "houssam",
  host: "dpg-d1gpmu7fte5s738vghrg-a.oregon-postgres.render.com",
  database: "ronk_db",
  password: "nqYeITUUQSR9Mt81tK4czXf7WKRFEvBD",
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});
