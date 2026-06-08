import React, { useState, useEffect } from 'react';
import {
  Form, Input, Select, Button, Card, Steps, Typography, Row, Col,
  InputNumber, Divider, message, Alert, DatePicker, Space, Tag,
} from 'antd';
import {
  BankOutlined, BookOutlined, UserOutlined,
  FileTextOutlined, SendOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { addApplication } from '../store/applicationSlice';
import UploadFile from '../components/UploadFile';
import { api, University, Major, SubjectGroup } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const PRIORITY_GROUPS = [
  { value: 'KV1', label: 'KV1 - Vùng đặc biệt khó khăn (+0.75)' },
  { value: 'KV2NT', label: 'KV2-NT - Nông thôn (+0.5)' },
  { value: 'KV2', label: 'KV2 - Ngoại thành (+0.25)' },
  { value: 'KV3', label: 'KV3 - Thành thị (Không ưu tiên)' },
];

const PRIORITY_AREAS = [
  { value: 'UT1', label: 'UT1 - Thương binh, con liệt sĩ (+2.0)' },
  { value: 'UT2', label: 'UT2 - Người dân tộc thiểu số (+1.0)' },
  { value: 'UT3', label: 'UT3 - Đối tượng chính sách khác (+0.5)' },
  { value: 'NONE', label: 'Không thuộc đối tượng ưu tiên' },
];

const STEPS = [
  { title: 'Chọn trường & ngành', icon: <BankOutlined /> },
  { title: 'Thông tin cá nhân', icon: <UserOutlined /> },
  { title: 'Điểm thi & ưu tiên', icon: <BookOutlined /> },
  { title: 'Upload minh chứng', icon: <FileTextOutlined /> },
  { title: 'Xác nhận & Gửi', icon: <SendOutlined /> },
];

const ApplicationForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);

  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [universities, setUniversities] = useState<University[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);
  const [selectedSubjectGroup, setSelectedSubjectGroup] = useState<SubjectGroup | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.getUniversities().then(setUniversities);
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        idCard: user.idCard,
        dob: user.dob ? dayjs(user.dob) : undefined,
      });
    }
  }, [user]);

  const handleUniversityChange = async (uniId: string) => {
    form.setFieldsValue({ majorId: undefined, subjectGroupId: undefined });
    setMajors([]);
    setSubjectGroups([]);
    setSelectedSubjectGroup(null);
    const m = await api.getMajorsByUniversity(uniId);
    setMajors(m);
  };

  const handleMajorChange = (majorId: string) => {
    form.setFieldsValue({ subjectGroupId: undefined });
    const major = majors.find((m) => m.id === majorId);
    setSubjectGroups(major ? major.subjectGroups : []);
    setSelectedSubjectGroup(null);
  };

  const handleSubjectGroupChange = (sgId: string) => {
    const sg = subjectGroups.find((s) => s.id === sgId);
    setSelectedSubjectGroup(sg || null);
    const scoreFields: any = {};
    sg?.subjects.forEach((sub) => { scoreFields[`score_${sub}`] = undefined; });
    form.setFieldsValue(scoreFields);
  };

  const nextStep = async () => {
    try {
      const fields = getFieldsForStep(current);
      const values = await form.validateFields(fields);
      setFormData((prev: any) => ({ ...prev, ...values }));
      setCurrent((c) => c + 1);
    } catch {}
  };

  const getFieldsForStep = (step: number): string[] => {
    if (step === 0) return ['universityId', 'majorId', 'subjectGroupId'];
    if (step === 1) return ['fullName', 'dob', 'idCard', 'phone', 'email', 'gender', 'address'];
    if (step === 2) {
      const scoreFields = selectedSubjectGroup?.subjects.map((s) => `score_${s}`) || [];
      return [...scoreFields, 'priorityGroup', 'priorityArea'];
    }
    return [];
  };

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      message.error('Vui lòng tải lên ít nhất 1 minh chứng!');
      return;
    }

    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1000)); 

      const allValues = { ...formData, ...form.getFieldsValue() };
      const university = universities.find((u) => u.id === allValues.universityId);
      const major = majors.find((m) => m.id === allValues.majorId);
      const sg = subjectGroups.find((s) => s.id === allValues.subjectGroupId);

      const scores = (sg?.subjects || []).map((sub) => ({
        subject: sub,
        score: allValues[`score_${sub}`] || 0,
      }));

      const application = {
        userId: user!.id,
        universityId: allValues.universityId,
        universityName: university?.name || '',
        majorId: allValues.majorId,
        majorName: major?.name || '',
        subjectGroup: sg?.code || '',
        fullName: allValues.fullName,
        dob: allValues.dob ? dayjs(allValues.dob).format('YYYY-MM-DD') : '',
        idCard: allValues.idCard,
        phone: allValues.phone,
        email: allValues.email,
        scores,
        priorityGroup: allValues.priorityGroup,
        priorityArea: allValues.priorityArea,
        files: uploadedFiles,
        status: 'pending' as const,
        submittedAt: new Date().toISOString(),
      };

      // Lưu vào MongoDB Atlas qua Backend
      const savedApp = await api.submitApplication(application);

      dispatch(addApplication(savedApp));
      setSubmitted(true);
      message.success('Nộp hồ sơ thành công! Hồ sơ đã được lưu trên MongoDB Atlas.');
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi gửi hồ sơ!');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', padding: 24, textAlign: 'center' }}>
        <Card style={{ borderRadius: 16 }}>
          <CheckCircleOutlined style={{ fontSize: 72, color: '#52c41a', marginBottom: 16 }} />
          <Title level={3} style={{ color: '#52c41a' }}>Nộp hồ sơ thành công!</Title>
          <Paragraph type="secondary">
            Hồ sơ của bạn đã được ghi nhận. Chúng tôi sẽ xem xét và thông báo kết quả qua email
            và hệ thống trong vòng 3-5 ngày làm việc.
          </Paragraph>
          <Space style={{ marginTop: 16 }}>
            <Button type="primary" onClick={() => navigate('/status')}
              style={{ background: '#003087' }}>
              Xem trạng thái hồ sơ
            </Button>
            <Button onClick={() => { setSubmitted(false); setCurrent(0); form.resetFields(); }}>
              Nộp hồ sơ khác
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  const uniOptions = universities.map((u) => ({ value: u.id, label: `${u.name} ` }));
  const majorOptions = majors.map((m) => ({ value: m.id, label: `${m.name} - Chỉ tiêu: ${m.quota}` }));
  const sgOptions = subjectGroups.map((sg) => ({
    value: sg.id,
    label: `${sg.code} (${sg.subjects.join(' - ')})`,
  }));

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
      <Title level={3} style={{ textAlign: 'center', color: '#003087', marginBottom: 24 }}>
        <FileTextOutlined /> Đăng ký Xét tuyển Đại học
      </Title>

      <Card style={{ borderRadius: 16, marginBottom: 24 }}>
        <Steps current={current} items={STEPS} style={{ marginBottom: 32 }} />

        <Form form={form} layout="vertical" size="large">
          {current === 0 && (
            <div>
              <Alert
                message="Lưu ý: Mỗi thí sinh chỉ được nộp 1 hồ sơ cho mỗi ngành của mỗi trường."
                type="info" showIcon style={{ marginBottom: 20 }}
              />
              <Form.Item name="universityId" label="Chọn trường đại học"
                rules={[{ required: true, message: 'Vui lòng chọn trường!' }]}>
                <Select
                  showSearch
                  placeholder="Tìm kiếm trường..."
                  options={uniOptions}
                  onChange={handleUniversityChange}
                  filterOption={(input, opt) =>
                    (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                />
              </Form.Item>

              <Form.Item name="majorId" label="Chọn ngành xét tuyển"
                rules={[{ required: true, message: 'Vui lòng chọn ngành!' }]}>
                <Select
                  placeholder="Chọn ngành..."
                  options={majorOptions}
                  disabled={majors.length === 0}
                  onChange={handleMajorChange}
                />
              </Form.Item>

              <Form.Item name="subjectGroupId" label="Tổ hợp xét tuyển"
                rules={[{ required: true, message: 'Vui lòng chọn tổ hợp!' }]}>
                <Select
                  placeholder="Chọn tổ hợp..."
                  options={sgOptions}
                  disabled={subjectGroups.length === 0}
                  onChange={handleSubjectGroupChange}
                />
              </Form.Item>

              {selectedSubjectGroup && (
                <Alert
                  message={
                    <span>
                      Tổ hợp <strong>{selectedSubjectGroup.code}</strong> gồm các môn:{' '}
                      {selectedSubjectGroup.subjects.map((s) => (
                        <Tag key={s} color="blue">{s}</Tag>
                      ))}
                    </span>
                  }
                  type="success" showIcon
                />
              )}
            </div>
          )}

          {current === 1 && (
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="fullName" label="Họ và tên"
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
                  <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="gender" label="Giới tính"
                  rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}>
                  <Select placeholder="Chọn giới tính">
                    <Option value="male">Nam</Option>
                    <Option value="female">Nữ</Option>
                    <Option value="other">Khác</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="dob" label="Ngày sinh"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày sinh!' }]}>
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="idCard" label="Số CCCD/CMND"
                  rules={[{ required: true, message: 'Vui lòng nhập CCCD!' }]}>
                  <Input placeholder="0012XXXXXXXX" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="phone" label="Số điện thoại"
                  rules={[{ required: true, message: 'Vui lòng nhập SĐT!' }]}>
                  <Input placeholder="09XXXXXXXX" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="email" label="Email"
                  rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}>
                  <Input placeholder="example@gmail.com" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="address" label="Địa chỉ thường trú"
                  rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}>
                  <Input.TextArea rows={2} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />
                </Form.Item>
              </Col>
            </Row>
          )}

          {current === 2 && (
            <div>
              <Title level={5}>Điểm thi THPTQG</Title>
              <Row gutter={16}>
                {selectedSubjectGroup?.subjects.map((subject) => (
                  <Col xs={24} sm={8} key={subject}>
                    <Form.Item
                      name={`score_${subject}`}
                      label={`Điểm ${subject}`}
                      rules={[
                        { required: true, message: `Nhập điểm ${subject}!` },
                        { type: 'number', min: 0, max: 10, message: 'Điểm từ 0 - 10!' },
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        placeholder="0 - 10"
                        step={0.25}
                        precision={2}
                      />
                    </Form.Item>
                  </Col>
                ))}
              </Row>

              <Divider />

              <Form.Item name="priorityGroup" label="Khu vực ưu tiên"
                rules={[{ required: true, message: 'Vui lòng chọn khu vực ưu tiên!' }]}>
                <Select placeholder="Chọn khu vực...">
                  {PRIORITY_GROUPS.map((p) => (
                    <Option key={p.value} value={p.value}>{p.label}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="priorityArea" label="Đối tượng ưu tiên"
                rules={[{ required: true, message: 'Vui lòng chọn đối tượng ưu tiên!' }]}>
                <Select placeholder="Chọn đối tượng...">
                  {PRIORITY_AREAS.map((p) => (
                    <Option key={p.value} value={p.value}>{p.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
          )}

          {current === 3 && (
            <div>
              <Alert
                message="Yêu cầu tài liệu"
                description="Vui lòng tải lên: Ảnh chụp học bạ THPT, ảnh chụp CCCD (2 mặt), và các giấy tờ ưu tiên (nếu có). Chấp nhận PDF, JPG, PNG. Tối đa 5MB/file."
                type="warning" showIcon style={{ marginBottom: 20 }}
              />
              <UploadFile
                value={uploadedFiles}
                onChange={setUploadedFiles}
                maxCount={6}
                label="Tải lên minh chứng"
              />
              {uploadedFiles.length === 0 && (
                <Text type="danger" style={{ fontSize: 13, display: 'block', marginTop: 8 }}>
                  * Bắt buộc phải tải lên ít nhất 1 minh chứng
                </Text>
              )}
            </div>
          )}

          {current === 4 && (
            <div>
              <Alert
                message="Kiểm tra lại thông tin trước khi gửi"
                type="info" showIcon style={{ marginBottom: 20 }}
              />
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Card size="small" title="Thông tin xét tuyển" style={{ borderRadius: 8 }}>
                    {[
                      { label: 'Trường', value: universities.find((u) => u.id === form.getFieldValue('universityId'))?.name },
                      { label: 'Ngành', value: majors.find((m) => m.id === form.getFieldValue('majorId'))?.name },
                      { label: 'Tổ hợp', value: selectedSubjectGroup?.code },
                    ].map((item) => (
                      <Row key={item.label} style={{ marginBottom: 6 }}>
                        <Col span={8}><Text type="secondary">{item.label}:</Text></Col>
                        <Col span={16}><Text strong>{item.value || '-'}</Text></Col>
                      </Row>
                    ))}
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card size="small" title="Thông tin thí sinh" style={{ borderRadius: 8 }}>
                    {[
                      { label: 'Họ tên', value: form.getFieldValue('fullName') },
                      { label: 'CCCD', value: form.getFieldValue('idCard') },
                      { label: 'Email', value: form.getFieldValue('email') },
                      { label: 'Điện thoại', value: form.getFieldValue('phone') },
                    ].map((item) => (
                      <Row key={item.label} style={{ marginBottom: 6 }}>
                        <Col span={9}><Text type="secondary">{item.label}:</Text></Col>
                        <Col span={15}><Text strong>{item.value || '-'}</Text></Col>
                      </Row>
                    ))}
                  </Card>
                </Col>
                <Col xs={24}>
                  <Card size="small" title="Điểm thi" style={{ borderRadius: 8 }}>
                    <Row>
                      {selectedSubjectGroup?.subjects.map((sub) => (
                        <Col xs={8} key={sub} style={{ textAlign: 'center', padding: 8 }}>
                          <div style={{ fontSize: 24, fontWeight: 700, color: '#003087' }}>
                            {form.getFieldValue(`score_${sub}`) || '-'}
                          </div>
                          <Text type="secondary">{sub}</Text>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Col>
                <Col xs={24}>
                  <Card size="small" title={`Minh chứng (${uploadedFiles.length} file)`} style={{ borderRadius: 8 }}>
                    {uploadedFiles.map((f, i) => (
                      <Tag key={i} style={{ margin: 4 }}>{f.name}</Tag>
                    ))}
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Form>

        <Divider />
        <Row justify="space-between">
          <Col>
            {current > 0 && (
              <Button size="large" onClick={() => setCurrent((c) => c - 1)}>
                Quay lại
              </Button>
            )}
          </Col>
          <Col>
            {current < STEPS.length - 1 ? (
              <Button type="primary" size="large" onClick={nextStep}
                style={{ background: '#003087' }}>
                Tiếp theo
              </Button>
            ) : (
              <Button
                type="primary" size="large" icon={<SendOutlined />}
                loading={submitting} onClick={handleSubmit}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                Gửi hồ sơ đăng ký
              </Button>
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ApplicationForm;