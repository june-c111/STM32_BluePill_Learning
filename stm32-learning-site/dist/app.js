const lessons = [
  {
    id: "overview", phase: "foundation", phaseLabel: "基础", title: "认识 STM32 与开发环境", tag: "MCU · 工程结构", duration: "35 分钟",
    desc: "理解 Cortex‑M3、片上外设、时钟总线与标准库工程。",
    summary: "先建立“内核—总线—外设—引脚”的全局地图，再开始写代码。你会知道一个库函数最终在控制什么。",
    goals: ["区分内核资源与片上外设", "认识 Flash、SRAM、NVIC、SysTick", "看懂标准库工程中的启动文件与用户代码"],
    steps: ["确认芯片型号与启动文件", "加入 CMSIS、标准库与 USER 文件", "配置头文件搜索路径", "选择下载器并验证最小工程"],
    pitfall: "启动文件必须与芯片容量型号匹配；工程能编译不代表下载配置正确，先用最小闪灯程序验证链路。",
    code: `#include "stm32f10x.h"\n\nint main(void)\n{\n    SystemInit();\n    while (1) {\n        /* 从最小可运行工程开始 */\n    }\n}`
  },
  {
    id: "gpio", phase: "foundation", phaseLabel: "基础", title: "GPIO 输入与输出", tag: "GPIO · RCC", duration: "50 分钟",
    desc: "从 LED 和按键入手，掌握时钟、模式、速度与读写函数。",
    summary: "GPIO 是大多数外设的入口。判断模式的关键不是背枚举，而是先问：信号由谁驱动、是否需要复用、是否需要上拉。",
    goals: ["理解推挽、开漏、上拉、下拉与浮空", "熟悉 GPIO_InitTypeDef", "会读取输入、写入输出并封装驱动"],
    steps: ["开启对应 GPIO 的 APB2 时钟", "定义并填写 GPIO_InitTypeDef", "调用 GPIO_Init", "用 SetBits / ResetBits / ReadInputDataBit 验证"],
    pitfall: "PA15、PB3、PB4 默认与调试接口有关。解除调试复用前先保留 SWD，否则可能暂时无法继续下载。",
    code: `RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);\nGPIO_InitTypeDef io;\nio.GPIO_Pin = GPIO_Pin_1;\nio.GPIO_Mode = GPIO_Mode_Out_PP;\nio.GPIO_Speed = GPIO_Speed_50MHz;\nGPIO_Init(GPIOA, &io);\nGPIO_SetBits(GPIOA, GPIO_Pin_1);`
  },
  {
    id: "exti", phase: "foundation", phaseLabel: "基础", title: "EXTI 与 NVIC 中断", tag: "EXTI · AFIO · NVIC", duration: "60 分钟",
    desc: "把按键轮询升级为边沿触发，理解中断线与优先级。",
    summary: "外部中断链路由 GPIO、AFIO、EXTI 和 NVIC 共同完成。沿着信号路径配置，比死记函数更可靠。",
    goals: ["理解 EXTI0–15 与 GPIO Pin 的映射", "会设置触发边沿和 NVIC 优先级", "正确判断并清除挂起位"],
    steps: ["开启 GPIO 与 AFIO 时钟", "把引脚配置为输入", "用 GPIO_EXTILineConfig 选择端口", "配置 EXTI 与 NVIC", "在中断函数中处理并清除标志"],
    pitfall: "同一编号的 Pin 共用一条 EXTI 线，例如 PA0 与 PB0 不能同时独立映射到 EXTI0。处理中断后必须清除挂起位。",
    code: `void EXTI0_IRQHandler(void)\n{\n    if (EXTI_GetITStatus(EXTI_Line0) == SET) {\n        /* 快速处理，耗时任务留给主循环 */\n        EXTI_ClearITPendingBit(EXTI_Line0);\n    }\n}`
  },
  {
    id: "timer", phase: "control", phaseLabel: "控制", title: "定时器与 PWM 输出", tag: "TIM · PWM", duration: "90 分钟",
    desc: "从固定周期中断到舵机 PWM，建立 PSC、ARR、CCR 的直觉。",
    summary: "定时器先对输入时钟分频，再由计数器与自动重装值决定周期；输出比较把计数值与 CCR 比较，从而生成 PWM。",
    goals: ["会计算 PSC 与 ARR", "区分基本、通用和高级定时器", "用输出比较生成频率与占空比可调的 PWM"],
    steps: ["开启 TIM 与相关 GPIO 时钟", "GPIO 配置为复用推挽", "配置时基 PSC、ARR", "配置输出比较模式与 CCR", "使能预装载并启动定时器"],
    pitfall: "公式中的 PSC 和 ARR 都要加 1。使用高级定时器输出 PWM 时，还需要开启主输出。",
    code: `TIM_TimeBaseInitTypeDef base;\nbase.TIM_Prescaler = 72 - 1;\nbase.TIM_Period = 20000 - 1;\nbase.TIM_CounterMode = TIM_CounterMode_Up;\nbase.TIM_ClockDivision = TIM_CKD_DIV1;\nTIM_TimeBaseInit(TIM2, &base);\nTIM_Cmd(TIM2, ENABLE);`
  },
  {
    id: "capture", phase: "control", phaseLabel: "控制", title: "输入捕获与编码器", tag: "IC · PWMI · ENCODER", duration: "80 分钟",
    desc: "测频率、占空比与正交编码器速度，串起定时器输入链路。",
    summary: "输入捕获把边沿到来时的 CNT 锁存进 CCR；编码器接口则让 A/B 相直接控制计数方向与计数时钟。",
    goals: ["用输入捕获测量周期", "用 PWMI 同时测频率和占空比", "用编码器模式得到位置与速度"],
    steps: ["配置通道 GPIO 为输入", "设置时基量程", "选择 TI 映射、极性与滤波", "配置主从触发或编码器接口", "定期读取 CCR / CNT"],
    pitfall: "PWMI 通常占用两个捕获通道；编码器模式使用 CH1 与 CH2。测速度时注意 CNT 溢出和有符号方向。",
    code: `TIM_EncoderInterfaceConfig(TIM3,\n    TIM_EncoderMode_TI12,\n    TIM_ICPolarity_Rising,\n    TIM_ICPolarity_Rising);\nTIM_SetCounter(TIM3, 0);\nTIM_Cmd(TIM3, ENABLE);`
  },
  {
    id: "adc", phase: "control", phaseLabel: "控制", title: "ADC 与 DMA 采样", tag: "ADC · DMA", duration: "95 分钟",
    desc: "把模拟电压变成稳定数据，并用 DMA 完成多通道搬运。",
    summary: "ADC 负责转换，DMA 负责搬运。单通道先学会触发、等待与读取，再用扫描模式和循环 DMA 扩展到多通道。",
    goals: ["理解 12 位量化、采样时间与校准", "区分规则组、注入组与扫描模式", "配置 ADC 扫描 + DMA 循环搬运"],
    steps: ["配置 ADCCLK 分频并开时钟", "GPIO 设置为模拟输入", "配置通道顺序与采样时间", "上电并执行 ADC 校准", "多通道时配置 DMA1 Channel1"],
    pitfall: "ADC 时钟不要超过芯片规定上限。DMA 的数据宽度应与 ADC_DR 匹配；改传输计数前先关闭 DMA。",
    code: `ADC_ResetCalibration(ADC1);\nwhile (ADC_GetResetCalibrationStatus(ADC1));\nADC_StartCalibration(ADC1);\nwhile (ADC_GetCalibrationStatus(ADC1));\nADC_DMACmd(ADC1, ENABLE);\nADC_SoftwareStartConvCmd(ADC1, ENABLE);`
  },
  {
    id: "usart", phase: "communication", phaseLabel: "通信", title: "USART 串口通信", tag: "USART · UART", duration: "70 分钟",
    desc: "完成调试打印、命令接收和中断式数据收发。",
    summary: "串口是最实用的调试入口。先跑通 8N1 发送，再增加接收中断；大量数据再考虑 DMA。",
    goals: ["理解波特率、数据位、校验位和停止位", "会配置 TX/RX 引脚与 USART", "掌握发送标志和接收中断"],
    steps: ["开启 GPIO 与 USART 时钟", "TX 配复用推挽，RX 配输入", "配置波特率与 8N1", "需要接收时开启 RXNE 中断与 NVIC", "使能 USART 并验证收发"],
    pitfall: "板间连接要 TX 对 RX，并共地。USART1 在 APB2，USART2/3 在 APB1，时钟来源不同会影响波特率。",
    code: `USART_SendData(USART1, data);\nwhile (USART_GetFlagStatus(USART1, USART_FLAG_TXE) == RESET);\n\nif (USART_GetITStatus(USART1, USART_IT_RXNE)) {\n    uint8_t rx = USART_ReceiveData(USART1);\n}`
  },
  {
    id: "i2c", phase: "communication", phaseLabel: "通信", title: "I²C 与传感器", tag: "I²C · OLED · MPU6050", duration: "95 分钟",
    desc: "理解起止条件、寻址与应答，完成寄存器读写。",
    summary: "I²C 用两根开漏总线连接多个器件。真正需要掌握的是时序状态：起始、地址、应答、数据、停止。",
    goals: ["理解 SCL、SDA、7 位地址与 ACK/NACK", "会写单字节寄存器读写函数", "能定位地址、上拉与时序问题"],
    steps: ["确认器件 7 位地址与上拉电阻", "GPIO 配复用开漏或软件开漏", "配置 I²C 时钟与应答", "按事件顺序发送 START、地址和数据", "等待状态并设置超时"],
    pitfall: "很多手册给的是 7 位地址，而库函数发送时会再加入读写位。不要把 8 位地址和 7 位地址混用。",
    code: `I2C_GenerateSTART(I2C1, ENABLE);\nwhile (!I2C_CheckEvent(I2C1, I2C_EVENT_MASTER_MODE_SELECT));\nI2C_Send7bitAddress(I2C1, devAddr, I2C_Direction_Transmitter);\nwhile (!I2C_CheckEvent(I2C1, I2C_EVENT_MASTER_TRANSMITTER_MODE_SELECTED));`
  },
  {
    id: "spi", phase: "communication", phaseLabel: "通信", title: "SPI 与外部存储", tag: "SPI · W25Q64", duration: "80 分钟",
    desc: "掌握四线同步通信、工作模式与片选管理。",
    summary: "SPI 没有统一设备地址，主机通过片选选择从机。CPOL、CPHA、位序和最大时钟必须与器件手册一致。",
    goals: ["理解 SCK、MOSI、MISO、NSS", "会选择 SPI 模式与数据位序", "实现全双工字节交换"],
    steps: ["开启 SPI 与 GPIO 时钟", "配置 SCK/MOSI 为复用推挽，MISO 为输入", "片选通常用普通推挽 GPIO", "配置主机、模式、分频与位序", "轮询 TXE/RXNE 完成交换"],
    pitfall: "先拉低片选，再完成整条命令，最后拉高。只发送不读取也要清理接收数据，否则可能溢出。",
    code: `while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_TXE) == RESET);\nSPI_I2S_SendData(SPI1, data);\nwhile (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_RXNE) == RESET);\nreturn SPI_I2S_ReceiveData(SPI1);`
  },
  {
    id: "project", phase: "communication", phaseLabel: "综合", title: "综合项目：舵机控制台", tag: "PWM · ADC · USART", duration: "半天",
    desc: "把输入、控制与通信串成完整数据流，形成工程化习惯。",
    summary: "用 ADC 采集旋钮位置，映射为舵机 PWM 脉宽，再通过串口输出角度。重点不只是跑通，而是分层组织驱动与应用。",
    goals: ["把多个外设组合成完整任务", "用非阻塞方式组织主循环", "建立初始化、驱动与应用分层"],
    steps: ["分别验证 ADC、PWM 与 USART", "定义统一的数据范围和单位", "加入滤波与限幅", "按固定周期更新控制量", "输出调试数据并检查边界"],
    pitfall: "不要在中断里做串口长发送或大段延时。先保证每个模块独立可测，再逐个接入主流程。",
    code: `while (1)\n{\n    uint16_t raw = ADC_Read();\n    uint16_t pulse = Map(raw, 0, 4095, 500, 2500);\n    Servo_SetPulse(pulse);\n    Debug_Print(raw, pulse);\n    Delay_ms(20);\n}`
  }
];

const phaseNames = { foundation: "基础打底", control: "定时与采样", communication: "通信与综合" };
const storageKey = "stm32-study-progress-v1";
const themeKey = "stm32-study-theme";
let completed = new Set(JSON.parse(localStorage.getItem(storageKey) || "[]"));
let activePhase = "all";
let currentLesson = 0;

const grid = document.querySelector("#courseGrid");
const nav = document.querySelector("#courseNav");
const searchInput = document.querySelector("#searchInput");
const dialog = document.querySelector("#lessonDialog");

function renderNav() {
  nav.innerHTML = Object.entries(phaseNames).map(([phase, label]) => {
    const items = lessons.filter(x => x.phase === phase).map((lesson, i) => {
      const globalIndex = lessons.indexOf(lesson);
      return `<button class="nav-item ${completed.has(lesson.id) ? "done" : ""}" data-open="${lesson.id}" type="button"><span class="num">${String(globalIndex + 1).padStart(2, "0")}</span><span>${lesson.title}</span><i class="check" aria-hidden="true"></i></button>`;
    }).join("");
    return `<div class="nav-phase">${label}</div>${items}`;
  }).join("");
}

function renderCards() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = lessons.filter(x => (activePhase === "all" || x.phase === activePhase) && [x.title, x.tag, x.desc, x.summary, ...x.goals].join(" ").toLowerCase().includes(query));
  grid.innerHTML = filtered.map(lesson => {
    const i = lessons.indexOf(lesson);
    return `<article class="course-card" data-phase="${lesson.phase}">
      <input class="course-check" data-check="${lesson.id}" type="checkbox" ${completed.has(lesson.id) ? "checked" : ""} aria-label="标记《${lesson.title}》为完成">
      <div class="course-number">${String(i + 1).padStart(2, "0")}</div>
      <div class="course-info"><small>${lesson.tag} · ${lesson.duration}</small><h3>${lesson.title}</h3><p>${lesson.desc}</p></div>
      <button class="course-open" type="button" data-open="${lesson.id}" aria-label="打开《${lesson.title}》">→</button>
    </article>`;
  }).join("");
  document.querySelector("#emptyState").hidden = filtered.length > 0;
  return filtered;
}

function updateProgress() {
  const count = completed.size;
  document.querySelector("#progressText").textContent = `${count} / ${lessons.length}`;
  document.querySelector("#progressBar").style.width = `${count / lessons.length * 100}%`;
  localStorage.setItem(storageKey, JSON.stringify([...completed]));
  renderNav();
}

function setComplete(id, value) {
  value ? completed.add(id) : completed.delete(id);
  updateProgress(); renderCards();
  if (dialog.open && lessons[currentLesson].id === id) document.querySelector("#dialogDone").checked = value;
}

function openLesson(id) {
  const index = lessons.findIndex(x => x.id === id);
  if (index < 0) return;
  currentLesson = index;
  const lesson = lessons[index];
  localStorage.setItem("stm32-last-lesson", lesson.id);
  document.querySelector("#dialogChapter").textContent = `CHAPTER ${String(index + 1).padStart(2, "0")}`;
  document.querySelector("#lessonKicker").textContent = `${lesson.phaseLabel} · ${lesson.tag} · ${lesson.duration}`;
  document.querySelector("#lessonTitle").textContent = lesson.title;
  document.querySelector("#lessonSummary").textContent = lesson.summary;
  document.querySelector("#lessonGoals").innerHTML = lesson.goals.map(x => `<li>${x}</li>`).join("");
  document.querySelector("#lessonSteps").innerHTML = lesson.steps.map(x => `<li>${x}</li>`).join("");
  document.querySelector("#lessonPitfall").textContent = lesson.pitfall;
  document.querySelector("#lessonCode").textContent = lesson.code;
  document.querySelector("#dialogDone").checked = completed.has(lesson.id);
  document.querySelector("#prevLesson").disabled = index === 0;
  document.querySelector("#nextLesson").disabled = index === lessons.length - 1;
  dialog.showModal();
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message; toast.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

document.addEventListener("click", event => {
  const opener = event.target.closest("[data-open]");
  if (opener) openLesson(opener.dataset.open);
});
document.addEventListener("change", event => {
  if (event.target.matches("[data-check]")) setComplete(event.target.dataset.check, event.target.checked);
});
document.querySelectorAll("[data-phase]").forEach(button => button.addEventListener("click", () => {
  activePhase = button.dataset.phase;
  document.querySelectorAll(".phase-tabs button").forEach(x => { x.classList.toggle("active", x === button); x.setAttribute("aria-selected", x === button); });
  renderCards();
}));
searchInput.addEventListener("input", renderCards);
searchInput.addEventListener("keydown", event => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const matches = renderCards();
  if (matches.length) openLesson(matches[0].id);
  else showToast("没有匹配的章节");
});
document.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); searchInput.focus(); } });
document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
document.querySelector("#dialogDone").addEventListener("change", e => setComplete(lessons[currentLesson].id, e.target.checked));
document.querySelector("#prevLesson").addEventListener("click", () => openLesson(lessons[currentLesson - 1].id));
document.querySelector("#nextLesson").addEventListener("click", () => openLesson(lessons[currentLesson + 1].id));
document.querySelector("#copyCode").addEventListener("click", async () => { await navigator.clipboard.writeText(lessons[currentLesson].code); showToast("代码已复制"); });
document.querySelector("#resumeButton").addEventListener("click", () => openLesson(localStorage.getItem("stm32-last-lesson") || lessons[0].id));
document.querySelector("#resetProgress").addEventListener("click", () => { completed.clear(); updateProgress(); renderCards(); showToast("学习进度已重置"); });

const preferredTheme = localStorage.getItem(themeKey) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
document.body.classList.toggle("dark", preferredTheme === "dark");
document.querySelector("#themeToggle").addEventListener("click", () => { document.body.classList.toggle("dark"); localStorage.setItem(themeKey, document.body.classList.contains("dark") ? "dark" : "light"); });

renderNav(); renderCards(); updateProgress();
