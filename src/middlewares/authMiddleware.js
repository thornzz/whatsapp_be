import createHttpError from "http-errors";
import jwt from "jsonwebtoken";

import { findUser } from "../services/user.service.js";
import asyncHandler from "../utils/asynchandler.js";

async function authMiddleware(req, res, next) {
  // Exclude authentication for the /webhook route
  if (req.path === "/webhook") {
    return next();
  }

  // with token authentication

  // if (!req.headers["authorization"]) {
  //   return next(createHttpError.Unauthorized());
  // }

  // const bearerToken = req.headers["authorization"];
  // const token = bearerToken.split(" ")[1];

  // jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
  //   if (err) {

  //     return next(createHttpError.Unauthorized());
  //   }
  //   req.user = payload;
  //   next();
  //})
  console.log(req.cookies.jwt);
  let token;
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      createHttpError.Unauthorized(
        "You are not logged in! Please log in to get access."
      )
    );
  }

  // 2) Verification token
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  // 3) Check if user still exists
  const currentUser = await findUser(decoded.userId);
  if (!currentUser) {
    return next(
      createHttpError.Unauthorized(
        "The user belonging to this token does no longer exist."
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  // if (currentUser.changedPasswordAfter(decoded.iat)) {
  //   return next(
  //     new AppError("User recently changed password! Please log in again.", 401)
  //   );
  // }
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
}
export default asyncHandler(authMiddleware);
