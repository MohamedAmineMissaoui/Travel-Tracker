import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

let db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "chelsea2001",
  port: "5432"
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

/*db.query("SELECT country_code FROM visited_countries", (err, res) => {
  if (err) {
    console.error("error executing query", err.stack);
  } else {
    countries_code = res.rows;
    console.log(countries_code);
  }

  db.end();
});*/

db.connect();

app.get("/", async (req, res) => {
  const error = req.query.error;
  try {
    const result = await db.query("SELECT country_code FROM visited_countries");
    let countries_code = [];
    result.rows.forEach((row) => {
      countries_code.push(row.country_code);
    });
    console.log(countries_code);

    res.render("index.ejs", {
      countries: countries_code,
      total: countries_code.length,
      error: error
    });
  } catch (error) {
    console.error("error executing query", error.stack);
    res.status(500).send("Internal Server Error");
  }

});

app.post("/add", async (req, res) => {
  const countryVisited = req.body.country;
  console.log(countryVisited);
  let visitedCountryCode;
  try {
    const result = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%' ", [countryVisited.toLowerCase()]);
    if (result.rows.length > 0) {
      visitedCountryCode = result.rows[0].country_code;
      console.log(visitedCountryCode);
    } else {
      console.log("No matching country found");
    }
    
  } catch (error) {
    console.error("error executing query", error.stack);
    res.status(500).send("Internal Server Error in SELECT query");
    return;
  }

  
  if (visitedCountryCode) {
    const existingRecord = await db.query("SELECT 1 FROM visited_countries WHERE country_code = $1", [visitedCountryCode]);
    if (existingRecord.rows.length === 0) {
      try {
        await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [visitedCountryCode]);
      } catch (error) {
        console.error("error executing query", error.stack);
        res.status(500).send("Internal Server Error in INSERT query");
        return;
      }

      res.redirect("/");
    } else {
      const matchingError = "Country already visited";
      console.log(matchingError);
      res.redirect("/?error=" + encodeURIComponent(matchingError));
    }
    
  } else {
    const matchingErreur = "No matching country found, Try again";
    console.log(matchingErreur);
    res.redirect("/?error=" + encodeURIComponent(matchingErreur));
  }
 
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
