<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import dayjs from 'dayjs'
import Header from '../shared/Header.vue'
import { publishRequirement, getRequirements } from '../api/requirements'
import type { Requirement } from '../api/requirements'

const CATEGORIES = [
  '精密机加工',
  '模具',
  '钣金冲压',
  '铸造',
  '注塑成型',
  '电子组装',
  '液压气动',
  '轴承紧固件',
  '包装材料',
  '表面处理',
  '热处理',
  '焊接结构件',
  '电线电缆',
  '其他',
]

const QUALIFICATION_OPTIONS = [
  'ISO9001',
  'IATF16949',
  'ISO14001',
  '压力容器资质',
  '三废处理资质',
  'CNAS实验室',
  '出口资质',
]

const formRef = ref<FormInstance>()
const loading = ref(false)
const listLoading = ref(true)
const requirements = ref<Requirement[]>([])

const formState = reactive({
  title: '',
  category: undefined as string | undefined,
  deadline: undefined as any,
  description: '',
  quantity: undefined as number | undefined,
  unit: undefined as string | undefined,
  budget: undefined as number | undefined,
  qualifications: [] as string[],
  contact: '',
  phone: '',
})

async function loadList() {
  listLoading.value = true
  try {
    const res: any = await getRequirements()
    requirements.value = res.data
  } catch {
    message.error('需求列表加载失败，请确认后端已启动')
  } finally {
    listLoading.value = false
  }
}

onMounted(loadList)

async function handlePublish() {
  const values = await formRef.value!.validate().catch(() => null)
  if (!values) return
  loading.value = true
  try {
    const payload = {
      ...values,
      deadline: values.deadline ? dayjs(values.deadline).format('YYYY-MM-DD') : undefined,
      qualifications: values.qualifications || [],
    }
    await publishRequirement(payload as any)
    message.success('需求发布成功，系统将为你匹配供应商')
    formRef.value!.resetFields()
    loadList()
  } catch {
    message.error('发布失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Header />
  <main class="max-w-6xl mx-auto px-4 pt-32 pb-12">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">发布采购需求</h1>
      <p class="text-sm text-gray-500 mt-1">详细描述你的需求，AI 将从认证供应商中为你精准匹配</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <!-- 左侧：发布表单 -->
      <a-card class="lg:col-span-3 shadow-sm" :bordered="false">
        <a-form ref="formRef" :model="formState" layout="vertical">
          <a-form-item name="title" label="需求标题" :rules="[{ required: true, message: '请输入需求标题' }]">
            <a-input v-model:value="formState.title" placeholder="例：采购一批精密轴类零件，需 IATF16949 认证" :maxlength="50" show-count />
          </a-form-item>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <a-form-item name="category" label="采购品类" :rules="[{ required: true, message: '请选择采购品类' }]">
              <a-select v-model:value="formState.category" placeholder="请选择品类" :options="CATEGORIES.map((c) => ({ label: c, value: c }))" />
            </a-form-item>

            <a-form-item name="deadline" label="期望交货日期">
              <a-date-picker v-model:value="formState.deadline" class="w-full" placeholder="选择交期" />
            </a-form-item>
          </div>

          <a-form-item
            name="description"
            label="需求描述"
            :rules="[
              { required: true, message: '请描述具体需求' },
              { min: 10, message: '请至少填写 10 个字，方便供应商了解需求' },
            ]"
          >
            <a-textarea
              v-model:value="formState.description"
              :rows="4"
              placeholder="请描述产品规格、材质、用途、工艺要求、包装运输等信息..."
              :maxlength="500"
              show-count
            />
          </a-form-item>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
            <a-form-item name="quantity" label="采购数量">
              <a-input-number v-model:value="formState.quantity" class="w-full" :min="1" placeholder="数量" :controls="false" />
            </a-form-item>
            <a-form-item name="unit" label="单位">
              <a-select v-model:value="formState.unit" placeholder="单位" allow-clear :options="['件', '套', '台', '吨', '批', '箱', '米'].map((u) => ({ label: u, value: u }))" />
            </a-form-item>
            <a-form-item name="budget" label="预算（元）">
              <a-input-number v-model:value="formState.budget" class="w-full" :min="0" placeholder="总预算" :controls="false" />
            </a-form-item>
          </div>

          <a-form-item name="qualifications" label="供应商资质要求">
            <a-select v-model:value="formState.qualifications" mode="multiple" placeholder="选择供应商需要具备的资质（可多选，可留空）" :options="QUALIFICATION_OPTIONS.map((q) => ({ label: q, value: q }))" />
          </a-form-item>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <a-form-item name="contact" label="联系人" :rules="[{ required: true, message: '请输入联系人' }]">
              <a-input v-model:value="formState.contact" placeholder="联系人姓名" />
            </a-form-item>
            <a-form-item
              name="phone"
              label="联系电话"
              :rules="[
                { required: true, message: '请输入联系电话' },
                { pattern: /^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/, message: '请输入正确的电话格式' },
              ]"
            >
              <a-input v-model:value="formState.phone" placeholder="手机号码" :maxlength="11" />
            </a-form-item>
          </div>

          <a-form-item class="mb-0">
            <div class="flex gap-3 justify-end">
              <a-button @click="formRef?.resetFields()">重置</a-button>
              <a-button type="primary" :loading="loading" @click="handlePublish">发布需求</a-button>
            </div>
          </a-form-item>
        </a-form>
      </a-card>

      <!-- 右侧：已发布需求 -->
      <div class="lg:col-span-2">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold text-gray-900">我的需求</h2>
          <span class="text-xs text-gray-400">共 {{ requirements.length }} 条</span>
        </div>
        <div class="space-y-3">
          <div v-if="listLoading" class="flex justify-center py-16">
            <a-spin tip="加载中..." />
          </div>
          <a-card v-else-if="requirements.length === 0" :bordered="false" class="shadow-sm">
            <a-empty description="还没有发布过需求" />
          </a-card>
          <div v-for="item in requirements" :key="item.id" class="border border-gray-100 rounded-xl p-4 bg-white hover:shadow-md hover:border-blue-200 transition-all">
            <div class="flex justify-between items-start gap-2">
              <h3 class="font-semibold text-gray-900 text-sm">{{ item.title }}</h3>
              <a-tag color="blue" class="shrink-0">{{ item.status }}</a-tag>
            </div>
            <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <span>品类：{{ item.category }}</span>
              <span v-if="item.quantity != null">数量：{{ item.quantity }}{{ item.unit || '' }}</span>
              <span v-if="item.budget != null">预算：¥{{ item.budget }}</span>
              <span v-if="item.deadline">期望交期：{{ item.deadline }}</span>
            </div>
            <p class="text-xs text-gray-700 mt-2 line-clamp-2">{{ item.description }}</p>
            <div v-if="item.qualifications.length > 0" class="flex flex-wrap gap-1 mt-2">
              <a-tag v-for="q in item.qualifications" :key="q" color="geekblue" class="text-[10px] m-0">{{ q }}</a-tag>
            </div>
            <div class="mt-2 pt-2 border-t border-gray-50 flex justify-between text-[11px] text-gray-400">
              <span>发布人：{{ item.publisher }}</span>
              <span>{{ item.created_at }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>