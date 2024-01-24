// export const parseIncomingWabaMessage = async (data) => {

//   const contact = data.contacts?.[0]?.profile;
//   const message = data.messages?.[0];
//   const status = data.statuses?.[0];

//   if (contact?.name && message?.from && message?.text?.body) {
//     return {
//       name: contact.name,
//       from: message.from,
//       message: message.text.body,
//       messagetype:'newmessage',
//       waba_id:message.id
//     };
//   } else if (status?.id && status?.status && status?.type) {
//     return {
//       waba_id: status.id,
//       status: status.status,
//       type: status.type,
//       messagetype:'status'
//     };
//   }
//   if (contact?.name && message?.from) {
//     return {
//       name: contact.name,
//       from: message.from,
//       selected_agent: JSON.parse(message.interactive.nfm_reply.response_json).selected_agent,
//       messagetype: 'newmessage',
//       waba_id: message.id
//     };
//   }

//   return null;
// };

// export const parseIncomingWabaMessage = async (data) => {
//   const contact = data.contacts?.[0]?.profile;
//   const message = data.messages?.[0];
//   const status = data.statuses?.[0];

//   let response = {};

//   if (contact?.name) {
//     response.name = contact.name;
//   }

//   if (message?.from) {
//     response.from = message.from;
//   }

//   if (message?.interactive?.nfm_reply?.response_json) {
//     const responseJson = JSON.parse(
//       message.interactive.nfm_reply.response_json
//     );
//     if (responseJson.selected_agent) {
//       response.selected_agent = responseJson.selected_agent;
//     }
//     response.messagetype = "flow";
//   }

//   if (message?.id && !response.messagetype) {
//     response.waba_id = message.id;
//     response.message = message.text.body;
//     response.messagetype = "newmessage";
//   }

//   if (status?.id && status?.status && status?.type) {
//     response = {
//       waba_id: status.id,
//       status: status.status,
//       type: status.type,
//       messagetype: "status",
//     };
//   }

//   return Object.keys(response).length ? response : null;
// };
export const getFileType = (memType) => {
  switch (memType) {
    case "text/plain":
      return "TXT";
    case "application/pdf":
      return "PDF";
    case "application/msword":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "DOCX";
    case "application/vnd.ms-powerpoint":
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return "PPTX";
    case "application/vnd.ms-excel":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "XLSX";
    case "application/vnd.rar":
      return "RAR";
    case "application/zip":
      return "ZIP";
    case "audio/mpeg":
    case "audio/wav":
      return "AUDIO";
    case "video/mp4":
    case "video/mpeg":
      return "VIDEO";
    default:
      return undefined;
  }
};

export const parseIncomingWabaMessage = async (data) => {
  const contact = data.contacts?.[0]?.profile;
  const message = data.messages?.[0];
  const status = data.statuses?.[0];

  let response = {};

  if (contact?.name) {
    response.name = contact.name;
  }

  if (message?.from) {
    response.from = message.from;
  }

  if (message?.interactive?.nfm_reply?.response_json) {
    const responseJson = JSON.parse(
      message.interactive.nfm_reply.response_json
    );
    if (responseJson.selected_agent) {
      response.selected_agent = responseJson.selected_agent;
    }
    response.messagetype = "flow";
  }

  if (message?.id && !response.messagetype) {
    let waba_file = [];

    if (message?.document) {
      let modified_document = { ...message.document, type: "document" };

      waba_file.push({
        file: modified_document,
        type: getFileType(modified_document.mime_type),
      });
      response.files = waba_file;
    }
    if (message?.image) {
      console.log(message.image, "message.image");
      let modified_document = { ...message.image, type: "image" };

      waba_file.push({
        file: modified_document,
        type: getFileType(modified_document.mime_type),
      });
      response.files = waba_file;
    }
    response.waba_id = message.id;
    response.message = message.text?.body;
    response.messagetype = "newmessage";
  }

  if (status?.id && status?.status && status?.type) {
    response = {
      waba_id: status.id,
      status: status.status,
      type: status.type,
      messagetype: "status",
    };
  }

  return Object.keys(response).length ? response : null;
};
