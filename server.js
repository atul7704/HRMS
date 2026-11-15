require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const PORT = process.env.PORT|| 3000;
const HOST = process.env.DB_HOST || "0.0.0.0";
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
const adminRoute=require("./routers/adminRoutes")
const companyRoute=require("./routers/companyRoutes")
const employeeRoute=require("./routers/employeeRoutes")


console.log("Server is running ")
app.get("/", (req, res) => {
  res.send("Wecome to HRMS");
});

app.use("/admin", adminRoute)
app.use("/employee", employeeRoute)
app.use("/company", companyRoute)

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`);
});
