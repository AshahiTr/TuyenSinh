import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider, Layout } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { store } from './store/store';
import Navbar from './components/Navbar';
import AppRoutes from './routes';
import 'dayjs/locale/vi';
import dayjs from 'dayjs';

dayjs.locale('vi');

const { Content } = Layout;

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ConfigProvider
        locale={viVN}
        theme={{
          token: {
            colorPrimary: '#003087',
            borderRadius: 8,
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
          },
        }}
      >
        <BrowserRouter>
          <Layout style={{ minHeight: '100vh', background: '#f5f6fa' }}>
            <Navbar />
            <Content>
              <AppRoutes />
            </Content>
          </Layout>
        </BrowserRouter>
      </ConfigProvider>
    </Provider>
  );
};

export default App;