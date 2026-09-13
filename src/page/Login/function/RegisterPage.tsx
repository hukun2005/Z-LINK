import { useState } from 'react';
import { Button, Modal, Form, Input, message } from 'antd';

export default function RegisterPage() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // 点击“注册”按钮，打开弹窗
  const showModal = () => {
    setOpen(true);
  };

  // 取消关闭弹窗
  const handleCancel = () => {
    setOpen(false);
    form.resetFields();
  };

  // 点击弹窗内的“注册”按钮
  const handleOk = async () => {
    try {
      // 触发表单校验
      const values = await form.validateFields();
      setSubmitting(true);

      // 这里调用你的注册接口，例如：
      // await api.register(values);
      console.log('注册数据：', values);

      // 模拟请求
      await new Promise((resolve) => setTimeout(resolve, 1000));

      message.success('注册成功！');
      setOpen(false);
      form.resetFields();
    } catch (error) {
      console.log('表单校验失败：', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Button  onClick={showModal} className="px-6! py-3! rounded-full! outline-none! relative! overflow-hidden! 
              border! border-sky-600! bg-sky-600! dark:border-sky-400! dark:bg-sky-500!
              cursor-pointer! transition! duration-300! hover:scale-105!">
        <span className="relative! z-10! text-white!"> 注册</span>
      </Button>

      <Modal
        title="注册账号"
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="注册"
        cancelText="取消"
        confirmLoading={submitting}
        afterClose={() => form.resetFields()}
      >
        <Form
          form={form}
          layout="vertical"
          name="registerForm"
          autoComplete="off"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
