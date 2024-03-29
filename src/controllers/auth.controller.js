import createHttpError from "http-errors";

import { createUser, signUser } from "../services/auth.service.js";
import { generateToken, verifyToken } from "../services/token.service.js";
import { findUser } from "../services/user.service.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, picture, status, password } = req.body;

    const newUser = await createUser({
      name,
      email,
      picture,
      status,
      password,
    });
    const access_token = await generateToken(
      { userId: newUser._id },
      "1d",
      process.env.ACCESS_TOKEN_SECRET
    );
    const refresh_token = await generateToken(
      { userId: newUser._id },
      "30d",
      process.env.REFRESH_TOKEN_SECRET
    );

    res.cookie("refreshtoken", refresh_token, {
      httpOnly: true,
      path: "/api/v1/auth/refreshtoken",
      maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
    });

    res.json({
      message: "kayıt başarılı.",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        picture: newUser.picture,
        status: newUser.status,
        token: access_token,
      },
    });
  } catch (error) {
    next(error);
  }
};
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await signUser(email, password);
    const access_token = await generateToken(
      { userId: user._id },
      "1d",
      process.env.ACCESS_TOKEN_SECRET
    );

    res.cookie("jwt", access_token, {
      maxAge: 1 * 12 * 60 * 60 * 1000, //12 saat
      //maxAge: 5000, //12 saat
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      //secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    });

    // const refresh_token = await generateToken(
    //   { userId: user._id },
    //   "30d",
    //   process.env.REFRESH_TOKEN_SECRET
    // );

    // res.cookie("refreshtoken", refresh_token, {
    //   httpOnly: true,
    //   path: "/api/v1/auth/refreshtoken",
    //   maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
    // });

    res.json({
      message: "giriş başarılı.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        status: user.status,
        // token: access_token,
        phonenumber: user.phonenumber,
      },
    });
  } catch (error) {
    next(error);
  }
};
export const logout = async (req, res, next) => {
  try {
    //res.clearCookie("refreshtoken", { path: "/api/v1/auth/refreshtoken" });
    res.cookie("jwt", "", { expires: new Date(0), httpOnly: true });
    res.json({
      message: "çıkış yapıldı !",
    });
  } catch (error) {
    next(error);
  }
};

// export const refreshToken = async (req, res, next) => {
//   try {
//     const refresh_token = req.cookies.refreshtoken;
//     if (!refresh_token) throw createHttpError.Unauthorized("Lütfen giriş yapın.");
//     const check = await verifyToken(
//       refresh_token,
//       process.env.REFRESH_TOKEN_SECRET
//     );
//     const user = await findUser(check.userId);
//     const access_token = await generateToken(
//       { userId: user._id },
//       "1d",
//       process.env.ACCESS_TOKEN_SECRET
//     );
//     res.json({
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         picture: user.picture,
//         status: user.status,
//         token: access_token,
//         phonenumber:user.phonenumber
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };
