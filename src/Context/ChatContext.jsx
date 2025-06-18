import { createContext, useContext,useReducer} from "react";
import { AuthContext } from "./AuthContext";

export const ChatContext = createContext()

export const ChatProvider = ({ children }) => {
    const {Currentuser} = useContext(AuthContext);
     const INITIAL_STATE = {
        user: {},
        chatId: "null",
     }
     const chatReducer = (state, action) => {
        switch (action.type) {
            case "CHANGE_USER":
                return {
                    user: action.payload,
                    chatId: Currentuser.uid > action.payload.uid
                        ? Currentuser.uid + action.payload.uid
                        : action.payload.uid + Currentuser.uid,
                };
                default:
                return state;
        }
     }
      const [state, dispatch] = useReducer(chatReducer, INITIAL_STATE);
  return (
    <ChatContext.Provider value={{data: state, dispatch}}>
      {children}
    </ChatContext.Provider>
  )
}