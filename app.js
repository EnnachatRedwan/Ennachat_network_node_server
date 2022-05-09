const express = require("express");
const { render } = require("express/lib/response");
const neo4j = require("neo4j-driver");
const uuid = require("uuid");

const app = express();

//Neo4j setup
const uri = "neo4j+s://fb05089b.databases.neo4j.io:7687";
const user = "neo4j";
const password = "PFvKxx8dTOoiVpmIb_XsQyY56M9fpOp9u7Z3ld5aqC0";
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const session = driver.session();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("./public"));

app.get("/login", (req, res) => {
  const headers=req.headers;
  console.log(headers);
  if (
    headers.email != undefined &&
    headers.email != "" &&
    headers.password != undefined &&
    headers.password != ""
  ) {
    session
      .run(
        "match(u:User{email:'" +
        headers.email +
          "',password:'" +
          headers.password +
          "'})-[:Specialized_in]->(f) return u,f;"
      )
      .then((result) => {
        if (result.records.length != 0) {
          result.records.forEach((record) => {
            res.send({...record._fields[0].properties,'functionality':record._fields[1].properties["title"]});
          });
        } else {
          res.send({ GUID: "" });
        }
      })
      .catch((err) => {
        res.send({ GUID: "" });
        console.log(err);
      });
  } else {
    res.send({ GUID: "" });
  }
});

app.post("/register", (req, res) => {
  const body = req.body;
  console.log(body);
  const guid = uuid.v1();
  if (
    body.email != undefined &&
    body.email != "" &&
    body.password != undefined &&
    body.password != "" &&
    body.name != undefined &&
    body.name != "" &&
    body.functionality != undefined &&
    body.functionality != ""
  ) {
    session
      .run(
        "create (u:User{email:'"+body.email+"',name:'"+body.name+"',password:'"+body.password+"',GUID:'"+guid+"'}) with u "+
        "match(f:Field{title:'"+body.functionality+"'})"+
        "create (u)-[:Specialized_in]->(f);"
      )
      .then((result) => {
        res.send({ result: "SC" }); //Successfully created
      })
      .catch((err) => {
        res.send({ result: "AX" }); //AI:Already exists
        console.log(err);
      });
  } else {
    res.send({ result: "WI" }); //WI:wrong infos
  }
});

app.get("/fields", (req, res) => {
  const fields = [];
  session
    .run("match(f:Field) return f;")
    .then((result) => {
      result.records.forEach((record) => {
        fields.push(record._fields[0].properties["title"]);
      });
      res.send({ fields: fields });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/accounts", (req, res) => {
  const records = [];
  session
    .run("match(u:User) return u")
    .then((result) => {
      result.records.forEach((record) => {
        records.push(record._fields[0].properties);
      });
      res.send(records);
    })
    .catch((err) => {
      console.log(err);
    });
});



app.listen(3000, () => {
  console.log("Server launched at port 3000");
});
