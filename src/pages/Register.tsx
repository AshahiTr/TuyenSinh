import React, { useState } from 'react';
import {
  Form, Input, Button, Card, Typography, Divider, message, Row, Col, DatePicker,
} from 'antd';
import {
  UserOutlined, LockOutlined, MailOutlined, PhoneOutlined,
  IdcardOutlined, EyeInvisibleOutlined, EyeTwoTone,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../store/authSlice';
import { api } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        dob: values.dob ? dayjs(values.dob).format('YYYY-MM-DD') : '',
      };
      const result = await api.register(payload);
      dispatch(login({ user: result.user, token: result.token }));
      message.success('Đăng ký thành công! Chào mừng bạn.');
      navigate('/dashboard');
    } catch (err: any) {
      message.error(err.message || 'Đăng ký thất bại!');
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
      <div style={{
        position: 'fixed', top: -80, right: -80, width: 300, height: 300,
        borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: -60, left: -60, width: 220, height: 220,
        borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 600, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 56, height: 56, background: '#faad14', borderRadius: '50%',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, color: '#003087', fontSize: 20, marginBottom: 10,
              boxShadow: '0 8px 24px rgba(250,173,20,0.4)',
            }}
          >
            TS
          </div>
          <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
            Tuyển Sinh Online
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.75)', margin: '4px 0 0' }}>
            Tạo tài khoản để bắt đầu đăng ký xét tuyển
          </Paragraph>
        </div>

        <Card style={{
          borderRadius: 16, border: 'none',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}>
          <Title level={4} style={{ textAlign: 'center', color: '#003087', marginBottom: 24 }}>
            Đăng ký tài khoản
          </Title>

          <Form form={form} onFinish={handleRegister} layout="vertical" size="large">
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="fullName"
                  label="Họ và tên"
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                >
                  <Input prefix={<UserOutlined style={{ color: '#bbb' }} />} placeholder="Nguyễn Văn A" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="dob"
                  label="Ngày sinh"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày sinh!' }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                    placeholder="DD/MM/YYYY"
                    disabledDate={(d) => d && d > dayjs().subtract(15, 'year')}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="idCard"
                  label="Số CCCD / CMND"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số CCCD!' },
                    { pattern: /^\d{9,12}$/, message: 'Số CCCD không hợp lệ (9-12 chữ số)!' },
                  ]}
                >
                  <Input prefix={<IdcardOutlined style={{ color: '#bbb' }} />} placeholder="0012XXXXXXXX" maxLength={12} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="phone"
                  label="Số điện thoại"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại!' },
                    { pattern: /^(0|\+84)[0-9]{9}$/, message: 'Số điện thoại không hợp lệ!' },
                  ]}
                >
                  <Input prefix={<PhoneOutlined style={{ color: '#bbb' }} />} placeholder="09XXXXXXXX" maxLength={11} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email!' },
                    { type: 'email', message: 'Email không hợp lệ!' },
                  ]}
                >
                  <Input prefix={<MailOutlined style={{ color: '#bbb' }} />} placeholder="example@gmail.com" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu!' },
                    { min: 6, message: 'Mật khẩu ít nhất 6 ký tự!' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#bbb' }} />}
                    placeholder="Ít nhất 6 ký tự"
                    iconRender={(v) => (v ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Mật khẩu không khớp!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#bbb' }} />}
                    placeholder="Nhập lại mật khẩu"
                    iconRender={(v) => (v ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginBottom: 8, marginTop: 4 }}>
              <Button
                type="primary" htmlType="submit" block loading={loading}
                style={{
                  background: '#003087', borderColor: '#003087',
                  height: 44, fontWeight: 600, fontSize: 15, borderRadius: 8,
                }}
              >
                Tạo tài khoản
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: '4px 0 16px' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>hoặc</Text>
          </Divider>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Đã có tài khoản? </Text>
            <Link to="/login" style={{ color: '#003087', fontWeight: 600 }}>
              Đăng nhập
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

export default Register;
