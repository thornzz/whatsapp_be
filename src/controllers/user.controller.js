import createHttpError from "http-errors";
import logger from "../configs/logger.config.js";
import { searchUsers as searchUsersService, getSocketStatus as getSocketStatusService } from "../services/user.service.js";
export const searchUsers = async (req, res, next) => {
  try {
    const keyword = req.query.search;
    if (!keyword) {
      logger.error("Please add a search query first");
      throw createHttpError.BadRequest("Oops...Something went wrong !");
    }
    const users = await searchUsersService(keyword, req.user.userId);
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};
export const getSocketStatus = async (req, res, next) => {
  try {
  
    const status = await getSocketStatusService();
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};
