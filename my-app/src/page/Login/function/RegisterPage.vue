<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'

const open = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

function showModal() {
  open.value = true
}

function handleCancel() {
  open.value = false
  formRef.value?.resetFields()
}

function validateConfirmPassword(_rule: unknown, value: string) {
  const fields = formRef.value?.getFieldsValue()
  if (!value || fields?.password === value) {
    return Promise.resolve()
  }
  return Promise.reject(new Error('两次输入的密码不一致'))
}

async function handleOk() {
  try {
    const values = await formRef.value!.validate()
    submitting.value = true

    console.log('注册数据：', values)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    message.success('注册成功！')
    open.value = false
    formRef.value?.resetFields()
  } catch (error) {
    console.log('表单校验失败：', error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div style="padding: 24px">
    <a-button
      @click="showModal"
      class="px-6! py-3! rounded-full! outline-none! relative! overflow-hidden! border! border-sky-600! bg-sky-600! dark:border-sky-400! dark:bg-sky-500! cursor-pointer! transition! duration-300! hover:scale-105!"
    >
      <span class="relative! z-10! text-white!">注册</span>
    </a-button>

    <a-modal
      title="注册账号"
      :open="open"
      ok-text="注册"
      cancel-text="取消"
      :confirm-loading="submitting"
      @ok="handleOk"
      @cancel="handleCancel"
      @after-close="() => formRef?.resetFields()"
    >
      <a-form ref="formRef" layout="vertical" name="registerForm" autocomplete="off">
        <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input placeholder="请输入用户名" />
        </a-form-item>

        <a-form-item
          label="邮箱"
          name="email"
          :rules="[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '邮箱格式不正确' },
          ]"
        >
          <a-input placeholder="请输入邮箱" />
        </a-form-item>

        <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password placeholder="请输入密码" />
        </a-form-item>

        <a-form-item
          label="确认密码"
          name="confirmPassword"
          :rules="[
            { required: true, message: '请再次输入密码' },
            { validator: validateConfirmPassword, trigger: 'change' },
          ]"
        >
          <a-input-password placeholder="请再次输入密码" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>