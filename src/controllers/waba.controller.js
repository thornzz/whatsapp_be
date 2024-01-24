import logger from "../configs/logger.config.js";
import {
  handleIncomingWabaMessage,
  parseIncomingWabaFlowMessages,
  DownloadFileFromWaba,
} from "../services/waba.service.js";

export const handleWabaWebhookMessages = async (req, res, next) => {
  try {
    handleIncomingWabaMessage(req.body);
    logger.info(JSON.stringify(req.body, null, 2));

    res.status(200).json({ status: "OK" });
  } catch (error) {
    next(error);
  }
};
export const handleIncomingWabaFlowMessages = async ({ body }, res, next) => {
  try {
    console.log(body);
    const response = await parseIncomingWabaFlowMessages(body);
    console.log(response, "response");
    res.send(response);
  } catch (error) {
    next(error);
  }
};

export const handleDownloadFileFromWaba = async ({ body }, res, next) => {
  try {
    const mediaid = body.mediaId;
    const response = await DownloadFileFromWaba(mediaid);

    res.setHeader("Content-Disposition", `attachment; filename="hebele"`);
    console.log(res);
    res.send(response.data);
  } catch (error) {
    console.log(error);
    next(error);
  }
};
