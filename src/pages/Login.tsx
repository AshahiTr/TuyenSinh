import React, { useState } from 'react';
import {
  Form, Input, Button, Card, Typography, Divider, message, Space, Checkbox,
} from 'antd';
import {
  UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../store/authSlice';
import { api } from '../services/api';

const { Title, Text, Paragraph } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleLogin = async (values: { email: string; password: string; remember: boolean }) => {
    setLoading(true);
    try {
      const result = await api.login(values.email, values.password);
      dispatch(login({ user: result.user, token: result.token }));
      if (values.remember) {
        localStorage.setItem('ts_token', result.token);
        localStorage.setItem('ts_user', JSON.stringify(result.user));
      }
      message.success(`Chào mừng, ${result.user.fullName}!`);
      navigate('/dashboard');
    } catch (err: any) {
      message.error(err.message || 'Email hoặc mật khẩu không đúng!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #003087 0%, #1677ff 60%, #69b1ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      {/* Decorative circles */}
      <div style={{
        position: 'fixed', top: -80, right: -80, width: 300, height: 300,
        borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: -60, left: -60, width: 220, height: 220,
        borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, background: '#faad14', borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, color: '#003087', fontSize: 24, marginBottom: 12,
            boxShadow: '0 8px 24px rgba(250,173,20,0.4)',
          }}>
            TS
          </div>
          <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
            Tuyển Sinh Online
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.75)', margin: '4px 0 0' }}>
            Hệ thống xét tuyển đại học trực tuyến
          </Paragraph>
        </div>

        <Card style={{
          borderRadius: 16, border: 'none',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}>
          <Title level={4} style={{ textAlign: 'center', color: '#003087', marginBottom: 24 }}>
            Đăng nhập
          </Title>

          <Form form={form} onFinish={handleLogin} layout="vertical" size="large">
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
              ]}
            >
              <Input prefix={<UserOutlined style={{ color: '#bbb' }} />} placeholder="example@gmail.com" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bbb' }} />}
                placeholder="Nhập mật khẩu..."
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                </Form.Item>
                <Link to="/forgot-password" style={{ color: '#1677ff', fontSize: 13 }}>
                  Quên mật khẩu?
                </Link>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary" htmlType="submit" block loading={loading}
                style={{
                  background: '#003087', borderColor: '#003087',
                  height: 44, fontWeight: 600, fontSize: 15, borderRadius: 8,
                }}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: '4px 0 16px' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>hoặc</Text>
          </Divider>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Chưa có tài khoản? </Text>
            <Link to="/register" style={{ color: '#003087', fontWeight: 600 }}>
              Đăng ký ngay
            </Link>
          </div>
        </Card>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
            © 2025 Tuyển Sinh Online • Bộ Giáo dục và Đào tạo
          </Text>
        </div>
      </div>
    </div>
  );
};

export default Login;
