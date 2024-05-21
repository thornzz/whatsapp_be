import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fileUpload from "express-fileupload";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import createHttpError from "http-errors";
import morgan from "morgan";

import routes from "./routes/index.js";

import "express-async-errors";

//dotEnv config
dotenv.config();

//create express app
const app = express();

//use cors
const corsOptions = {
  origin: "https://wabusiness.k2msoftware.com",
  credentials: true,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

//morgan
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

//helmet
app.use(helmet());

//parse json request url
app.use(express.json());

//parse json request body
app.use(express.urlencoded({ extended: true }));

//enable cookie parser
app.use(cookieParser());

//sanitize request data
app.use(mongoSanitize());

//gzip compression
app.use(compression());

//file upload
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

//api v1 routes
app.use("/api/v1", routes);

app.use(async (req, res, next) => {
  next(createHttpError.NotFound("This route does not exist."));
});

//error handling
app.use(async (err, req, res, next) => {
  res.status(err.status || 500);

  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

export default app;
