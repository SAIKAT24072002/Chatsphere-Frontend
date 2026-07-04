import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

const user = JSON.parse(localStorage.getItem("user") || "null");
const token = localStorage.getItem("token") || null;

export const register = createAsyncThunk("auth/register", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/auth/register", data);
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Registration failed");
  }
});

export const login = createAsyncThunk("auth/login", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/auth/login", data);
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Login failed");
  }
});

export const fetchMe = createAsyncThunk("auth/fetchMe", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/auth/me");
    localStorage.setItem("user", JSON.stringify(res.data));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateProfile = createAsyncThunk("auth/updateProfile", async (data, { rejectWithValue }) => {
  try {
    const res = await api.put("/users/profile", data);
    localStorage.setItem("user", JSON.stringify(res.data));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const uploadAvatar = createAsyncThunk("auth/uploadAvatar", async (formData, { rejectWithValue }) => {
  try {
    const res = await api.post("/users/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: { user, token, loading: false, error: null },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    clearError(state) { state.error = null; },
    updateUserStatus(state, action) {
      if (state.user?._id === action.payload.userId) {
        state.user.status = action.payload.status;
      }
    },
    setUser(state, action) {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };
    builder
      .addCase(register.pending, pending)
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false; state.user = action.payload.user; state.token = action.payload.token;
      })
      .addCase(register.rejected, rejected)
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false; state.user = action.payload.user; state.token = action.payload.token;
      })
      .addCase(login.rejected, rejected)
      .addCase(fetchMe.fulfilled, (state, action) => { state.user = action.payload; })
      .addCase(updateProfile.fulfilled, (state, action) => { state.user = action.payload; })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        if (state.user) {
          state.user.avatar = action.payload.avatar;
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      });
  },
});

export const { logout, clearError, updateUserStatus, setUser } = authSlice.actions;
export default authSlice.reducer;
