import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AppStatus = 'pending' | 'approved' | 'rejected';

export interface Application {
  id: string;
  _id?: string; // ID từ MongoDB
  userId: string;
  universityId: string;
  universityName: string;
  majorId: string;
  majorName: string;
  subjectGroup: string;
  fullName: string;
  dob: string;
  idCard: string;
  phone: string;
  email: string;
  scores: { subject: string; score: number }[];
  priorityGroup: string;
  priorityArea: string;
  files: { name: string; url: string; type: string }[];
  status: AppStatus;
  submittedAt: string;
  note?: string;
}

interface ApplicationState {
  applications: Application[];
}

const initialState: ApplicationState = {
  applications: [],
};

const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    setApplications(state, action: PayloadAction<Application[]>) {
      state.applications = action.payload;
    },
    addApplication(state, action: PayloadAction<Application>) {
      state.applications.push(action.payload);
    },
    updateStatus(
      state,
      action: PayloadAction<{ id: string; status: AppStatus; note?: string }>
    ) {
      const app = state.applications.find((a) => (a._id || a.id) === action.payload.id);
      if (app) {
        app.status = action.payload.status;
        if (action.payload.note) app.note = action.payload.note;
      }
    },
  },
});

export const { setApplications, addApplication, updateStatus } = applicationSlice.actions;
export default applicationSlice.reducer;