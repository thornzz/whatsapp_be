import logger from "../configs/logger.config.js";
export const handleWabaWebhookMessages = async (req, res, next) => {
  try {
    logger.info(req.body);
    res.status(200).json();
  } catch (error) {
    next(error);
  }
};
