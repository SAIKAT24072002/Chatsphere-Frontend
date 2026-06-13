import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

export const fetchMessages = createAsyncThunk("message/fetchMessages", async ({ chatId, page = 1 }, { rejectWithValue }) => {
  try {
    const res = await api.get(`/messages/${chatId}?page=${page}&limit=50`);
    return { ...res.data, chatId, page };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const sendMessage = createAsyncThunk("message/sendMessage", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/messages/", data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const searchMessages = createAsyncThunk("message/searchMessages", async (params, { rejectWithValue }) => {
  try {
    const res = await api.get("/messages/search", { params });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const deleteMessage = createAsyncThunk("message/deleteMessage", async (messageId, { rejectWithValue }) => {
  try {
    await api.delete(`/messages/${messageId}`);
    return messageId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const messageSlice = createSlice({
  name: "message",
  initialState: {
    messagesByChatId: {},
    searchResults: [],
    typingUsers: {},
    loading: false,
    error: null,
  },
  reducers: {
    addMessage(state, action) {
      const msg = action.payload;
      const chatId = msg.chat?._id || msg.chat;
      if (!state.messagesByChatId[chatId]) state.messagesByChatId[chatId] = [];
      const exists = state.messagesByChatId[chatId].find((m) => m._id === msg._id);
      if (!exists) state.messagesByChatId[chatId].push(msg);
    },
    removeMessage(state, action) {
      const { messageId } = action.payload;
      Object.keys(state.messagesByChatId).forEach((chatId) => {
        state.messagesByChatId[chatId] = state.messagesByChatId[chatId].map((m) =>
          m._id === messageId ? { ...m, isDeleted: true, content: "This message was deleted" } : m
        );
      });
    },
    setTyping(state, action) {
      const { chatId, userId, username, isTyping } = action.payload;
      if (!state.typingUsers[chatId]) state.typingUsers[chatId] = {};
      if (isTyping) state.typingUsers[chatId][userId] = username;
      else delete state.typingUsers[chatId][userId];
    },
    updateReaction(state, action) {
      const { messageId, reactions } = action.payload;
      Object.keys(state.messagesByChatId).forEach((chatId) => {
        state.messagesByChatId[chatId] = state.messagesByChatId[chatId].map((m) =>
          m._id === messageId ? { ...m, reactions } : m
        );
      });
    },
    clearSearch(state) { state.searchResults = []; },
    clearChatMessages(state, action) {
      delete state.messagesByChatId[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => { state.loading = true; })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { chatId, messages, page } = action.payload;
        if (page === 1) {
          state.messagesByChatId[chatId] = messages;
        } else {
          state.messagesByChatId[chatId] = [
            ...messages,
            ...(state.messagesByChatId[chatId] || []),
          ];
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const msg = action.payload;
        const chatId = msg.chat?._id || msg.chat;
        if (!state.messagesByChatId[chatId]) state.messagesByChatId[chatId] = [];
        const exists = state.messagesByChatId[chatId].find((m) => m._id === msg._id);
        if (!exists) state.messagesByChatId[chatId].push(msg);
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const messageId = action.payload;
        Object.keys(state.messagesByChatId).forEach((chatId) => {
          state.messagesByChatId[chatId] = state.messagesByChatId[chatId].map((m) =>
            m._id === messageId ? { ...m, isDeleted: true, content: "This message was deleted" } : m
          );
        });
      })
      .addCase(searchMessages.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      });
  },
});

export const { addMessage, removeMessage, setTyping, updateReaction, clearSearch, clearChatMessages } = messageSlice.actions;
export default messageSlice.reducer;
