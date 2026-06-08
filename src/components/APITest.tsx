// src/components/APITest.tsx
import React, { useState } from 'react';
import { Button, Card, message, Space, Tag } from 'antd';
import { api } from '../services/api';

const APITest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const testHealth = async () => {
    setLoading(true);
    try {
      const result = await api.healthCheck();
      setStatus(result);
      message.success('Kết nối API thành công!');
    } catch (error: any) {
      message.error('Lỗi kết nối: ' + error.message);
      setStatus({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="API Connection Test">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button 
          type="primary" 
          onClick={testHealth} 
          loading={loading}
        >
          Test API Connection
        </Button>
        
        {status && (
          <div style={{ marginTop: 16 }}>
            <Tag color={status.database === 'Connected' ? 'green' : 'red'}>
              Database: {status.database || 'Unknown'}
            </Tag>
            <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
              {JSON.stringify(status, null, 2)}
            </pre>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default APITest;