import logger from "../configs/logger.config.js";
import {handleIncomingWabaMessage,parseIncomingWabaFlowMessages} from '../services/waba.service.js';

export const handleWabaWebhookMessages = async (req, res, next) => {
  try {
    console.log(JSON.stringify(req.body));

    handleIncomingWabaMessage(req.body)
    //logger.info(JSON.stringify(req.body, null, 2));

    res.status(200).json({"status":"OK"});
  } catch (error) {
    next(error);
  }
};
export const handleIncomingWabaFlowMessages = async ({ body }, res,next)  => {
  try {
   
    const response = await parseIncomingWabaFlowMessages(body);
    console.log(response,'response');
    res.send(response);
    
  } catch (error) {
    next(error);
  }
};

