import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

export const fetchChats = createAsyncThunk("chat/fetchChats", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/chats");
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const accessChat = createAsyncThunk("chat/accessChat", async (userId, { rejectWithValue }) => {
  try {
    const res = await api.post("/chats", { userId });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createGroup = createAsyncThunk("chat/createGroup", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/groups", data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateGroup = createAsyncThunk("chat/updateGroup", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/groups/${id}`, data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const addGroupMembers = createAsyncThunk("chat/addGroupMembers", async ({ groupId, memberIds }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/groups/${groupId}/members`, { memberIds });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const removeGroupMember = createAsyncThunk("chat/removeGroupMember", async ({ groupId, userId }, { rejectWithValue }) => {
  try {
    await api.delete(`/groups/${groupId}/members/${userId}`);
    return { groupId, userId };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chats: [],
    activeChat: null,
    loading: false,
    error: null,
    onlineUsers: [],
  },
  reducers: {
    setActiveChat(state, action) { state.activeChat = action.payload; },
    setOnlineUsers(state, action) {
      const onlineIds = action.payload || [];
      state.onlineUsers = onlineIds;
      const updateMember = (m) => {
        const isOnline = onlineIds.includes(m._id.toString());
        if (!isOnline) return { ...m, status: "offline" };
        if (m.status === "offline" || !m.status) return { ...m, status: "online" };
        return m;
      };
      state.chats = state.chats.map((chat) => ({
        ...chat,
        members: chat.members.map(updateMember),
      }));
      if (state.activeChat) {
        state.activeChat = {
          ...state.activeChat,
          members: state.activeChat.members.map(updateMember),
        };
      }
    },
    updateUserStatus(state, action) {
      const { userId, status } = action.payload;
      state.chats = state.chats.map((chat) => ({
        ...chat,
        members: chat.members.map((m) =>
          m._id === userId ? { ...m, status } : m
        ),
      }));
      if (state.activeChat) {
        state.activeChat = {
          ...state.activeChat,
          members: state.activeChat.members.map((m) =>
            m._id === userId ? { ...m, status } : m
          ),
        };
      }
      if (status === "online" && !state.onlineUsers.includes(userId)) {
        state.onlineUsers.push(userId);
      } else if (status === "offline") {
        state.onlineUsers = state.onlineUsers.filter((id) => id !== userId);
      }
    },
    updateLastMessage(state, action) {
      const { chatId, message } = action.payload;
      state.chats = state.chats.map((c) =>
        c._id === chatId ? { ...c, lastMessage: message, updatedAt: new Date().toISOString() } : c
      );
      // Sort chats by latest message
      state.chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },
    // addNewChat(state, action) {
    //   const exists = state.chats.find((c) => c._id === action.payload._id);
    //   if (!exists) state.chats.unshift(action.payload);
    // },
    addNewChat(state, action) {
  console.log("new id:", action.payload._id);

  state.chats.forEach(chat => {
    console.log("existing id:", chat._id);
  });

  const exists = state.chats.find(
    c => String(c._id) === String(action.payload._id)
  );

  console.log("exists:", exists);

  if (!exists) {
    state.chats.unshift(action.payload);
  }
},
    updateChatInList(state, action) {
      state.chats = state.chats.map((c) =>
        c._id === action.payload._id ? action.payload : c
      );
      if (state.activeChat?._id === action.payload._id) {
        state.activeChat = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => { state.loading = true; })
      .addCase(fetchChats.fulfilled, (state, action) => { state.loading = false; state.chats = action.payload; })
      .addCase(fetchChats.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(accessChat.fulfilled, (state, action) => {
        const exists = state.chats.find((c) => c._id === action.payload._id);
        if (!exists) state.chats.unshift(action.payload);
        state.activeChat = action.payload;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.chats.unshift(action.payload);
        state.activeChat = action.payload;
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.chats = state.chats.map((c) => c._id === action.payload._id ? action.payload : c);
        if (state.activeChat?._id === action.payload._id) state.activeChat = action.payload;
      })
      .addCase(addGroupMembers.fulfilled, (state, action) => {
        state.chats = state.chats.map((c) => c._id === action.payload._id ? action.payload : c);
        if (state.activeChat?._id === action.payload._id) state.activeChat = action.payload;
      })
      .addCase(removeGroupMember.fulfilled, (state, action) => {
        const { groupId, userId } = action.payload;
        state.chats = state.chats.map((c) => {
          if (c._id !== groupId) return c;
          return { ...c, members: c.members.filter((m) => m._id !== userId) };
        });
      });
  },
});

export const { setActiveChat, setOnlineUsers, updateUserStatus, updateLastMessage, addNewChat, updateChatInList } = chatSlice.actions;
export default chatSlice.reducer;
