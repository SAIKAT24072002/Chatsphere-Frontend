import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initSocket, disconnectSocket } from "../utils/socket";
import { addMessage, removeMessage, setTyping, updateReaction, updateMessageReadStatus } from "../redux/slices/messageSlice";
import { updateUserStatus, updateLastMessage, addNewChat, updateChatInList, setOnlineUsers } from "../redux/slices/chatSlice";
import { updateUserStatus as updateOwnStatus } from "../redux/slices/authSlice";
import { addNotification } from "../redux/slices/notificationSlice";
import toast from "react-hot-toast";

export const useSocket = () => {
  const dispatch = useDispatch();
  const { token, user } = useSelector((s) => s.auth);
  const { activeChat } = useSelector((s) => s.chat);
  const socketRef = useRef(null);
  const activeChatRef = useRef(activeChat);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    if (!token || !user) return;

    const socket = initSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      dispatch(updateOwnStatus({ userId: user._id, status: "online" }));
    });
    socket.on("connect_error", (err) => console.error("Socket error:", err.message));

    socket.on("onlineUsers", (userIds) => {
      dispatch(setOnlineUsers(userIds));
      if (userIds.includes(user._id)) {
        dispatch(updateOwnStatus({ userId: user._id, status: "online" }));
      }
    });

    socket.on("userStatus", ({ userId, status }) => {
      dispatch(updateUserStatus({ userId, status }));
      if (userId === user._id) {
        dispatch(updateOwnStatus({ userId, status }));
      }
    });

    socket.on("newMessage", (message) => {
      console.log("NEW MESSAGE RECEIVED:", message);
      dispatch(addMessage(message));
      const chatId = message.chat?._id || message.chat;
      dispatch(updateLastMessage({ chatId, message }));

      // Notify if not current chat
      const activeChatId = activeChatRef.current?._id;
      if (message.sender?._id !== user._id && chatId !== activeChatId) {
        toast(`New message from ${message.sender?.username}: ${message.type === "text" ? message.content : `sent a ${message.type}`}`, { icon: "💬" });
      }
    });

    socket.on("newNotification", (notification) => {
      dispatch(addNotification(notification));
    });

    socket.on("messageDeleted", ({ messageId }) => {
      dispatch(removeMessage({ messageId }));
    });

    socket.on("typing", ({ userId, username, chatId, isTyping }) => {
      dispatch(setTyping({ chatId, userId, username, isTyping }));
    });

    socket.on("messageReaction", ({ messageId, reactions }) => {
      dispatch(updateReaction({ messageId, reactions }));
    });

    socket.on("messageRead", ({ messageId, userId }) => {
      dispatch(updateMessageReadStatus({ messageId, userId }));
    });

    socket.on("newGroup", (group) => {
      dispatch(addNewChat(group));
      toast(`You were added to ${group.name}`, { icon: "👥" });
    });

    socket.on("addedToGroup", (group) => {
      dispatch(addNewChat(group));
    });

    socket.on("groupUpdated", (group) => {
      dispatch(updateChatInList(group));
    });

    socket.on("removedFromGroup", ({ groupId }) => {
      toast("You were removed from a group", { icon: "⚠️" });
    });

    return () => {
      disconnectSocket();
      dispatch(updateOwnStatus({ userId: user._id, status: "offline" }));
    };
  }, [token, user?._id]);

  return socketRef.current;
};
