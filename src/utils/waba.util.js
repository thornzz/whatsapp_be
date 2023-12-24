export const parseIncomingWabaMessage = async (data) => {

  const contact = data.contacts?.[0]?.profile;
  const message = data.messages?.[0];
  const status = data.statuses?.[0];

  if (contact?.name && message?.from && message?.text?.body) {
    return {
      name: contact.name,
      from: message.from,
      message: message.text.body,
      messagetype:'newmessage',
      waba_id:message.id
    };
  } else if (status?.id && status?.status && status?.type) {
    return {
      waba_id: status.id,
      status: status.status,
      type: status.type,
      messagetype:'status'
    };
  }

  return null;
};
