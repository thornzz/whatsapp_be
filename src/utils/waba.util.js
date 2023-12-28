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
    response.waba_id = message.id;
    response.message = message.text.body;
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
