import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import ECharts from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GaugeChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'

import App from './App.vue'
import './style.css'

use([
  CanvasRenderer,
  GaugeChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
])

const app = createApp(App)
app.use(ElementPlus, { locale: zhCn })
app.component('VChart', ECharts)
app.mount('#app')
