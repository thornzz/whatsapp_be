import { getAllUsers } from "../services/user.service.js";
import { getGlobalIO } from "../constants/index.js";
import OnlineUsers from "../constants/onlineusers.js";

export const getNextScreen = async (decryptedBody) => {
  const { screen, data, version, action, flow_token } = decryptedBody;
  const io = getGlobalIO();

  // handle health check request
  if (action === "ping") {
    return {
      version,
      data: {
        status: "active",
      },
    };
  }

  // handle error notification
  if (data?.error) {
    console.warn("Received client error:", data);
    return {
      version,
      data: {
        acknowledged: true,
      },
    };
  }

  // handle initial request when opening the flow
  if (action === "INIT") {
    return {
      version,
      screen: "START_CHAT",
      data: {
        departmant_list: [
          {
            id: "1",
            title: "SATIŞ",
          },
          {
            id: "2",
            title: "TEKNİK DESTEKK",
          },
        ],
      },
    };
  }

  // handle form submission action
  if (action === "data_exchange") {
    const { group_selection } = data;
    let responseBody = null;

    switch (screen) {
      case "START_CHAT":
        const agents = await getAllUsers();
        let online_agents = null;
        const agent_list = agents.map((agent) => ({
          id: agent._id.toString(),
          title: agent.name,
        }));

        if (OnlineUsers.getUsers().length > 0) {
          online_agents = agent_list.filter((agent) =>
            OnlineUsers.getUsers().some((user) => user.userId === agent.id)
          );
          responseBody = {
            version,
            screen: "ONLINE_AGENTS",
            data: {
              online_agents,
            },
          };
        } else {
          responseBody = {
            version,
            screen: "NO_ONLINE_AGENTS",
            data: {
              offline_text:'Şu anda hizmet verecek temsilci bulunmamaktadır',
            },
          };
        }

        // responseBody = {
        //   version,
        //   screen: "ONLINE_AGENTS",
        //   data: {
        //     agent_list: [
        //       {
        //         id: "1",
        //         name: "İbrahim Akgün (112)",
        //       },
        //       {
        //         id: "2",
        //         name: "Recep Karabacak (115)",
        //       },
        //     ],
        //   },
        // };
        break;
      case "ONLINE_AGENTS":
        const { selected_agent } = data;

        responseBody = {
          version,
          screen: "SUCCESS",
          data: {
            extension_message_response: {
              params: {
                flow_token: flow_token,
                selected_agent_id: selected_agent,
              },
            },
          },
        };
        break;
    }
    return responseBody;
  }

  throw new Error(`Unsupported request action ${action} & screen: ${screen}`);
};
