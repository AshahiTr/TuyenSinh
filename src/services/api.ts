import universityData from '../data/universities.json';

export interface University {
  id: string;
  name: string;
  majors: Major[];
}

export interface Major {
  id: string;
  name: string;
  code: string;
  quota: number;
  subjectGroups: SubjectGroup[];
}

export interface SubjectGroup {
  id: string;
  code: string;
  subjects: string[];
}

const MOCK_UNIVERSITIES: University[] = universityData as University[];

const BASE_URL = 'http://localhost:5000/api';

export const api = {
  async getUniversities(): Promise<University[]> {
    return new Promise((res) => setTimeout(() => res(MOCK_UNIVERSITIES), 300));
  },

  async getMajorsByUniversity(universityId: string): Promise<Major[]> {
    return new Promise((res) => {
      const uni = MOCK_UNIVERSITIES.find((u) => u.id === universityId);
      setTimeout(() => res(uni ? uni.majors : []), 200);
    });
  },

  // Đăng nhập
  async login(email: string, password: string): Promise<{ user: any; token: string }> {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Đăng nhập thất bại!');
    }
    return response.json();
  },

  // Đăng ký
  async register(data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    dob: string;
    idCard: string;
  }): Promise<{ user: any; token: string }> {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Đăng ký thất bại!');
    }
    return response.json();
  },

  // Upload file lên MongoDB Atlas qua Backend
  async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },

  // Lưu hồ sơ vào MongoDB Atlas
  async submitApplication(data: any): Promise<any> {
    const response = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Submit failed');
    }
    return response.json();
  },

  // Lấy danh sách hồ sơ từ MongoDB Atlas
  async getApplications(userId: string): Promise<any[]> {
    const response = await fetch(`${BASE_URL}/applications/${userId}`);
    if (!response.ok) throw new Error('Fetch failed');
    return response.json();
  },
};

export { MOCK_UNIVERSITIES };