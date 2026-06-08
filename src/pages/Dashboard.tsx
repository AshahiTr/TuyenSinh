import React from 'react';
import {
  Row, Col, Card, Statistic, Button, Typography, Tag, List, Avatar,
  Empty, Timeline, Badge, Space,
} from 'antd';
import {
  FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ClockCircleOutlined, PlusOutlined, ArrowRightOutlined,
  TrophyOutlined, UserOutlined, BellOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setApplications, Application } from '../store/applicationSlice';
import { api } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const statusConfig: Record<Application['status'], { color: string; label: string; icon: React.ReactNode }> = {
  pending: { color: 'orange', label: 'Chờ duyệt', icon: <ClockCircleOutlined /> },
  approved: { color: 'green', label: 'Đã duyệt', icon: <CheckCircleOutlined /> },
  rejected: { color: 'red', label: 'Từ chối', icon: <CloseCircleOutlined /> },
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);
  const applications = useSelector((s: RootState) => s.application.applications);
  const userApps = applications.filter((a) => a.userId === user?.id);

  React.useEffect(() => {
    if (user?.id) {
      api.getApplications(user.id).then(apps => dispatch(setApplications(apps)));
    }
  }, [user?.id, dispatch]);

  const stats = {
    total: userApps.length,
    pending: userApps.filter((a) => a.status === 'pending').length,
    approved: userApps.filter((a) => a.status === 'approved').length,
    rejected: userApps.filter((a) => a.status === 'rejected').length,
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #003087 0%, #1677ff 100%)',
          border: 'none',
          borderRadius: 16,
        }}
        bodyStyle={{ padding: '32px' }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>
              Xin chào, {user?.fullName}! 👋
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.8)', margin: '8px 0 0' }}>
              Chào mừng đến với Hệ thống Tuyển sinh Đại học Trực tuyến
            </Paragraph>
          </Col>
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => navigate('/apply')}
              style={{
                background: '#faad14', borderColor: '#faad14', color: '#003087',
                fontWeight: 600, height: 44,
              }}
            >
              Nộp hồ sơ mới
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: 'Tổng hồ sơ', value: stats.total, color: '#1677ff', icon: <FileTextOutlined /> },
          { title: 'Chờ duyệt', value: stats.pending, color: '#faad14', icon: <ClockCircleOutlined /> },
          { title: 'Đã duyệt', value: stats.approved, color: '#52c41a', icon: <CheckCircleOutlined /> },
          { title: 'Từ chối', value: stats.rejected, color: '#ff4d4f', icon: <CloseCircleOutlined /> },
        ].map((s) => (
          <Col xs={12} sm={6} key={s.title}>
            <Card
              style={{ borderRadius: 12, textAlign: 'center', borderTop: `3px solid ${s.color}` }}
              bodyStyle={{ padding: '20px 16px' }}
            >
              <div style={{ fontSize: 28, color: s.color, marginBottom: 8 }}>{s.icon}</div>
              <Statistic value={s.value} valueStyle={{ color: s.color, fontWeight: 700, fontSize: 28 }} />
              <Text type="secondary" style={{ fontSize: 13 }}>{s.title}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#1677ff' }} />
                <span>Hồ sơ gần đây</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/status')} icon={<ArrowRightOutlined />}>
                Xem tất cả
              </Button>
            }
            style={{ borderRadius: 12 }}
          >
            {userApps.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Bạn chưa nộp hồ sơ nào"
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/apply')}
                  style={{ background: '#003087' }}>
                  Nộp hồ sơ ngay
                </Button>
              </Empty>
            ) : (
              <List
                dataSource={userApps.slice(-4).reverse()}
                renderItem={(app) => {
                  const cfg = statusConfig[app.status];
                  return (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar style={{ background: '#003087' }} icon={<TrophyOutlined />} />
                        }
                        title={
                          <Space>
                            <Text strong>{app.universityName}</Text>
                            <Tag color={cfg.color}>{cfg.label}</Tag>
                          </Space>
                        }
                        description={
                          <Text type="secondary">
                            {app.majorName} • {app.subjectGroup} •{' '}
                            {dayjs(app.submittedAt).format('DD/MM/YYYY HH:mm')}
                          </Text>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <UserOutlined style={{ color: '#1677ff' }} />
                <span>Thông tin cá nhân</span>
              </Space>
            }
            style={{ borderRadius: 12, marginBottom: 16 }}
          >
            {[
              { label: 'Họ tên', value: user?.fullName },
              { label: 'Email', value: user?.email },
              { label: 'Điện thoại', value: user?.phone },
              { label: 'Ngày sinh', value: user?.dob ? dayjs(user.dob).format('DD/MM/YYYY') : '-' },
              { label: 'CCCD', value: user?.idCard },
            ].map((item) => (
              <Row key={item.label} style={{ marginBottom: 8 }}>
                <Col span={9}>
                  <Text type="secondary">{item.label}:</Text>
                </Col>
                <Col span={15}>
                  <Text strong>{item.value || '-'}</Text>
                </Col>
              </Row>
            ))}
          </Card>

          <Card
            title={
              <Space>
                <BellOutlined style={{ color: '#faad14' }} />
                <span>Hướng dẫn nộp hồ sơ</span>
              </Space>
            }
            style={{ borderRadius: 12 }}
          >
            <Timeline
              items={[
                { children: 'Chọn trường và ngành xét tuyển', color: 'blue' },
                { children: 'Nhập thông tin cá nhân và điểm thi', color: 'blue' },
                { children: 'Tải lên minh chứng (học bạ, CCCD)', color: 'blue' },
                { children: 'Gửi hồ sơ và chờ duyệt', color: 'blue' },
                { children: 'Nhận kết quả qua email & hệ thống', color: 'green' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;