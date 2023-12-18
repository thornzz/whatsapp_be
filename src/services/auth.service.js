import createHttpError from "http-errors";
import validator from "validator";
import bcrypt from "bcrypt";
import { UserModel } from "../models/index.js";
import dotenv from "dotenv";

//dotEnv config
dotenv.config();
//env variables

const { DEFAULT_PICTURE_LINK, DEFAULT_STATUS_MESSAGE } = process.env;


export const createUser = async (userData) => {
  const { name, email, picture, status, password } = userData;

  //check if fields are empty
  if (!name || !email || !password) {
    throw createHttpError.BadRequest("Lütfen tüm alanları doldurun");
  }

  //check name length
  if (
    !validator.isLength(name, {
      min: 2,
      max: 25,
    })
  ) {
    throw createHttpError.BadRequest(
      "Tam isminizin 2 ila 16 karakter arasında olması gerekiyor."
    );
  }

  //Check status length
  if (status && status.length > 64) {
    throw createHttpError.BadRequest(
      "Durum bilginiz en fazla 64 karakter olabilir"
    );
  }

  //check if email address is valid
  if (!validator.isEmail(email)) {
    throw createHttpError.BadRequest(
      "Geçerli bir email adresi girdiğinizden emin olun."
    );
  }

  //check if user already exist
  const checkDb = await UserModel.findOne({ email });
  if (checkDb) {
    throw createHttpError.Conflict(
      "Lütfen başka bir email adresi deneyin, bu adres zaten mevcut."
    );
  }

  //check password length
  if (
    !validator.isLength(password, {
      min: 6,
      max: 128,
    })
  ) {
    throw createHttpError.BadRequest(
      "Şifreniz 6 ila 128 karakter arasında olması gerekmektedir."
    );
  }

  //hash password--->to be done in the user model
  
  //adding user to databse
  const user = await new UserModel({
    name,
    email,
    picture: picture || DEFAULT_PICTURE_LINK,
    status: status || DEFAULT_STATUS_MESSAGE,
    password,
  }).save();

  return user;
};

export const signUser = async (email, password) => {
  const user = await UserModel.findOne({ email: email.toLowerCase() }).lean();

  //check if user exist
  if (!user) throw createHttpError.NotFound("Geçersiz giriş bilgisi.");

  //compare passwords
  let passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) throw createHttpError.NotFound("Geçersiz giriş bilgisi.");

  return user;
};
