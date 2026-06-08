import React, { useState } from 'react';
import {
  Form, Input, Button, Card, Typography, Result, Tag, Descriptions,
  Row, Col, Divider, Alert, Space, Steps,
} from 'antd';
import {
  SearchOutlined, FileTextOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ClockCircleOutlined, TrophyOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import type { Application, AppStatus } from '../store/applicationSlice';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const STATUS_CONFIG: Record<AppStatus, { color: string; label: string; icon: React.ReactNode; resultStatus: any; desc: string }> = {
  pending: {
    color: 'orange', label: 'Đang chờ xét duyệt',
    icon: <ClockCircleOutlined />, resultStatus: 'info',
    desc: 'Hồ sơ của bạn đang được xem xét. Vui lòng chờ thông báo.',
  },
  approved: {
    color: 'green', label: 'Trúng tuyển / Đã duyệt',
    icon: <CheckCircleOutlined />, resultStatus: 'success',
    desc: 'Chúc mừng! Hồ sơ của bạn đã được duyệt. Vui lòng hoàn tất thủ tục nhập học.',
  },
  rejected: {
    color: 'red', label: 'Không đạt / Từ chối',
    icon: <CloseCircleOutlined />, resultStatus: 'error',
    desc: 'Hồ sơ của bạn không đáp ứng yêu cầu. Vui lòng xem lý do và nộp lại nếu cần.',
  },
};

const ResultLookup: React.FC = () => {
  const [form] = Form.useForm();
  const [results, setResults] = useState<Application[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const applications = useSelector((s: RootState) => s.application.applications);
  const { user } = useSelector((s: RootState) => s.auth);

  const handleSearch = async (values: { idCard: string }) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const found = applications.filter((a) => a.idCard === values.idCard);
    setResults(found);
    setSearched(true);
    setLoading(false);
  };

  const handleQuickLookup = () => {
    if (user?.idCard) {
      form.setFieldsValue({ idCard: user.idCard });
      handleSearch({ idCard: user.idCard });
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <Title level={3} style={{ color: '#003087', textAlign: 'center' }}>
        <SearchOutlined /> Tra cứu Kết quả Tuyển sinh
      </Title>
      <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 32 }}>
        Nhập số CCCD/CMND để tra cứu kết quả xét tuyển
      </Paragraph>

      <Card style={{ borderRadius: 12, marginBottom: 24, maxWidth: 560, margin: '0 auto 24px' }}>
        <Form form={form} onFinish={handleSearch} layout="vertical" size="large">
          <Form.Item
            name="idCard"
            label="Số CCCD / CMND"
            rules={[
              { required: true, message: 'Vui lòng nhập số CCCD!' },
              { pattern: /^\d{9,12}$/, message: 'Số CCCD không hợp lệ!' },
            ]}
          >
            <Input
              prefix={<FileTextOutlined />}
              placeholder="Nhập số CCCD hoặc CMND..."
              maxLength={12}
            />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Button
              type="primary" htmlType="submit" loading={loading}
              icon={<SearchOutlined />}
              style={{ background: '#003087', flex: 1 }}
              block
            >
              Tra cứu
            </Button>
            {user?.idCard && (
              <Button onClick={handleQuickLookup} type="default">
                Dùng thông tin của tôi
              </Button>
            )}
          </Space>
        </Form>
      </Card>

      {searched && (
        <div>
          {results.length === 0 ? (
            <Result
              status="404"
              title="Không tìm thấy hồ sơ"
              subTitle="Không có hồ sơ nào với số CCCD này. Vui lòng kiểm tra lại."
            />
          ) : (
            <div>
              <Alert
                message={`Tìm thấy ${results.length} hồ sơ`}
                type="info" showIcon style={{ marginBottom: 16 }}
              />
              {results.map((app) => {
                const cfg = STATUS_CONFIG[app.status];
                const totalScore = app.scores.reduce((s, sc) => s + sc.score, 0);

                return (
                  <Card
                    key={app.id}
                    style={{
                      borderRadius: 12,
                      marginBottom: 16,
                      borderLeft: `4px solid ${cfg.color}`,
                    }}
                  >
                    <Row gutter={[16, 16]} align="middle">
                      <Col xs={24} md={16}>
                        <Space align="start" direction="vertical" size={4}>
                          <Space>
                            <TrophyOutlined style={{ color: '#003087', fontSize: 20 }} />
                            <Text strong style={{ fontSize: 16 }}>{app.universityName}</Text>
                          </Space>
                          <Text type="secondary">
                            Ngành: <Text strong>{app.majorName}</Text> • Tổ hợp:{' '}
                            <Tag color="blue">{app.subjectGroup}</Tag>
                          </Text>
                          <Text type="secondary">
                            Nộp ngày: {dayjs(app.submittedAt).format('DD/MM/YYYY HH:mm')}
                          </Text>
                        </Space>
                      </Col>
                      <Col xs={24} md={8} style={{ textAlign: 'center' }}>
                        <Tag
                          color={cfg.color}
                          style={{ fontSize: 14, padding: '6px 16px', borderRadius: 20 }}
                          icon={cfg.icon}
                        >
                          {cfg.label}
                        </Tag>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">Tổng điểm:</Text>{' '}
                          <Text strong style={{ fontSize: 20, color: '#003087' }}>
                            {totalScore.toFixed(2)}
                          </Text>
                        </div>
                      </Col>
                    </Row>

                    <Divider style={{ margin: '12px 0' }} />

                    <Row>
                      {app.scores.map((s) => (
                        <Col xs={8} key={s.subject} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: '#003087' }}>{s.score}</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>{s.subject}</Text>
                        </Col>
                      ))}
                    </Row>

                    <Divider style={{ margin: '12px 0' }} />

                    <Alert
                      message={cfg.label}
                      description={cfg.desc}
                      type={cfg.resultStatus === 'success' ? 'success' : cfg.resultStatus === 'error' ? 'error' : 'info'}
                      showIcon
                    />

                    {app.note && (
                      <Alert
                        message="Lý do từ ban tuyển sinh"
                        description={app.note}
                        type="warning"
                        showIcon
                        style={{ marginTop: 8 }}
                      />
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultLookup;