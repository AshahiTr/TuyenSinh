// src/services/api.ts
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

// Xác định base URL dựa trên môi trường
const getBaseUrl = () => {
  // Trên Netlify production hoặc preview
  if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
    return '/api';
  }
  // Trên local development với netlify dev
  return '/api';
};

const BASE_URL = getBaseUrl();

// Helper function để xử lý response
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Nếu không parse được JSON
      errorMessage = await response.text().catch(() => errorMessage);
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

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
    console.log('Calling login API:', `${BASE_URL}/auth/login`);
    
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    return handleResponse(response);
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
    console.log('Calling register API:', `${BASE_URL}/auth/register`);
    
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    return handleResponse(response);
  },

  // Upload file lên MongoDB Atlas qua Netlify Function
  async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    return handleResponse(response);
  },

  // Lưu hồ sơ vào MongoDB Atlas
  async submitApplication(data: any): Promise<any> {
    const response = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    return handleResponse(response);
  },

  // Lấy danh sách hồ sơ từ MongoDB Atlas
  async getApplications(userId: string): Promise<any[]> {
    const response = await fetch(`${BASE_URL}/applications/${userId}`);
    return handleResponse(response);
  },

  // Lấy tất cả hồ sơ (cho admin)
  async getAllApplications(): Promise<any[]> {
    const response = await fetch(`${BASE_URL}/applications`);
    return handleResponse(response);
  },

  // Cập nhật trạng thái hồ sơ
  async updateApplicationStatus(applicationId: string, status: string, note?: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/applications/${applicationId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note }),
    });
    
    return handleResponse(response);
  },

  // Health check
  async healthCheck(): Promise<any> {
    const response = await fetch(`${BASE_URL}/health`);
    return handleResponse(response);
  },
};

export { MOCK_UNIVERSITIES };