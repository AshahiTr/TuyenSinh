import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Tag } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  SearchOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { logout } from '../store/authSlice';

const { Header } = Layout;

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);
  const applications = useSelector((s: RootState) => s.application.applications);

  const userApplications = applications.filter((a) => a.userId === user?.id);
  const pendingCount = userApplications.filter((a) => a.status === 'pending').length;

  const menuItems = [
    { key: '/dashboard', icon: <HomeOutlined />, label: 'Trang chủ' },
    { key: '/apply', icon: <FileTextOutlined />, label: 'Nộp hồ sơ' },
    { key: '/status', icon: <BellOutlined />, label: 'Trạng thái hồ sơ' },
    { key: '/result', icon: <SearchOutlined />, label: 'Tra cứu kết quả' },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Thông tin cá nhân',
        onClick: () => navigate('/dashboard'),
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất',
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Header
      style={{
        background: '#003087',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        onClick={() => navigate('/dashboard')}
      >
        <div
          style={{
            width: 36, height: 36, background: '#faad14', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', color: '#003087', fontSize: 16,
          }}
        >
          TS
        </div>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: 0.5 }}>
          Tuyển Sinh Online
        </span>
      </div>

      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{
          background: 'transparent', borderBottom: 'none', color: '#fff',
          flex: 1, justifyContent: 'center',
        }}
        theme="dark"
      />

      <div>
        <Space>
          {pendingCount > 0 && (
            <Tag color="orange" style={{ cursor: 'pointer' }} onClick={() => navigate('/status')}>
              {pendingCount} hồ sơ chờ duyệt
            </Tag>
          )}
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer', color: '#fff' }}>
              <Avatar style={{ background: '#faad14', color: '#003087' }} icon={<UserOutlined />} />
              <span style={{ color: '#fff', fontWeight: 500 }}>{user?.fullName}</span>
            </Space>
          </Dropdown>
        </Space>
      </div>
    </Header>
  );
};

export default Navbar;