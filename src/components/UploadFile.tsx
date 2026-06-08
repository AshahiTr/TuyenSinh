import React, { useState } from 'react';
import { Upload, Button, List, Tag, Typography, message, Space, Spin } from 'antd';
import {
  UploadOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { api } from '../services/api';

const { Text } = Typography;

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size?: number;
  fileId?: string; // ID từ MongoDB
}

interface Props {
  value?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  maxCount?: number;
  label?: string;
}

const UploadFile: React.FC<Props> = ({
  value = [],
  onChange,
  maxCount = 5,
  label = 'Tải lên tài liệu',
}) => {
  const [files, setFiles] = useState<UploadedFile[]>(value);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      message.error('Chỉ chấp nhận file PDF, JPG, PNG!');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('File không được vượt quá 5MB!');
      return false;
    }
    if (files.length >= maxCount) {
      message.error(`Chỉ được tải lên tối đa ${maxCount} file!`);
      return false;
    }

    setUploading(true);
    try {
      // Gọi API để upload lên MongoDB
      const result = await api.uploadFile(file);

      const newFile: UploadedFile = {
        name: result.name,
        url: result.url,
        type: result.type,
        fileId: result.id,
      };

      const updated = [...files, newFile];
      setFiles(updated);
      onChange?.(updated);
    } catch (error) {
      message.error('Lỗi khi upload file!');
      console.error(error);
    } finally {
      setUploading(false);
    }

    return false; // Ngăn Ant Design tự động upload
  };

  const handleRemove = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onChange?.(updated);
  };

  const handlePreview = (file: UploadedFile) => {
    window.open(file.url, '_blank');
  };

  return (
    <div>
      <Upload
        accept=".pdf,.jpg,.jpeg,.png"
        showUploadList={false}
        beforeUpload={handleUpload}
        multiple={false}
      >
        <Button
          icon={uploading ? <Spin size="small" /> : <UploadOutlined />}
          disabled={files.length >= maxCount || uploading}
        >
          {uploading ? 'Đang tải lên...' : `${label} (${files.length}/${maxCount})`}
        </Button>
      </Upload>
      <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
        File sẽ được lưu trữ trên MongoDB Atlas • Tối đa 5MB/file
      </Text>

      {files.length > 0 && (
        <List
          style={{ marginTop: 12 }}
          size="small"
          dataSource={files}
          renderItem={(file, index) => (
            <List.Item
              style={{
                background: '#fafafa',
                borderRadius: 6,
                marginBottom: 4,
                padding: '6px 12px',
                border: '1px solid #f0f0f0',
              }}
              actions={[
                <Button
                  key="preview"
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handlePreview(file)}
                >
                  Xem
                </Button>,
                <Button
                  key="remove"
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(index)}
                >
                  Xóa
                </Button>,
              ]}
            >
              <Space>
                {file.type === 'application/pdf' ? (
                  <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
                ) : (
                  <FileImageOutlined style={{ color: '#1677ff', fontSize: 18 }} />
                )}
                <div>
                  <Text style={{ fontSize: 13 }}>{file.name}</Text>
                </div>
                <Tag color={file.type === 'application/pdf' ? 'red' : 'blue'}>
                  {file.type === 'application/pdf' ? 'PDF' : 'Ảnh'}
                </Tag>
              </Space>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default UploadFile;