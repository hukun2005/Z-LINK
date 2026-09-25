import { useCallback, useEffect, useState } from "react"
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Card,
  Tag,
  Empty,
  Spin,
  message,
} from "antd"
import Header from "../shared/Header"
import {
  publishRequirement,
  getRequirements,
} from "../api/requirements"
import type { Requirement } from "../api/requirements"
import dayjs from "dayjs"

const { TextArea } = Input

const CATEGORIES = [
  "精密机加工",
  "模具",
  "钣金冲压",
  "铸造",
  "注塑成型",
  "电子组装",
  "液压气动",
  "轴承紧固件",
  "包装材料",
  "表面处理",
  "热处理",
  "焊接结构件",
  "电线电缆",
  "其他",
]

const QUALIFICATION_OPTIONS = [
  "ISO9001",
  "IATF16949",
  "ISO14001",
  "压力容器资质",
  "三废处理资质",
  "CNAS实验室",
  "出口资质",
]

function RequirementCard({ item }: { item: Requirement }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-white hover:shadow-md hover:border-blue-200 transition-all">
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
        <Tag color="blue" className="shrink-0">{item.status}</Tag>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
        <span>品类：{item.category}</span>
        {item.quantity != null && (
          <span>数量：{item.quantity}{item.unit || ""}</span>
        )}
        {item.budget != null && <span>预算：¥{item.budget}</span>}
        {item.deadline && <span>期望交期：{item.deadline}</span>}
      </div>
      <p className="text-xs text-gray-700 mt-2 line-clamp-2">{item.description}</p>
      {item.qualifications.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.qualifications.map((q) => (
            <Tag key={q} color="geekblue" className="text-[10px] m-0">{q}</Tag>
          ))}
        </div>
      )}
      <div className="mt-2 pt-2 border-t border-gray-50 flex justify-between text-[11px] text-gray-400">
        <span>发布人：{item.publisher}</span>
        <span>{item.created_at}</span>
      </div>
    </div>
  )
}

const Publish = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const [requirements, setRequirements] = useState<Requirement[]>([])

  const loadList = useCallback(async () => {
    setListLoading(true)
    try {
      const res: any = await getRequirements()
      setRequirements(res.data)
    } catch {
      message.error("需求列表加载失败，请确认后端已启动")
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  const handlePublish = () => {
    form.validateFields().then(async (values) => {
      setLoading(true)
      try {
        const payload = {
          ...values,
          deadline: values.deadline
            ? dayjs(values.deadline).format("YYYY-MM-DD")
            : undefined,
          qualifications: values.qualifications || [],
        }
        await publishRequirement(payload)
        message.success("需求发布成功，系统将为你匹配供应商")
        form.resetFields()
        loadList()
      } catch {
        message.error("发布失败，请稍后重试")
      } finally {
        setLoading(false)
      }
    })
  }

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 pt-32 pb-12">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">发布采购需求</h1>
          <p className="text-sm text-gray-500 mt-1">
            详细描述你的需求，AI 将从认证供应商中为你精准匹配
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 左侧：发布表单 */}
          <Card className="lg:col-span-3 shadow-sm" bordered={false}>
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                category: undefined,
                qualifications: [],
                quantity: undefined,
                budget: undefined,
              }}
            >
              <Form.Item
                name="title"
                label="需求标题"
                rules={[{ required: true, message: "请输入需求标题" }]}
              >
                <Input placeholder="例：采购一批精密轴类零件，需 IATF16949 认证" maxLength={50} showCount />
              </Form.Item>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Form.Item
                  name="category"
                  label="采购品类"
                  rules={[{ required: true, message: "请选择采购品类" }]}
                >
                  <Select
                    placeholder="请选择品类"
                    options={CATEGORIES.map((c) => ({ label: c, value: c }))}
                  />
                </Form.Item>

                <Form.Item name="deadline" label="期望交货日期">
                  <DatePicker className="w-full" placeholder="选择交期" />
                </Form.Item>
              </div>

              <Form.Item
                name="description"
                label="需求描述"
                rules={[
                  { required: true, message: "请描述具体需求" },
                  { min: 10, message: "请至少填写 10 个字，方便供应商了解需求" },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="请描述产品规格、材质、用途、工艺要求、包装运输等信息..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
                <Form.Item name="quantity" label="采购数量">
                  <InputNumber className="w-full" min={1} placeholder="数量" controls={false} />
                </Form.Item>
                <Form.Item name="unit" label="单位">
                  <Select
                    placeholder="单位"
                    allowClear
                    options={["件", "套", "台", "吨", "批", "箱", "米"].map((u) => {
                      return { label: u, value: u }
                    })}
                  />
                </Form.Item>
                <Form.Item name="budget" label="预算（元）">
                  <InputNumber
                    className="w-full"
                    min={0}
                    placeholder="总预算"
                    controls={false}
                    prefix="¥"
                  />
                </Form.Item>
              </div>

              <Form.Item name="qualifications" label="供应商资质要求">
                <Select
                  mode="multiple"
                  placeholder="选择供应商需要具备的资质（可多选，可留空）"
                  options={QUALIFICATION_OPTIONS.map((q) => ({ label: q, value: q }))}
                />
              </Form.Item>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Form.Item
                  name="contact"
                  label="联系人"
                  rules={[{ required: true, message: "请输入联系人" }]}
                >
                  <Input placeholder="联系人姓名" />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label="联系电话"
                  rules={[
                    { required: true, message: "请输入联系电话" },
                    { pattern: /^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/, message: "请输入正确的电话格式" },
                  ]}
                >
                  <Input placeholder="手机号码" maxLength={11} />
                </Form.Item>
              </div>

              <Form.Item className="mb-0">
                <div className="flex gap-3 justify-end">
                  <Button onClick={() => form.resetFields()}>重置</Button>
                  <Button type="primary" loading={loading} onClick={handlePublish}>
                    发布需求
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </Card>

          {/* 右侧：已发布需求 */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">我的需求</h2>
              <span className="text-xs text-gray-400">共 {requirements.length} 条</span>
            </div>
            <div className="space-y-3">
              {listLoading ? (
                <div className="flex justify-center py-16">
                  <Spin tip="加载中..." />
                </div>
              ) : requirements.length === 0 ? (
                <Card bordered={false} className="shadow-sm">
                  <Empty description="还没有发布过需求" />
                </Card>
              ) : (
                requirements.map((item) => (
                  <RequirementCard key={item.id} item={item} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
export default Publish
