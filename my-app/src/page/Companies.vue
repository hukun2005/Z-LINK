<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { SearchOutlined } from '@ant-design/icons-vue'
import Header from '../shared/Header.vue'
import { getSuppliers } from '../api/suppliers'
import type { Supplier } from '../api/suppliers'

const router = useRouter()
const suppliers = ref<Supplier[]>([])
const loading = ref(true)
const keyword = ref('')
const activeTags = ref<string[]>([])

async function loadSuppliers() {
  loading.value = true
  try {
    const res: any = await getSuppliers()
    suppliers.value = res.data
  } catch {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

onMounted(loadSuppliers)

// 收集所有标签（去重 + 按出现频率排序）
const allTags = computed(() => {
  const freq: Record<string, number> = {}
  suppliers.value.forEach((s) => {
    s.tags.forEach((t) => {
      freq[t] = (freq[t] || 0) + 1
    })
  })
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map((e) => e[0])
})

// 过滤后的供应商
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return suppliers.value.filter((s) => {
    const matchKw =
      !kw ||
      s.name.toLowerCase().includes(kw) ||
      s.product.toLowerCase().includes(kw) ||
      s.describe.toLowerCase().includes(kw) ||
      s.tags.some((t) => t.toLowerCase().includes(kw))
    const matchTag =
      activeTags.value.length === 0 || activeTags.value.every((t) => s.tags.includes(t))
    return matchKw && matchTag
  })
})

function toggleTag(tag: string) {
  activeTags.value = activeTags.value.includes(tag)
    ? activeTags.value.filter((t) => t !== tag)
    : [...activeTags.value, tag]
}

function goDetail(id: number) {
  router.push('/companies/' + id)
}
</script>

<template>
  <Header />
  <main class="max-w-6xl mx-auto px-4 pt-32 pb-12">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">供应商列表</h1>
      <p class="text-sm text-gray-500 mt-1">共 {{ suppliers.length }} 家认证供应商，支持按名称、产品、标签搜索</p>
    </div>

    <!-- 搜索栏 -->
    <div class="mb-4">
      <a-input
        size="large"
        allow-clear
        v-model:value="keyword"
        placeholder="搜索供应商名称、产品、描述或标签..."
      >
        <template #prefix><SearchOutlined class="text-gray-400" /></template>
      </a-input>
    </div>

    <!-- 标签筛选 -->
    <div v-if="allTags.length > 0" class="flex flex-wrap gap-2 mb-6">
      <a-tag
        v-for="tag in allTags.slice(0, 20)"
        :key="tag"
        :color="activeTags.includes(tag) ? 'blue' : 'default'"
        class="cursor-pointer text-sm px-2 py-0.5"
        @click="toggleTag(tag)"
      >
        {{ tag }}
      </a-tag>
      <a-tag v-if="activeTags.length > 0" class="cursor-pointer text-sm px-2 py-0.5" @click="activeTags = []">
        清除筛选
      </a-tag>
    </div>

    <!-- 结果计数 -->
    <div class="text-xs text-gray-400 mb-3">
      {{ filtered.length === suppliers.length ? `显示全部 ${filtered.length} 家` : `筛选结果：${filtered.length} / ${suppliers.length} 家` }}
    </div>

    <!-- 供应商卡片 -->
    <div v-if="loading" class="flex justify-center py-20">
      <a-spin tip="加载中..." />
    </div>
    <a-card v-else-if="filtered.length === 0" :bordered="false" class="shadow-sm">
      <a-empty description="没有匹配的供应商" />
    </a-card>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="s in filtered"
        :key="s.id"
        class="border border-gray-100 rounded-xl p-5 bg-white hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer"
        @click="goDetail(s.id)"
      >
        <div class="flex items-start justify-between gap-2">
          <h3 class="font-semibold text-gray-900">{{ s.name }}</h3>
          <span class="text-xs text-gray-300 shrink-0">#{{ String(s.id).padStart(2, '0') }}</span>
        </div>
        <p class="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-3">{{ s.describe }}</p>
        <div class="mt-3 pt-3 border-t border-gray-50">
          <div class="text-xs text-gray-400 mb-1">主营产品</div>
          <p class="text-sm text-gray-700">{{ s.product }}</p>
        </div>
        <div class="flex flex-wrap gap-1 mt-3">
          <a-tag
            v-for="t in s.tags"
            :key="t"
            :color="activeTags.includes(t) ? 'blue' : 'default'"
            class="text-[10px] m-0 cursor-pointer"
            @click.stop="toggleTag(t)"
          >
            {{ t }}
          </a-tag>
        </div>
      </div>
    </div>
  </main>
</template>