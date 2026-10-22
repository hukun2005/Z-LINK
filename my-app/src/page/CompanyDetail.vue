<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import Header from '../shared/Header.vue'
import { getSupplierDetail } from '../api/suppliers'
import type { Supplier } from '../api/suppliers'

const route = useRoute()
const router = useRouter()
const company = ref<Supplier | null>(null)
const loading = ref(true)
const notFound = ref(false)

async function load() {
  loading.value = true
  try {
    const res: any = await getSupplierDetail(Number(route.params.id))
    company.value = res.data
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <Header />
  <main class="max-w-3xl mx-auto px-4 pt-32 pb-12">
    <!-- 返回 -->
    <button
      class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors"
      @click="router.back()"
    >
      <ArrowLeftOutlined />
      返回供应商列表
    </button>

    <!-- 加载中 -->
    <div v-if="loading" class="flex justify-center py-24">
      <a-spin tip="加载中..." />
    </div>

    <!-- 未找到 -->
    <a-result v-else-if="notFound" status="404" title="供应商不存在" sub-title="该供应商可能已下架或 id 无效" />

    <!-- 详情 -->
    <a-card v-else-if="company" :bordered="false" class="shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">{{ company.name }}</h1>
          <div class="flex flex-wrap gap-1.5 mt-3">
            <a-tag v-for="t in company.tags" :key="t" color="blue" class="m-0">{{ t }}</a-tag>
          </div>
        </div>
        <span class="text-xs text-gray-300 shrink-0">#{{ String(company.id).padStart(2, '0') }}</span>
      </div>

      <a-divider />

      <div class="space-y-5">
        <div>
          <div class="text-xs text-gray-400 mb-1.5">主营产品</div>
          <p class="text-sm text-gray-800 leading-relaxed">{{ company.product }}</p>
        </div>
        <div>
          <div class="text-xs text-gray-400 mb-1.5">企业简介</div>
          <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{{ company.describe }}</p>
        </div>
      </div>
    </a-card>
  </main>
</template>