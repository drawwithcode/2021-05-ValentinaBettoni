console.log("up and running");

let express = require("express");

let app = express();

let port = 3000;

let server = app.listen(port);

console.log("Server is running on http://localhost:" + port);

app.use(express.static("public"));
