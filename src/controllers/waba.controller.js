import logger from "../configs/logger.config.js";
import {handleIncomingWabaMessage} from '../services/waba.service.js';

export const handleWabaWebhookMessages = async (req, res, next) => {
  try {
    handleIncomingWabaMessage(req.body)
    //logger.info(JSON.stringify(req.body, null, 2));

    res.status(200).json({"status":"OK"});
  } catch (error) {
    next(error);
  }
};
