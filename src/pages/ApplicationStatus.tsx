import React, { useState } from 'react';
import {
  Table, Tag, Card, Typography, Button, Modal, Descriptions,
  Badge, Space, Select, Empty, Row, Col, Statistic, Tooltip,
  List, Avatar,
} from 'antd';
import {
  EyeOutlined, FileTextOutlined, ClockCircleOutlined,
  CheckCircleOutlined, CloseCircleOutlined, FilterOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setApplications, Application, AppStatus } from '../store/applicationSlice';
import { api } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const STATUS_CONFIG: Record<AppStatus, { color: string; label: string; badgeStatus: any }> = {
  pending: { color: 'orange', label: 'Chờ duyệt', badgeStatus: 'processing' },
  approved: { color: 'green', label: 'Đã duyệt', badgeStatus: 'success' },
  rejected: { color: 'red', label: 'Từ chối', badgeStatus: 'error' },
};

const ApplicationStatus: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);
  const applications = useSelector((s: RootState) => s.application.applications);
  const userApps = applications.filter((a) => a.userId === user?.id);

  const [loading, setLoading] = React.useState(false);
  const [filterStatus, setFilterStatus] = useState<AppStatus | 'all'>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  React.useEffect(() => {
    if (user?.id) {
      setLoading(true);
      api.getApplications(user.id)
        .then(apps => dispatch(setApplications(apps)))
        .finally(() => setLoading(false));
    }
  }, [user?.id, dispatch]);

  const filtered = filterStatus === 'all'
    ? userApps
    : userApps.filter((a) => a.status === filterStatus);

  const openDetail = (app: Application) => {
    setSelectedApp(app);
    setDetailVisible(true);
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_: any, __: any, i: number) => i + 1,
    },
    {
      title: 'Trường đại học',
      dataIndex: 'universityName',
      key: 'universityName',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'Ngành',
      dataIndex: 'majorName',
      key: 'majorName',
    },
    {
      title: 'Tổ hợp',
      dataIndex: 'subjectGroup',
      key: 'subjectGroup',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: AppStatus) => {
        const cfg = STATUS_CONFIG[status];
        return (
          <Badge status={cfg.badgeStatus} text={
            <Tag color={cfg.color} style={{ margin: 0 }}>{cfg.label}</Tag>
          } />
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: Application) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => openDetail(record)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <Title level={3} style={{ color: '#003087' }}>
        <FileTextOutlined /> Trạng thái hồ sơ
      </Title>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        {[
          { label: 'Tổng hồ sơ', value: userApps.length, color: '#1677ff', icon: <FileTextOutlined /> },
          { label: 'Chờ duyệt', value: userApps.filter((a) => a.status === 'pending').length, color: '#faad14', icon: <ClockCircleOutlined /> },
          { label: 'Đã duyệt', value: userApps.filter((a) => a.status === 'approved').length, color: '#52c41a', icon: <CheckCircleOutlined /> },
          { label: 'Từ chối', value: userApps.filter((a) => a.status === 'rejected').length, color: '#ff4d4f', icon: <CloseCircleOutlined /> },
        ].map((s) => (
          <Col xs={12} sm={6} key={s.label}>
            <Card size="small" style={{ borderRadius: 10, borderTop: `3px solid ${s.color}`, textAlign: 'center' }}>
              <Statistic
                title={s.label}
                value={s.value}
                valueStyle={{ color: s.color, fontWeight: 700 }}
                prefix={s.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ borderRadius: 12 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <FilterOutlined />
              <Text>Lọc theo trạng thái:</Text>
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: 160 }}
              >
                <Select.Option value="all">Tất cả</Select.Option>
                <Select.Option value="pending">Chờ duyệt</Select.Option>
                <Select.Option value="approved">Đã duyệt</Select.Option>
                <Select.Option value="rejected">Từ chối</Select.Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Text type="secondary">Tổng: {filtered.length} hồ sơ</Text>
          </Col>
        </Row>

        {userApps.length === 0 ? (
          <Empty description="Bạn chưa có hồ sơ nào" />
        ) : (
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey={(record) => record._id || record.id}
            loading={loading}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            scroll={{ x: 700 }}
            rowClassName={(r) =>
              r.status === 'approved' ? 'row-approved' :
              r.status === 'rejected' ? 'row-rejected' : ''
            }
          />
        )}
      </Card>

      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: '#003087' }} />
            <span>Chi tiết hồ sơ</span>
            {selectedApp && (
              <Tag color={STATUS_CONFIG[selectedApp.status].color}>
                {STATUS_CONFIG[selectedApp.status].label}
              </Tag>
            )}
          </Space>
        }
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>Đóng</Button>,
        ]}
        width={700}
      >
        {selectedApp && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Trường" span={2}>
                <Text strong>{selectedApp.universityName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngành">{selectedApp.majorName}</Descriptions.Item>
              <Descriptions.Item label="Tổ hợp">
                <Tag color="blue">{selectedApp.subjectGroup}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Họ và tên">{selectedApp.fullName}</Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {dayjs(selectedApp.dob).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="CCCD">{selectedApp.idCard}</Descriptions.Item>
              <Descriptions.Item label="Điện thoại">{selectedApp.phone}</Descriptions.Item>
              <Descriptions.Item label="Email" span={2}>{selectedApp.email}</Descriptions.Item>
              <Descriptions.Item label="Khu vực ưu tiên">{selectedApp.priorityGroup}</Descriptions.Item>
              <Descriptions.Item label="Đối tượng ưu tiên">{selectedApp.priorityArea}</Descriptions.Item>
              <Descriptions.Item label="Ngày nộp" span={2}>
                {dayjs(selectedApp.submittedAt).format('DD/MM/YYYY HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title="Điểm thi" style={{ marginBottom: 12, borderRadius: 8 }}>
              <Row>
                {selectedApp.scores.map((s) => (
                  <Col xs={8} key={s.subject} style={{ textAlign: 'center', padding: 12 }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#003087' }}>{s.score}</div>
                    <Text type="secondary">{s.subject}</Text>
                  </Col>
                ))}
                <Col xs={24} style={{ textAlign: 'center', paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                  <Text>Tổng điểm: </Text>
                  <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                    {selectedApp.scores.reduce((sum, s) => sum + s.score, 0).toFixed(2)}
                  </Text>
                </Col>
              </Row>
            </Card>

            {selectedApp.files.length > 0 && (
              <Card size="small" title={`Minh chứng (${selectedApp.files.length} file)`} style={{ borderRadius: 8 }}>
                <List
                  size="small"
                  dataSource={selectedApp.files}
                  renderItem={(file: any) => (
                    <List.Item
                      actions={[
                        <Button
                          key="view"
                          type="link"
                          size="small"
                          onClick={() => {
                            const win = window.open();
                            if (win) {
                              win.document.write(
                                file.type === 'application/pdf'
                                  ? `<iframe src="${file.url}" width="100%" height="100%" style="border:none"></iframe>`
                                  : `<img src="${file.url}" style="max-width:100%" />`
                              );
                            }
                          }}
                        >
                          Xem
                        </Button>,
                      ]}
                    >
                      <Text>{file.name}</Text>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {selectedApp.note && (
              <Card
                size="small"
                title="Ghi chú từ quản trị viên"
                style={{ marginTop: 12, borderRadius: 8, borderColor: '#ff4d4f' }}
              >
                <Text>{selectedApp.note}</Text>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApplicationStatus;