---
agent: agent
---
Define the task to achieve, including specific requirements, constraints, and success criteria.

For implementing a specific algorithm:

Implement a [name of algorithm] in [programming language]. Please include:
1. The main function with clear parameter and return types
2. Helper functions if necessary
3. Time and space complexity analysis
4. Example usage
For creating a class or module:

Create a [class/module] for [specific functionality] in [programming language].
Include:
1. Constructor/initialization
2. Main methods with clear docstrings
3. Any necessary private helper methods
4. Proper encapsulation and adherence to OOP principles
For optimizing existing code:

Here's a piece of code that needs optimization:
[paste code]
Please suggest optimizations to improve its performance. For each suggestion, explain the expected improvement and any trade-offs.
For writing unit tests:

Generate unit tests for the following function:
[paste function]
Include tests for:
1. Normal expected inputs
2. Edge cases
3. Invalid inputs
Use [preferred testing framework] syntax.

自动售货系统
1. 项目目标确定
1.1 项目背景与需求简述
构建一个面向桌面浏览器的数字卡密（激活码/序列号）在线售卖与自动发货平台。系统角色简化为“管理员（=卖家）”与“买家”。支持在线支付（沙箱/测试环境），支付成功后系统自动从未售卡密池中分配卡密并交付给买家。
1.2 项目核心目标
· 实现“浏览 → 下单 → 支付 → 自动发卡 → 查看/下载卡密”的完整闭环。
· 提供可维护的管理端：商品、卡密池、订单、支付、日志、基础统计。
· 确保安全与一致性：支付回调验签、发卡事务/幂等、最小化个人信息采集。
1.3 预期交付成果
· 可运行的 Web 系统（Node.js + MySQL），含前台与管理端。
· 完整源码与部署/初始化脚本、演示账号与测试数据。
· 简要文档：需求/设计、接口说明、测试用例与报告、用户手册（管理员/买家）。
2. 项目初步方案
2.1 核心功能概述
· 买家端：商品列表与详情、下单（数量）、支付、订单查询、卡密显示/下载 TXT。
· 管理端（=卖家）：登录、商品上/下架与定价、卡密池批量导入/导出（CSV/文本）、库存与状态（未售/已售/作废）、订单与支付查询、异常补发/作废、操作日志、基础统计（销售额/订单数/发卡成功率）。
· 自动发卡：支付成功后原子分配对应商品的未售卡密，生成发卡记录并交付。
· 安全合规：密码加密、SQL 注入/XSS/CSRF 防护、支付回调验签与幂等。
2.2 系统架构与技术选型设想
· 架构：B/S 三层（前端/服务端/数据库），RESTful API。
· 后端：Node.js 18 LTS + Express；分层（路由→服务→DAO）；支付沙箱集成；统一日志与错误码；必要时以事务/队列保证发卡一致性。
· 数据库：MySQL 8；核心表：user、product、card_code、order、payment、delivery、audit_log；下单时对关键字段（商品标题、价格）做快照。
· 前端：HTML/CSS/JS + Bootstrap（桌面端优先）；管理端提供表格/筛选/导出。
· 安全：bcrypt 密码、参数化 SQL、输出转义、CSRF Token；仅可信来源触发状态变更。
2.3 用户界面与交互流程初步设想
· 买家流程：商品详情 → 输入数量 → 创建订单（待支付） → 跳转/二维码 → 支付成功 → 订单页展示卡密（复制/下载）。
· 管理员流程：登录 → 商品管理 → 卡密池导入与校验 → 上架 → 查看订单与支付 → 异常单补发/作废 → 统计导出。
3. 开发环境与工具准备
3.1 开发环境准备（编程语言、操作系统、数据库等）
· 语言/运行时：Node.js 18 LTS（npm）。
· 操作系统： Linux。
· 数据库：MySQL 8。
· 浏览器：Chrome/Edge 最新稳定版。
3.2 开发工具试用与确定（IDE、版本控制工具等）
· IDE：VS Code（ESLint、Prettier、REST/Thunder Client 等插件）。
· 版本控制：Git + GitHub（私有仓库、分支/PR 流程）。
· 接口调试：Postman/Insomnia。
· 任务协作：Notion。
3.3 环境搭建计划
1. 安装 Node.js/MySQL，创建数据库与最小表结构；准备 .env 模板。
2. 初始化项目（Express 骨架、路由/中间件、统一响应与错误处理）。
3. 接入 MySQL（DAO 层、连接池、事务封装），跑通“健康检查 + 示例 CRUD”。
4. 引入 Bootstrap，完成基础模板页与管理端登录页。
5. 沙箱支付联调（回调验签/幂等），打通“下单 → 回调 → 状态更新”。
4. 资料、技术与规范学习
4.1 资料与素材搜集清单（书籍、博客、API文档、UI素材等）
· Node.js、Express、MySQL 官方文档与快速上手资料。
· 支付平台沙箱/测试文档（下单、回调、签名/验签、幂等处理）。
· UI 素材与图标库（Iconfont）、表格/分页交互参考。
4.2 关键技术学习清单（需学习的新语言、框架、库等）
· Node.js 异步与错误处理、Express 中间件与会话/认证。
· MySQL 事务、锁、索引与 SQL 调优；下单快照与幂等设计。
· 支付回调验签、重复通知幂等、发卡分配事务与并发防超卖。
· 前端表格/筛选/导出实现与下载安全。
4.3 开发规范学习（代码规范、Git 提交规范、文档规范）
· 代码：ESLint（Airbnb/Recommended）、Prettier、统一错误码与结构化日志。
· Git：Conventional Commits（feat/fix/docs…）、分支管理（main/dev/feature-*）。
· 文档：最小必需（README、接口表、部署说明、测试用例/报告）。
5. 项目立项与计划编写
5.1 项目成员及分工
· 周靖凯（后端/支付/数据）：数据库与 DAO、订单/支付/回调、发卡事务/幂等、日志与导出。
· 俞越（前端/管理端/测试）：前台与管理端页面、表单与表格交互、用例与回归测试、体验优化。
· 共同职责：架构/表结构/接口协议评审，互相 Code Review。
5.2 项目总体时间安排与里程碑
6. W1 启动与环境：确认需求与表结构；搭建骨架与数据库；示例接口可用（M1）。
7. W2 设计与基础模块：用户/权限、商品管理、卡密池导入与校验。
8. W3 下单与订单：下单流程、订单模型、状态机与快照。
9. W4 支付联调：创建支付单、回调验签、幂等；订单状态联动（M2）。
10. W5 自动发卡：事务/锁/队列保障原子分配；交付（展示/下载/邮件可选）（M3）。
11. W6 管理端完善：订单/支付/日志/统计、导出；异常补发/作废。
12. W7 测试与加固：功能/并发/安全测试；修复与体验优化。
13. W8 收尾交付：文档与演示、部署脚本、最终回归测试（M4）。
 


系统需求分析



	课题名称：        自动售货系统          

	课题组员：        周靖凯 俞越            

	完成时间：     2025年11月17日             

1 引言
1.1 项目背景与目标
随着各类游戏点卡、软件激活码、会员兑换码等数字商品的普及，传统“手工发码”（人工发邮件、手动发送图片/文本）效率低、易出错、难以统计与追踪。本项目拟构建一个面向桌面浏览器的数字卡密在线售卖与自动发货平台，角色简化为：
买家：通过浏览器访问前台网页，选择商品、下单并支付，支付成功后自动获得卡密。
管理员（=卖家）：通过管理端维护商品与卡密池，查看订单与支付记录，处理异常订单并查看统计报表。
系统集成支付沙箱环境，在支付成功后自动从“未售卡密池”中分配卡密，实现“浏览 → 下单 → 支付 → 自动发卡 → 查看/下载卡密”的完整业务闭环。
项目目标概括为：
1.提供一套可在线运行的 Web 自动售货系统（Node.js + MySQL）。
2.支持卡密批量导入、自动分配和发货全过程，减少人工干预。
3.提供易维护的管理端：商品、卡密、订单、支付、日志和基础统计。
4.在保证体验的前提下，尽量减少个人信息采集，确保支付与数据安全。
1.2 文档范围
文档主要内容包括：
业务流程与数据流分析
关键数据结构与数据模型
系统功能、用例及界面原型设想
性能、安全、可用性等非功能性需求
实现层面的设计与代码细节将在后续《系统设计说明书》《数据库设计说明书》中展开。
1.3 术语定义
术语	含义
卡密（Card Code）	数字商品的兑换码、激活码或序列号，可包含主码与附加密码。
卡密池	存放所有卡密记录的数据库集合，区分未售 / 已售 / 作废状态。
批次（Import Batch）	管理员一次导入的卡密集合，用于统计来源及问题追踪。
自动发卡	支付成功后，系统自动从未售卡密池中锁定并分配卡密给订单的过程。
买家	访问前台页面购买卡密的用户，可匿名或使用邮箱标识。
管理员	登录管理端的系统维护者，负责商品、卡密、订单及统计管理。
支付平台	外部第三方支付沙箱（如支付宝/微信沙箱），负责收款和回调通知。
支付回调	支付平台在交易完成后，向本系统指定地址发送的异步通知（含签名）。
幂等	相同的支付回调多次到达时，系统只产生一次发卡/状态变更效果。
1.4 参考文献
1.Node.js 18 与 Express 官方文档。
2.MySQL 8 官方文档（事务、锁、索引相关章节）。
3.所选支付平台的沙箱/测试文档（下单接口、签名/验签算法、回调规范）。
4.项目自建文档：《数据字典》《业务流程建模图》《E-R 图》等。
2 业务流程分析
2.1 业务背景描述
系统业务场景如下：
1.管理员通过管理端维护商品（例如某游戏点卡 50 元、激活码等），并通过批量导入方式将大量卡密导入卡密池。
2.买家访问前台网站，浏览商品列表和详情，根据需要选择数量，下单并跳转到支付平台支付。
3.支付平台完成扣款后，通过回调接口通知系统支付结果。
4.系统在验证回调签名且确认金额无误后，从“未售卡密池”中原子性地锁定 N 条卡密（N=购买数量），更新为已售并绑定到订单，随后在订单详情页向买家展示卡密，并提供 TXT 文件下载。
5.管理员可在后台查看订单/支付记录、库存情况、导入批次信息、操作日志和统计报表，对于支付成功但发卡异常的订单，可执行人工补发或作废操作。
2.2 业务流程建模（泳道图）
系统关键参与者涉及：
买家泳道：商品浏览、下单、支付、订单查询、卡密查看/下载。
自动售货系统泳道：商品查询、库存检查、订单生成、创建支付请求、接收回调、自动发卡、记录操作与统计。
管理员泳道：登录、商品配置、卡密导入维护、异常订单处理、统计报表查看。
支付平台泳道：根据系统下单请求生成支付页面/二维码，支付完成后发送回调通知。


3 数据分析
3.1 数据流图（DFD）
根据已绘制的 DFD 图，系统的数据流整体分为三部分：
1.DFD-0 总体图
o外部实体：买家、管理员、支付平台。
o数据存储：商品库、卡密池、订单库、支付记录库、用户/管理员库、操作日志库。
o主要处理：商品浏览与下单、支付与自动发卡、管理端操作与统计。

2.DFD-1 买家子系统
o处理：
商品浏览：从商品库读取商品信息与价格。
创建订单：校验库存（未售卡密数量），写入订单记录。
订单查询与卡密查看：从订单库与卡密池读取订单状态和已售卡密。

3.DFD-1 支付 & 自动发卡子系统
o处理：
支付下单：根据订单信息计算应付金额，向支付平台发起下单请求。
支付回调验签：接收支付结果通知，验证签名与金额，写入/更新支付记录库。
自动发卡：读取订单信息与库存，写入/更新支付记录和卡密池状态，更新订单状态。

4.DFD-1 管理端子系统
o处理：管理员登录、商品管理、卡密导入与维护、订单查询与人工补发、统计报表生成等，对应读写用户库、商品库、卡密池、订单库、支付记录库和操作日志库。

3.2 数据字典
系统核心数据表如下
3.2.1 sys_user — 系统用户
id：主键 ID。
username：登录名，管理员必填。
password_hash / salt：密码哈希与盐值。
role：角色（1=管理员，2=买家）。
email：邮箱，用于通知。
status：账户启用/禁用状态。
last_login_at/ip：最近登录时间与 IP。
created_at / updated_at：创建与更新时间。
3.2.2 product — 商品
id：主键 ID。
name / code：商品名称与唯一编码。
description：商品描述。
price：当前单价（元）。
status：上架状态（0=下架，1=上架）。
sort_order：排序值。
created_by / updated_by：操作管理员。
created_at / updated_at：时间戳。
3.2.3 card_import_batch — 卡密导入批次
id：批次 ID。
product_id：对应商品。
file_name：上传文件名。
total_count / success_count / fail_count：导入统计信息。
status：导入状态（处理中、完成、失败）。
remark：错误说明或备注。
operator_id：导入人。
created_at / completed_at：导入开始与结束时间。
3.2.4 card_code — 卡密池
id：卡密记录 ID。
product_id / batch_id：所属商品与批次。
card_code / card_secret：卡密内容与附加密码。
status：0=未售，1=已售，2=作废。
order_id / sold_at：绑定订单与售出时间。
void_reason：作废原因。
created_at / updated_at：时间戳。
3.2.5 order_main — 订单主表
id / order_no：订单主键与对外订单号。
buyer_id / buyer_email：买家标识与联系邮箱。
product_id / quantity：购买商品与数量。
unit_price / total_amount / currency：下单时单价、应付金额与币种（快照）。
order_status：订单状态（待支付、支付中、已支付已发卡、待人工、已取消、已退款等）。
pay_channel：支付渠道。
client_ip：下单 IP。
created_at / paid_at / closed_at / updated_at：时间戳。
remark：备注 / 人工处理说明。
3.2.6 payment — 支付记录
id：支付记录 ID。
order_id：关联订单。
pay_no：内部支付流水号。
pay_channel：支付渠道。
pay_status：支付状态（待支付、成功、失败）。
request_amount / paid_amount：请求金额与实际支付金额。
platform_trade_no：第三方交易号。
notify_status / notify_time / notify_raw：回调处理状态、时间与原始报文。
created_at / updated_at：时间戳。
3.2.7 operation_log — 操作日志
id：日志 ID。
operator_id：操作人（管理员）。
op_type：操作类型（登录、商品修改、人工补发、作废等）。
target_type / target_id：目标对象类型与 ID。
content：详细内容（JSON 形式）。
ip：操作 IP。
created_at：操作时间。
说明：以上数据字典保证了对卡密全生命周期（导入、库存、销售、作废）及订单、支付、日志的可追溯性。
3.3 数据模型（E-R 图）

根据 E-R 图可总结主要实体及关系：
SYS_USER 与 PRODUCT：一对多关系（一个管理员可创建多个商品）。
PRODUCT 与 CARD_IMPORT_BATCH：一对多关系。
CARD_IMPORT_BATCH 与 CARD_CODE：一对多关系。
PRODUCT 与 CARD_CODE：一对多关系。
PRODUCT 与 ORDER_MAIN：一对多关系。
ORDER_MAIN 与 PAYMENT：一对多或一对一（根据支付重试策略，一般 1:1）。
ORDER_MAIN 与 CARD_CODE：一对多关系（一个订单对应若干张卡密）。
SYS_USER 与 OPERATION_LOG：一对多关系。
4 功能分析
4.1 参与者分析
1.买家（Buyer）
o浏览商品列表与详情。
o创建订单并发起在线支付。
o查询订单状态、查看/下载卡密。
2.管理员（Admin）
o登录管理端。
o商品管理：新增/编辑/上架/下架。
o卡密池管理：批量导入、导出、作废与状态维护。
o订单与支付记录查询、异常补发/作废。
o查看统计报表与操作日志。
3.支付平台（Payment Gateway）
o接收系统发起的下单请求。
o为买家提供支付页面或二维码。
o在支付完成后向系统发送回调通知。
4.2 系统用例图

主要用例如下：
买家端用例
浏览商品列表
查看商品详情
创建订单（填写数量）
在线支付订单
查看订单状态
查看卡密
下载卡密 TXT
管理端用例
管理员登录
管理商品（新增/编辑/上架/下架）
批量导入卡密
导出卡密 / 查看库存
查看订单与支付记录
处理异常订单（补发/作废）
查看基础统计（销售额、订单数、发卡成功率等）
查看操作日志
支付平台用例
接收支付下单请求
展示支付页面/二维码
发送支付结果回调通知
4.3 核心用例描述
下面选取若干核心用例进行详细描述。
UC-01 买家下单并支付
参与者：买家、支付平台
前置条件：
1.系统中已有至少一个上架商品，并且未售卡密库存充足。
触发条件：
买家在商品详情页点击“立即购买”，填写购买数量并确认。
基本流程：
1.系统校验数量大于 0 且库存足够。
2.系统根据当前商品单价计算应付金额，生成订单记录（状态=待支付），返回订单号与应付金额。
3.系统调用支付平台下单接口，生成支付链接或二维码，并跳转给买家。
4.买家在支付平台完成支付。
5.支付平台同步页提示支付结果，并稍后向系统发送异步回调。
6.系统在收到回调并验签通过后，更新支付记录与订单状态，并触发 UC-03 自动发卡。
备选/异常流程：
o2a. 库存不足：系统提示“当前商品库存不足”，订单不创建。
o3a. 支付下单接口失败：记录错误日志并提示“支付服务暂不可用，请稍后重试”。
o4a. 买家取消支付：订单保持“待支付”状态，可后续重新发起支付或超时关闭。
UC-02 管理员导入卡密
参与者：管理员
前置条件：
o管理员已登录管理端，且拥有相应权限。
触发条件：
管理员在“卡密导入”页面选择某商品，并上传 CSV/TXT 文件。
基本流程：
1.系统创建一条导入批次记录（状态=处理中），记录上传文件名与操作人。
2.系统逐行读取文件内容，对每行卡密格式进行校验（重复、空行、无效字符）。
3.校验通过的卡密写入 card_code 表，状态=未售，并关联当前批次与商品。
4.所有行处理完毕后，统计成功/失败数量，更新批次记录状态与统计字段。
5.系统在页面上反馈导入结果，并允许管理员下载失败明细（可选）。
异常流程：
o2a. 文件格式不符合要求：导入批次标记为失败，提示“请按模板上传”。
o3a. 某些卡密与库中已有记录重复：略过并计入失败数量。
UC-03 支付回调与自动发卡
参与者：支付平台
前置条件：
o存在状态为“待支付/支付中”的订单，对应支付记录已创建。
触发条件：
支付平台向系统回调 URL 发送支付结果通知。
基本流程：
1.系统接收回调参数，记录原始报文。
2.系统根据支付平台规则进行签名验证与金额校验。
3.验证通过后，根据回调中的订单号查询本地订单与支付记录。
4.若支付记录尚未标记为成功，则在一个事务中执行：
更新支付记录状态为“成功”，写入第三方交易号与实际支付金额。
检查订单当前状态，若为“待支付/支付中”，则从对应商品未售卡密池中锁定 N 条记录（加锁或队列表达），更新为已售并绑定订单号。
更新订单状态为“已支付-已发卡”，记录支付时间与发卡时间。
5.将发卡结果写入日志，返回“success”给支付平台。
幂等处理：
o若相同订单的回调重复到达，因为在步骤 4 之前会检查支付记录与订单状态，如果已处理为成功，将直接返回“success”而不重复发卡。
异常流程：
o2a. 验签失败或金额不匹配：记录异常，拒绝更新并返回失败原因。
o4a. 发卡过程中库存不足或数据库错误：回滚事务，将订单状态标记为“已支付-待人工处理”，管理员通过后台补发。
UC-04 管理员登录
参与者：管理员
前置条件：
o已在 sys_user 中配置管理员账号。
触发条件：
管理员访问管理端地址并输入用户名与密码。
基本流程：
1.系统根据用户名查询用户信息。
2.对输入密码与数据库中 password_hash 进行验证。
3.验证通过后生成会话/Token，记录最近登录时间与 IP。
4.将管理员重定向到管理端首页。
异常流程：
o2a. 用户不存在或密码错误：提示“用户名或密码错误”，记录失败登录日志。
o2b. 用户状态为禁用：提示“账号已被禁用，请联系管理员”。

5 界面原型设计
5.1 设计原则与风格
以桌面浏览器为主要使用场景，界面布局采用左右分栏或居中居宽布局。
减少不必要装饰，突出商品信息、价格与操作按钮。
前台与后台统一使用 Bootstrap 风格，统一表单、按钮与表格样式。
所有敏感操作（登录、导入、作废、补发等）提供明显提示与二次确认。
保留导航栏与表格过滤区域，便于后续增加筛选条件与导出按钮。
5.2 关键界面原型展示
1.前台首页 / 商品列表页

2.商品详情与下单页

3.订单详情与卡密查看页

4.管理端登录页

5.管理端首页 / 商品管理页


6 非功能性需求
6.1 性能需求
1.并发与吞吐
o目标并发用户：支持至少 50 个在线用户同时浏览。
o高峰发卡：在支付回调集中到达时，系统应保证每秒至少处理 10 笔订单而不出现明显卡顿。
2.响应时间
o买家浏览商品列表和详情：80% 请求响应时间 < 1s。
o订单查询与卡密展示：80% 请求响应时间 < 2s。
3.容量规划
o单库支持至少 100 万条卡密记录与 10 万笔订单记录。
o支持按时间归档历史订单与日志，以降低主库压力。
6.2 安全性需求
1.账号安全
o管理员密码必须采用强哈希算法（如 bcrypt）存储，不以明文保存在数据库或日志中。
o登录接口应设置基础防爆破措施（例如限制连续失败次数，记录异常 IP）。
2.数据与输入安全
o所有数据库操作使用参数化 SQL 或 ORM，防范 SQL 注入。
o所有输出到页面的数据进行 HTML 转义，防范 XSS 攻击。
o关键操作接口需校验 CSRF Token 或使用同源策略。
3.支付安全
o严格按照支付平台规范进行签名与验签，禁止在回调逻辑中信任未验证的数据。
o对回调中的订单号、金额、商户号等关键字段进行多重校验。
o实现支付回调幂等控制，防止重复扣减库存和重复发卡。
4.权限与审计
o管理端所有页面都需要登录并做权限校验。
o所有关键操作（导入、补发、作废、登录失败等）必须写入 operation_log，便于审计与追责。
6.3 可用性需求
1.易用性
oUI 文案简洁明确，错误信息提示具体可操作的解决方案。
o对于长时间操作（导入大文件、统计报表生成）给出进度/等待提示。
2.兼容性
o支持 Chrome / Edge 等主流桌面浏览器的当前稳定版本。
o页面在 1366×768 及以上分辨率下保持良好显示效果。
3.可靠性与可维护性
o系统异常应有统一错误页面与日志记录，不泄露堆栈与敏感信息。
o配置文件与敏感信息使用 .env 管理，便于在不同环境（开发/测试/生产）快速部署。
7 总结
本《自动售货系统系统需求分析报告》基于课程要求与已有原型/模型，对系统的业务流程、数据结构、功能用例、界面原型以及非功能性需求进行了整体梳理和规范化描述。



系统设计



	课题名称： 自动售货系统系统设计说明书    

	课题组员：   周靖凯         俞越          

	完成时间：    2025年11月25日               
1 引言
1.1 设计目标与依据
本系统旨在构建一个安全、稳定、可扩展的自动售货平台，实现数字商品（卡密）的在线展示、下单支付、支付回调处理及自动发货等核心功能，满足《系统需求分析》中的功能、性能及高并发可靠性要求，并符合课程对模块化与接口规范的标准。
设计依据包括需求分析文档及相关技术规范：采用 Node.js 18 与 Express 框架构建后端；利用 MySQL 8 的事务与锁机制保障数据一致性；依据支付宝沙箱支付接口实现合规支付流程。整体设计贯彻“减少人工干预、保障数据安全、提升用户体验”原则，兼顾可维护性与扩展性。
1.3 系统概述
本系统是一个基于B/S架构的Web数字卡密自动售货平台，采用Node.js + Express 构建后端，MySQL 存储数据，前端使用 HTML5/CSS3 与 Bootstrap 实现响应式界面。系统支持两类用户：买家可匿名或通过邮箱浏览商品、下单并通过支付宝沙箱支付，支付成功后自动获取卡密；管理员可登录后台管理商品、卡密、订单及系统日志。整体实现“浏览→下单→支付→自动发卡”的闭环流程，并通过校验与安全机制保障交易可靠性。
1.3 技术选型与约束
技术选型与系统约束（精简版）
后端：采用 Node.js 1webtoken8 LTS 与 Express 5.x，利用其轻量、灵活及丰富的中间件生态，快速构建可维护的 API；数据库选用 MySQL 8.x（InnoDB 引擎），支持事务与行级锁，保障数据一致性与并发性能；支付集成基于支付宝官方 Node.js SDK，简化签名、验签与请求流程。
前端：面向桌面浏览器，使用 Bootstrap 统一UI风格；管理员后台辅以 Vue.js 实现轻量交互（如表格筛选），整体以前端轻量化、服务端渲染或 Ajax 返回 JSON 为主；买家无需注册，凭订单号及可选邮箱查询订单与卡密。

系统约束：  
- 服务器需支持公网 HTTPS 访问，以满足支付宝异步通知要求；  
- 管理员密码使用 bcrypt 强哈希存储，不存明文；  
- 遵循个人信息最小化原则，仅在必要时收集买家邮箱；  
- 满足课程性能指标：支持 ≥50 人并发浏览，支付回调峰值 ≥10 笔/秒；  
- 设计具备扩展性：支付模块抽象接口，便于接入微信支付等；RESTful API 风格利于未来对接移动端或第三方服务。
1.4 参考文献
Node.js 18 & Express 官方文档 – Node.js v18 特性及Express框架使用指南
MySQL 8 官方文档 – 事务处理、锁机制与索引优化章节，指导数据库设计和优化
支付宝沙箱支付接入文档 – 支付宝开放平台沙箱环境下单接口说明、签名/验签算法、回调规范等 
项目需求分析及模型文档 – 包括《自动售货系统需求分析》《数据字典》《业务流程模型图》《E-R图》等项目内部资料
2 系统架构设计
2.1 总体架构设计
本系统采用典型的三层架构模型，划分为表示层、业务逻辑层和数据层，并通过第三方支付接口与外部系统集成。总体架构如下：
本系统采用三层架构，包括表示层、业务逻辑层和数据层，并集成第三方支付接口。
- 表示层：包含买家前台与管理员后台。前台支持商品浏览、下单、支付及订单查询；后台提供商品、卡密、订单及日志管理功能。页面由服务端渲染，关键操作通过 Ajax 调用 RESTful API 实现局部更新，兼顾性能与体验。
- 业务逻辑层：基于 Node.js + Express 构建，按功能划分为用户认证、商品库存、订单处理、支付集成、日志等模块。采用 MVC 模式，通过路由分发请求至对应控制器，控制器协调服务组件完成业务流程（如创建订单、扣减库存、生成支付链接）。支付回调接口接收支付宝异步通知，执行签名验签、金额校验，并更新订单状态。设计注重安全性、可维护性与扩展性。

- 数据层：使用 MySQL 8（InnoDB 引擎），存储用户、商品、卡密、订单、支付记录等数据，支持 ACID 事务。关键表（如卡密表）建立针对性索引以提升查询效率；订单与支付更新通过事务保证原子性；通过状态标记确保支付回调的幂等处理，防止重复发放卡密。
- 外部集成：通过支付宝 SDK 对接其统一下单与异步通知接口，使用 HTTPS 通信，并严格校验签名与来源 IP。支付模块采用可插拔设计，便于未来扩展微信支付或邮件通知等服务。
2.2 部署架构设计
系统部署遵循“简单、高可用”原则，支持从单机开发到生产环境的平滑演进。
- 基础部署：生产环境下，Node.js 应用与 MySQL 数据库分离部署，通过内网通信以提升安全性和性能。Node.js 服务器配置公网域名和 TLS 证书，启用 HTTPS，满足支付宝回调的网络可达性要求，并保障用户数据传输安全。
- 可扩展性：虽当前并发需求较低（约50人），架构已支持横向扩展。可通过 Nginx 等反向代理实现负载均衡，分发请求至多个 Node.js 实例；会话采用无状态 JWT 或共享存储，确保多实例兼容。
- 运维保障：使用 PM2 等进程管理工具实现应用自动重启、崩溃恢复和日志管理；系统与操作日志持久化，便于审计与问题追踪。MySQL 定期备份，关键表（如卡密、订单）按时间分区或归档；生产环境推荐主从复制或云数据库服务，提升可用性与容灾能力。
- 支付对接：测试阶段使用支付宝沙箱环境，上线后切换至正式网关。服务器需确保出站连通支付宝接口，入站开放 HTTPS 端口，并在防火墙放行支付宝官方回调 IP。因支付宝 notifyUrl 不支持附加参数，系统通过固定路径识别订单并处理通知。
该架构在开发阶段可单机部署（Node.js + MySQL 同机），生产阶段可灵活扩展，兼顾性能、安全与可维护性。
3 模块设计
3.1 模块划分
系统按功能职责划分为六个核心模块，各模块职责清晰、接口明确，便于维护与扩展：
- 用户与权限模块：实现管理员登录认证、会话管理及基于角色的权限控制；买家无需注册，仅在下单时可选填邮箱（用于未来通知），并校验邮箱格式。

- 商品与库存模块：管理商品信息（增删改、上下架）及卡密库存（批量导入、查询、导出、作废）；确保卡密唯一性与状态生命周期（未售→已售→作废）；为订单模块提供库存查询与分配服务。
- 订单与支付模块：处理订单创建、状态流转及支付全流程。下单时校验库存并生成待支付订单；调用支付宝 SDK 生成支付链接；接收并验证支付宝异步通知，完成卡密分配、订单状态更新，并通过幂等机制防止重复发货。
- 前台展示模块：实现买家端页面（商品列表、详情、下单、支付结果、卡密展示等），通过 Express 路由调用商品、订单和支付模块，提供完整购物流程体验。
- 后台管理模块：提供管理员操作界面，涵盖商品管理、卡密导入、订单处理（含人工补发）、统计报表及日志查询；通过权限模块严格限制访问，并调用各业务模块完成数据操作。
- 日志与统计模块：记录管理员关键操作日志（存入 operation_log 表），支持审计追溯；提供销售、订单、发卡成功率等统计指标，支持实时或定时计算，预留图表展示扩展能力。
各模块通过明确定义的接口协作（如订单模块调用库存与支付模块），实现高内聚、低耦合，便于团队开发及后续功能扩展（如新增支付方式或商品类型）。
3.2 核心模块功能描述
本节对关键模块的功能进行详细说明，包括模块提供的主要接口和业务逻辑：
用户与权限模块：提供管理员登录认证和基础的权限管理。其功能包括：- 管理员登录：验证用户名密码，利用安全哈希比对密码（如使用bcrypt算法存储的password_hash）。登录成功则创建服务器会话或签发JWT令牌，并记录last_login时间和IP。登录失败或账号被禁用则给予相应提示，并在操作日志中记录尝试。- 权限控制：Express中通过中间件对后台路由进行保护，只有session中标记为已登录管理员的请求才能继续处理。若未登录则重定向到登录页。根据role字段可以控制不同角色对接口的访问权限。- 买家身份标识：买家无需注册账号，但每笔订单可关联一个buyer_email（选填）。用户模块对提交的邮箱格式进行校验。在订单支付成功后，可由系统发送通知邮件（如果实现的话）。本模块留有扩展接口与外部邮件服务集成，实现自动发信通知买家兑换码。但在当前实现中，买家主要通过前端页面直接获取卡密。
商品与库存模块：封装商品信息管理和卡密库存管理的业务。主要功能点：- 商品管理：提供商品的CRUD接口，包括新增商品（需要填写名称、编码、描述、价格等）、编辑商品信息、设置上架/下架状态、调整排序等。新增或编辑时对关键字段进行校验（如商品编码唯一、价格为正数等）。当商品下架时，前台不再显示但库存仍保留。模块内部记录操作人和时间，在operation_log中记录商品变更日志。- 卡密批量导入：管理员通过上传文件（CSV或TXT）导入卡密。模块读取文件内容逐行解析卡密（支持主码和附加密码两列），对格式和重复性进行校验：过滤空行和非法行，检查是否与数据库已存在卡密重复（同一商品下不允许重复卡密）。对于每次导入，创建一条导入批次记录（card_import_batch），标记状态为“处理中”，并关联导入人和商品。导入过程中，将成功解析的卡密插入card_code表（状态初始为0=未售），失败的记录计入fail_count并收集原因。全部处理完毕后，更新批次的统计信息（total/success/fail）和状态为“完成”。如果导入过程中发生严重错误（如文件不符格式），则批次状态标记为“失败”并填写remark说明问题。导入完成后，模块返回结果摘要，并支持管理员下载失败明细（包含未导入的卡密行及原因）。- 库存查询与导出：提供按商品查询当前库存数量的功能（统计card_code表中status=0未售的记录数），在前台下单时也会用到库存检查以防止超卖。管理员可在后台查看某商品已售/未售/作废的卡密数量，以及点选导出未售卡密列表等（导出会生成CSV供下载）。- 卡密状态变更：提供接口将特定卡密标记为“作废”（status=2），例如某批次发现有问题可以作废未售出的码。作废操作要求管理员提供原因（void_reason）并记录操作日志。作废后的卡密不再会被出售或分配。对于已售出的卡密，如发生退款或其他原因导致订单无效，管理员也可以通过后台界面执行订单作废或补发操作：这会调用库存模块接口，将相关卡密重新放回未售池或分配新的卡密给订单（需谨慎操作并记录日志）。
订单与支付模块：这是系统的核心业务模块，处理从用户下单到支付完成整个流程。主要功能和逻辑：- 订单创建：当买家在前台商品详情页提交购买请求时，订单模块首先验证请求参数：商品ID有效、数量为正、并通过库存模块检查该商品未售卡密数量是否不少于购买数量。如校验通过，则按当前商品单价计算应付总金额，生成一条订单记录写入order_main表。订单号（order_no）可按一定规则生成（例如当前时间戳+随机后缀确保唯一性）。订单记录包含买家邮箱（如果提供）、客户端IP等信息，状态初始设为“待支付”。同时，生成对应的支付记录(payment表)记录下此次支付请求（状态“待支付”，请求金额、支付渠道如支付宝等)。最后，订单模块调用支付模块接口为该订单发起支付。- 支付下单：支付子模块收到订单信息后，通过支付宝SDK调用统一下单API生成支付链接或二维码。在本系统中，因为面向桌面浏览器，采用支付宝“网页支付”接口（alipay.trade.page.pay），构造表单参数包括订单号(out_trade_no)、订单总金额(total_amount)、商品名称(subject)、商品描述等。同时指定支付结果的前端跳转地址(returnUrl)和后端通知地址(notifyUrl)。支付宝SDK会返回一个可以跳转的URL，系统将该URL发送给前端，或者直接重定向买家浏览器到该URL，让用户在支付宝页面完成支付。支付模块在此过程中还可能更新支付记录的内部支付单号(pay_no)以及支付渠道等信息。- 支付同步返回：买家支付完成后，支付宝会同步重定向到我们提供的returnUrl页面。该页面上可通过查询参数获得订单号、支付宝交易号等有限信息。但出于安全考虑，系统不会以同步返回作为最终付款确认依据，而是展示一个友好的界面提示支付结果正在确认中。页面可以显示“支付成功，正在获取卡密...”或“支付处理中，请稍候”，并通过Ajax轮询后端确认订单状态。买家也可以在稍后手动刷新或通过订单查询功能获取卡密。- 支付异步通知与自动发卡：支付宝会向notifyUrl发送服务器端的异步通知，包含详细的交易结果数据（如交易状态trade_status、订单号out_trade_no、支付金额等），且附带签名。支付模块的通知接收接口先记录原始通知报文，然后使用支付宝公钥对通知数据进行验签，确保消息确实来自支付宝且未被篡改。验签通过后，再校验通知的订单号在本地是否存在，以及通知中的支付金额与订单应付金额是否一致，防止支付金额不符的情况。接下来，根据通知的交易状态进行处理： 
- 如果trade_status表明支付成功（如TRADE_SUCCESS或TRADE_FINISHED），且本地订单目前仍是待支付状态，则进入发卡流程。系统会启动一个事务（Transaction）：首先更新对应payment记录状态为“成功”，写入支付宝交易号(platform_trade_no)和支付完成时间等；然后调用库存模块尝试锁定N条未售卡密（N为购买数量）。锁定方式是在card_code表中检索出该商品状态为0的前N条记录，并将其更新为已售(status=1)、绑定order_id和sold_at时间。为了保证并发安全，这一过程需要使用行级锁或事务串行化：例如在SELECT卡密时使用FOR UPDATE锁定行，或者直接利用UPDATE ... WHERE status=0 LIMIT N来原子地标记卡密，同时配合唯一约束避免多订单争抢同一库存。若成功分配到所需数量卡密，则将订单状态更新为“已支付，已发货”（或“完成”），并在订单记录中写入支付时间、完成时间等。最后提交事务。事务确保了只有在支付记录、订单状态、卡密分配这些操作全部成功时才持久化变更，如中途任何一步失败则回滚，不会产生部分扣款未发货的情况。
- 如果在验签通过但发卡过程出现异常（如库存不足（理论上不应发生，除非并发下另一路已抢走库存）或数据库错误），则需要将订单状态标记为“已支付，待人工处理”，记录问题原因，便于管理员后续介入处理。这样的订单不会暴露卡密给买家，直到管理员确认处理完成。 
- 对于通知中标记交易关闭或支付失败的情况，系统相应将订单状态更新为“已取消”或“支付失败”，释放库存占用（如果有的话），并记录日志。 
- 最后，无论成功或失败，通知接口都需返回字符串“success”给支付宝，表示我们已成功收到通知。支付宝收到“success”后将不再重复发送通知；否则在一段时间内会重试通知多次。因此我们的实现特别注意
幂等性：如果相同订单的支付通知重复到达，代码会检测订单或支付记录已是成功状态，则直接响应success而不会重复执行发卡逻辑，从而避免卡密被重复分配。 
- 订单查询与卡密交付：在支付成功且发货完成后，买家可以通过前端查看订单详情获取卡密。具体有两种途径：其一是支付完成后的跳转页面会自动展示订单结果（如果后端通知已处理完毕，可以查询到已绑定的卡密列表并显示给用户）；其二是买家可访问“订单查询”页面，输入订单号和下单时填写的邮箱进行查询验证，系统查到匹配的已支付订单后展示卡密信息。卡密信息在页面上以明文或遮挡形式显示，并提供“一键复制”和“下载TXT文件”功能方便用户保存。【注: 下载TXT实现是后台根据订单关联的卡密动态生成文本文件，通过HTTP触发下载。】 当订单未支付或支付失败时，查询页面会显示相应状态提示，不提供卡密。
3.3 核心功能流程图

3.4 核心功能代码逻辑
本节从实现角度描述核心功能的代码逻辑或算法设计。考虑到系统关键在于支付通知处理、卡密分配和批量导入等，下面以伪代码形式展示这些部分的逻辑。
(1) 支付通知处理与自动发卡
app.post('/api/pay/alipay/notify', async (req, res) => {    const params = req.body;  // 支付宝发送的通知参数    // 1. 验签    const valid = alipaySdk.checkNotifySign(params);  // 调用SDK方法或手动验签    if (!valid) {        console.error("验签失败，可能伪造的通知");        return res.status(400).send("failure");  // 返回failure通知支付宝重发    }    // 2. 提取订单号和结果    const orderNo = params.out_trade_no;    const tradeStatus = params.trade_status;    const payAmount = parseFloat(params.total_amount);    // 查找本地订单和支付记录    let order = await OrderModel.findOne({ order_no: orderNo });    let payment = await PaymentModel.findOne({ order_id: order.id });    if (!order) {        console.error("通知中的订单号找不到:" + orderNo);        return res.send("success");  // 找不到对应订单，返回success避免重复（实际可记录异常）    }    // 3. 根据交易状态处理    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {        if (order.status !== 'UNPAID') {  // 已处理过            return res.send("success");  // 幂等：订单已支付则直接确认成功        }        if (Math.abs(order.total_amount - payAmount) > 0.001) {  // 金额校验            console.error(`订单金额不符: 应付${order.total_amount}, 实付${payAmount}`);            // 标记支付记录异常状态            payment.status = 'MISMATCH';            payment.notify_raw = JSON.stringify(params);            await payment.save();            return res.send("failure");        }        // 4. 自动发卡事务        try {            await database.transaction(async (t) => {                // 更新支付记录为成功                payment.status = 'SUCCESS';                payment.paid_amount = payAmount;                payment.platform_trade_no = params.trade_no;                payment.notify_status = 'PROCESSED';                payment.notify_time = new Date();                await payment.save({ transaction: t });                // 锁定并更新N条未售卡密                const cardCodes = await CardCodeModel.findAll({                    where: { product_id: order.product_id, status: 0 },                    limit: order.quantity,                    lock: true,                // 加锁                    skipLocked: true,          // 跳过已锁记录（不同数据库略有差异）                    transaction: t                });                if (cardCodes.length < order.quantity) {                    throw new Error("库存不足，实际剩余" + cardCodes.length);                }                for (let card of cardCodes) {                    card.status = 1;         // 标记为已售                    card.order_id = order.id;                    card.sold_at = new Date();                    await card.save({ transaction: t });                }                // 更新订单状态和支付时间                order.status = 'PAID';       // 已支付已发货                order.paid_at = new Date();                order.updated_at = new Date();                await order.save({ transaction: t });            });            console.log(`订单${orderNo}发卡成功，分配${order.quantity}条卡密`);        } catch (err) {            console.error("自动发卡失败:", err);            // 如果失败，更新订单状态为待人工处理            order.status = 'PAID_MANUAL';            order.remark = '需要人工处理: ' + err.message;            await order.save();            // 此情况下也返回success，避免支付宝多次通知            return res.send("success");        }    } else if (tradeStatus === 'TRADE_CLOSED') {        // 交易关闭（超时未付款或已退款）        order.status = 'CLOSED';        order.closed_at = new Date();        await order.save();        payment.status = 'CLOSED';        await payment.save();    } else if (tradeStatus === 'WAIT_BUYER_PAY') {        // 未付款，可能不会收到这类通知，忽略        return res.send("success");    }    // 5. 通知处理完成    res.send("success");});
(2) 卡密批量导入逻辑（位于商品与库存模块的导入处理函数）:
async function importCardCodes(productId, filePath, operatorId) {    // 创建导入批次记录    let batch = await CardImportBatch.create({        product_id: productId,        file_name: path.basename(filePath),        status: 'PROCESSING',        total_count: 0, success_count: 0, fail_count: 0,        operator_id: operatorId,        created_at: new Date()    });    const results = { failedLines: [] };    // 读取文件逐行解析    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);    for (let i = 0; i < lines.length; i++) {        const line = lines[i].trim();        if (!line) continue;  // 跳过空行        batch.total_count++;        const parts = line.split(',');         const code = parts[0] ? parts[0].trim() : '';        const secret = parts[1] ? parts[1].trim() : '';        // 基础校验        if (!code) {            results.failedLines.push({ line: i+1, reason: '主码为空' });            batch.fail_count++;            continue;        }        if (code.length > 255 || secret.length > 255) {            results.failedLines.push({ line: i+1, code, reason: '码或密太长' });            batch.fail_count++;            continue;        }        // 查重校验（同一商品下不能重复）        const exists = await CardCode.findOne({ where: { product_id: productId, card_code: code, card_secret: secret } });        if (exists) {            results.failedLines.push({ line: i+1, code, reason: '重复的卡密' });            batch.fail_count++;            continue;        }        // 写入数据库        try {            await CardCode.create({                product_id: productId,                batch_id: batch.id,                card_code: code,                card_secret: secret,                status: 0,                created_at: new Date()            });            batch.success_count++;        } catch (err) {            // 写入失败（可能是数据库错误或编码问题）            results.failedLines.push({ line: i+1, code, reason: '数据库错误:' + err.message });            batch.fail_count++;        }    }    // 完成导入，更新批次状态    batch.status = (batch.fail_count > 0 ? (batch.success_count > 0 ? 'PARTIAL' : 'FAILED') : 'COMPLETED');    batch.completed_at = new Date();    await batch.save();    return { batch, ...results };}
(3) 订单创建及支付请求逻辑
app.post('/order/create', async (req, res) => {    const { product_id, quantity, buyer_email } = req.body;    // 1. 基本校验    if (!product_id || !quantity || quantity <= 0) {        return res.status(400).send({ error: "参数不正确" });    }    const product = await Product.findByPk(product_id);    if (!product || product.status !== 1) {        return res.status(400).send({ error: "商品不存在或已下架" });    }    // 2. 检查库存    const availableCount = await CardCode.count({ where: { product_id, status: 0 } });    if (availableCount < quantity) {        return res.status(200).send({ success: false, message: "库存不足，当前剩余" + availableCount });    }    // 3. 创建订单和支付记录    const orderNo = generateOrderNo();  // 生成唯一订单号    const unitPrice = product.price;    const totalAmount = unitPrice * quantity;    const order = await OrderMain.create({        order_no: orderNo,        product_id, quantity,        unit_price: unitPrice,        total_amount: totalAmount,        currency: 'CNY',        order_status: 'UNPAID',        buyer_email: buyer_email || '',        client_ip: req.ip,        created_at: new Date()    });    const payment = await Payment.create({        order_id: order.id,        pay_channel: 'ALIPAY',        pay_status: 'PENDING',        request_amount: totalAmount,        created_at: new Date()    });    // 4. 调用支付模块获取支付链接    try {        const payUrl = await PaymentService.createAlipayPagePay(orderNo, totalAmount, {            subject: product.name,            returnUrl: BASE_URL + '/order/complete',            notifyUrl: ALIPAY_NOTIFY_URL        });        // 返回支付链接给前端，前端可选择重定向或者生成二维码        res.send({ success: true, payUrl, order_no: orderNo });    } catch (err) {        console.error("调用支付宝下单接口失败:", err);        // 回滚订单和支付记录        await order.destroy();        await payment.destroy();        res.status(500).send({ success: false, message: "支付服务暂不可用，请稍后重试" });    }});
4 数据库设计
4.1 逻辑模型转物理模型
根据需求分析阶段绘制的E-R图和数据字典，我们将逻辑数据模型转换为MySQL物理表结构。本系统的主要实体及关系在数据库中直接体现为表与外键约束。由于InnoDB引擎支持事务和外键，我们在建表时为关键关联添加了外键约束以保证引用完整性，例如订单表的product_id引用商品表主键，卡密表的product_id引用商品表等。同时，对常用查询和保持数据一致性，我们增加了一些索引与约束：
主键和自增：每张表的id字段设为PRIMARY KEY，并使用AUTO_INCREMENT属性方便插入。外部引用均采用该自增ID。
唯一键：对于一些具有唯一性要求的字段组合，增加UNIQUE约束。例如，在card_code表中，可以对(product_id, card_code, card_secret)三列设置唯一键，防止重复卡密导入同一商品；在product表中对code字段设唯一键以快速通过编码查找商品。
外键：如order_main表的product_id引用product(id)，order_main表的buyer_id（如果有用户表存在的话）引用sys_user(id)，card_code的product_id和batch_id分别引用product和card_import_batch表，card_code的order_id引用order_main(id)等。这些外键可以设定ON DELETE/ON UPDATE策略，一般采用RESTRICT或NO ACTION防止误删，比如不允许直接删除有订单的商品记录。
索引：为了优化查询性能，我们增加一些辅助索引。例如card_code表上建立(status, product_id)组合索引，以支持按商品过滤未售卡密时的快速查询；payment表上对order_id建立索引以通过订单查支付记录；operation_log上对operator_id建立索引以便按管理员筛选日志等。
数据类型选择：采用合适的数据类型存储各字段：价格金额使用DECIMAL(10,2)保证精度，日期时间统一采用DATETIME类型记录，状态/类别字段使用TINYINT或SMALLINT存储枚举值（如status字段0/1/2），文本描述使用VARCHAR或TEXT根据长度需求选择。对IP地址存IPv4/IPv6需要的长度，选择VARCHAR(45)。对于可能存储JSON的content字段使用TEXT或JSON类型。
在物理模型设计过程中，我们还考虑了历史数据归档需求。由于订单和日志可能产生大量记录，可以按时间将历史记录转移到备份表或归档库。例如按年分表存储operation_log，或者提供脚本定期删除过旧的日志记录，以维持主库性能。这属于可选优化，核心表的结构在本阶段设计如下。
4.2 主要数据表结构
以下列出系统主要数据表的结构，包括字段、类型和说明：
1. sys_user（系统用户表） – 存储管理员账户信息及买家用户（如果有注册的话）。
字段名
数据类型
描述

id
INT UNSIGNED
主键，自增ID

username
VARCHAR(50)
登录用户名（管理员）

password_hash
VARCHAR(100)
密码哈希

salt
VARCHAR(32)
密码盐值（如使用则存储）

role
TINYINT
角色类型（1=管理员，2=买家）

email
VARCHAR(100)
邮箱（通知/标识用）

status
TINYINT
账户状态（0=禁用，1=启用）

last_login_at
DATETIME
上次登录时间

last_login_ip
VARCHAR(45)
上次登录IP地址

created_at
DATETIME
创建时间

updated_at
DATETIME
更新时间

说明： 初始阶段买家无需注册，因此买家不一定在此表有记录。但如果未来扩展买家注册功能，可将role=2用于买家账户。管理员账户在初始化时插入。密码采用bcrypt等算法计算hash存储，salt可单独存放或包含在hash中。
2. product（商品表） – 存储可售卖的数字商品信息。
字段名
数据类型
描述

id
INT UNSIGNED
主键，自增ID

name
VARCHAR(100)
商品名称

code
VARCHAR(50)
商品编码（唯一，用于标识商品）

description
TEXT
商品描述

price
DECIMAL(10,2)
商品单价（元）

status
TINYINT
上架状态（0=下架，1=上架）

sort_order
INT
排序权重（值越大排序越靠前）

created_by
INT UNSIGNED
创建人用户ID（FK->sys_user.id）

updated_by
INT UNSIGNED
最近更新人用户ID

created_at
DATETIME
创建时间

updated_at
DATETIME
更新时间

说明： 商品code需全局唯一，方便通过编码快速检索商品（如对接外部系统时使用）。price采用DECIMAL以避免浮点误差。sort_order用于前台显示时的排序，可为空默认为0。created_by, updated_by关联管理员用户，记录操作人。可对status和sort_order建立复合索引以按状态和排序查询上架商品列表。
3. card_import_batch（卡密导入批次表） – 记录每次批量导入卡密的操作。
字段名
数据类型
描述

id
INT UNSIGNED
主键，批次ID

product_id
INT UNSIGNED
所属商品ID（FK -> product.id）

file_name
VARCHAR(255)
导入文件名

total_count
INT
文件卡密总行数（有效行）

success_count
INT
成功导入数量

fail_count
INT
失败数量

status
VARCHAR(20)
导入状态（PROCESSING进行中/COMPLETED完成/FAILED失败等）

remark
VARCHAR(255)
备注或错误说明（例如失败原因概述）

operator_id
INT UNSIGNED
导入操作人ID（FK -> sys_user.id）

created_at
DATETIME
导入开始时间

completed_at
DATETIME
导入完成时间

说明： total_count等统计字段在导入过程中更新。status可用枚举，或者直接用success_count与fail_count是否为0判断是否全部成功。这里用VARCHAR储存状态方便扩展（如PARTIAL部分成功）。file_name保存上传的原始文件名以备查。operator_id记录哪位管理员执行的导入。
4. card_code（卡密池表） – 存储所有导入的卡密记录。
字段名
数据类型
描述

id
BIGINT UNSIGNED
主键，卡密记录ID（大量数据用BIGINT）

product_id
INT UNSIGNED
所属商品ID（FK -> product.id）

batch_id
INT UNSIGNED
导入批次ID（FK -> card_import_batch.id）

card_code
VARCHAR(255)
卡密主码（兑换码/序列号等）

card_secret
VARCHAR(255)
卡密附加密码（如有，否则可为空）

status
TINYINT
卡密状态（0=未售，1=已售，2=作废）

order_id
INT UNSIGNED
绑定订单ID（FK -> order_main.id，已售时关联）

sold_at
DATETIME
售出时间（成为已售时记录时间）

void_reason
VARCHAR(255)
作废原因（status=2时说明原因）

created_at
DATETIME
导入时间

updated_at
DATETIME
更新时间（状态变更时更新）

说明： card_code表数据量预计较大，采用BIGINT作为主键类型提高上限。为加速查询，建议对(product_id, status)建立索引，以快速找到特定商品的未售码。同时对card_code+card_secret可加唯一索引以防重复。在发码时，通过order_id关联订单，可方便查询订单包含哪些卡密。已售和作废的卡密一般不修改，只是状态改变以及绑定订单。void_reason保留管理员作废备注。
5. order_main（订单主表） – 记录订单基本信息。
字段名
数据类型
描述

id
INT UNSIGNED
主键，订单ID

order_no
VARCHAR(50)
订单号（业务编号，对买家展示用）

buyer_id
INT UNSIGNED
买家用户ID（若买家注册则关联，否则为空）

buyer_email
VARCHAR(100)
买家邮箱（匿名购买时用于收取通知或查询验证）

product_id
INT UNSIGNED
商品ID（FK -> product.id）

quantity
INT
购买数量

unit_price
DECIMAL(10,2)
下单时商品单价（冗余存储价格快照）

total_amount
DECIMAL(10,2)
订单总金额（单位：元）

currency
VARCHAR(10)
货币单位（例如 'CNY'）

order_status
VARCHAR(20)
订单状态（例如：UNPAID待支付，PAID已支付已发货，PAID_MANUAL待人工，CLOSED已关闭等）

pay_channel
VARCHAR(20)
支付渠道（例如：ALIPAY, WECHAT 等）

client_ip
VARCHAR(45)
下单时买家IP地址

created_at
DATETIME
下单时间

paid_at
DATETIME
支付完成时间（支付成功时填）

closed_at
DATETIME
订单关闭时间（取消或退款时填）

updated_at
DATETIME
更新时间

remark
VARCHAR(255)
备注（人工处理说明，如异常原因等）

说明： order_no可考虑加唯一索引，便于通过订单号查询。order_status使用VARCHAR保存可读状态码（或用枚举型）。在支付成功后，order_status会更新为PAID，paid_at记录到账时间；如支付通知处理出现问题则为PAID_MANUAL并在remark注明原因；未支付超时关闭或管理员取消则状态CLOSED并填closed_at。pay_channel保存支付方式，当前可能只有"ALIPAY"一种，但设计上支持多种渠道。client_ip为记录防欺诈用途。buyer_email用来辅助匿名用户查询订单。对于订单涉及的卡密，可通过card_code表用order_id关联查询。
6. payment（支付记录表） – 记录与支付相关的详细信息。
字段名
数据类型
描述

id
INT UNSIGNED
主键，支付记录ID

order_id
INT UNSIGNED
关联订单ID（FK -> order_main.id）

pay_no
VARCHAR(50)
支付流水号（本地生成的支付请求编号，可与订单号相同或不同）

pay_channel
VARCHAR(20)
支付渠道（如 ALIPAY）

pay_status
VARCHAR(20)
支付状态（PENDING待支付, SUCCESS成功, FAILED失败等）

request_amount
DECIMAL(10,2)
请求支付金额

paid_amount
DECIMAL(10,2)
实际支付金额（到账金额）

platform_trade_no
VARCHAR(64)
第三方平台交易号（如支付宝交易号）

notify_status
VARCHAR(20)
通知处理状态（UNNOTIFIED未收到, PROCESSED已处理等）

notify_time
DATETIME
接收到通知时间（最后一次）

notify_raw
TEXT
原始通知内容（报文或JSON）

created_at
DATETIME
支付请求创建时间（下单时间）

updated_at
DATETIME
更新时间

说明： 通常一个订单对应一条支付记录，但设计上允许支付重试（比如第一次失败再支付），因此payment表与order_main表是1对1或1对多关系。pay_no可用于在本地标识一次支付请求（如果需要与第三方对账）；也可以直接使用order_no作为pay_no以减少字段。platform_trade_no是支付宝返回的交易号，用于对账查询等，长度可设为64以防止溢出（支付宝交易号一般是32位左右数字）。notify_raw保存支付平台发送的通知全文（可能包含签名等），用于调试或审计。对order_id建立索引，方便通过订单查支付信息。
7. operation_log（操作日志表） – 存储管理员重要操作和系统重要事件日志。
字段名
数据类型
描述

id
BIGINT UNSIGNED
主键，日志ID（可能很大用BIGINT）

operator_id
INT UNSIGNED
操作人用户ID（FK -> sys_user.id）

op_type
VARCHAR(50)
操作类型/事件类别（如 'LOGIN', 'IMPORT', 'SEND_CODE' 等）

target_type
VARCHAR(50)
操作对象类别（如 'PRODUCT', 'ORDER', 'CODE' 等）

target_id
INT UNSIGNED
操作对象ID（如对应的商品ID、订单ID等，没有则为NULL）

content
TEXT
操作详细内容（JSON或描述字符串）

ip
VARCHAR(45)
操作者IP（如管理员IP）

created_at
DATETIME
操作时间

说明： operation_log数据量增长较快，可按需定期归档老数据。content字段可以记录具体更改内容或事件详情，建议使用JSON格式便于机器分析。例如一次导入操作的content包括批次ID和统计结果JSON。当operator_id为空时表示系统自动操作（如定时任务）。op_type及target_type可以索引以便筛选某类操作日志。
5 接口设计
5.1 内部接口设计（模块间接口）
由于本系统采用单体架构，各模块通常通过函数调用或共享数据库状态交互。我们在设计时强调模块低耦合、高内聚，通过明确的接口规范使模块易于替换和扩展。以下列举部分核心模块接口：
支付模块接口：提供标准方法供订单模块调用和支付回调时调用。主要包括：
createPaymentRequest(orderNo, amount, options) -> payUrl：为指定订单创建支付请求，返回支付跳转URL或支付二维码链接。options可包含商品标题、描述以及returnUrl和notifyUrl等参数。在实现中，该接口封装对支付宝SDK的调用，对于不同支付渠道可以有不同实现。
verifyAndProcessNotification(params) -> result：验证支付平台通知数据并处理后续业务逻辑。内部会调用订单模块完成订单状态更新和卡密发放。result返回处理结果状态（如 success/ failure）。此接口由支付通知路由调用，实现幂等处理。
库存模块接口：供订单和管理模块使用的卡密库存操作方法：
checkStock(productId) -> count：查询某商品未售卡密数量，用于下单前校验库存。
allocateCodes(productId, quantity, orderId) -> codeList：为指定订单分配卡密。一般由支付成功后调用，确保线程安全和原子性。可在函数内部使用数据库事务和锁，将找到的codes更新状态并返回卡密列表。如果库存不足则抛出异常供上层处理。
importCodes(productId, file, operatorId) -> importResult：执行批量导入，返回导入统计结果。封装前面3.4节的导入逻辑。
voidCode(codeId, reason, operatorId)：将指定卡密作废，标记status=2并写void_reason。返回成功或失败状态。
订单模块接口：主要供前台控制器调用以及支付模块回调时使用：
createOrder(productId, quantity, buyerEmail, clientIp) -> orderNo：创建订单并返回订单号，内部会调用库存接口检查库存、写数据库、调用支付接口拿支付链接等。如果失败则抛出错误。
updateOrderStatus(orderNo, status, remark)：更新订单状态（用于取消订单或标记异常），内部包含必要的业务校验（如只有待支付订单才能取消等）。管理员后台进行人工操作（取消、标记已退款等）时通过此接口实现。
getOrderDetail(orderNo, email) -> orderDetail：查询订单详情，包含订单基本信息及卡密列表。买家查询订单时调用，需校验邮箱匹配（或其它验证方式）。管理员调用可省略邮箱验证并获取更多内部信息。
用户模块接口：主要是认证授权相关：
login(username, password) -> sessionToken：验证管理员登录，成功则建立会话（返回session令牌或设置cookie），失败则抛出登录异常。
checkPermission(user, action) -> bool：检查某用户是否有执行某操作的权限。后台每个敏感操作调用此接口，若返回false则拒绝执行。
logout(sessionToken)：退出登录，销毁会话。
日志模块接口：提供统一的日志记录入口：
log(operatorId, opType, targetType, targetId, content)：记录一条操作日志。各模块在关键操作后调用，如在订单模块订单创建成功后调用log(adminId, 'CREATE', 'PRODUCT', productId, {...})记录创建商品操作。
此外可以有queryLogs(criteria) -> logList供后台查询日志使用。
5.2 外部接口设计（支付接口）
外部接口主要指本系统与支付宝等第三方系统交互的接口，以及对用户开放的HTTP API等。在本项目中，最关键的外部接口是支付宝支付的对接。以下详细说明支付宝支付的相关接口设计：
支付宝网页支付接口接入：- 下单接口调用：系统通过支付宝提供的统一收单下单并支付页面接口(alipay.trade.page.pay)来发起支付。本质上，这不是本系统提供的HTTP服务，而是本系统作为客户端去请求支付宝的服务接口。为实现该调用，我们使用支付宝的Node.js SDK，其提供alipaySdk.exec(apiName, params, options)方法。我们构造业务参数bizContent，包括商户订单号(out_trade_no)、订单金额(total_amount)、订单标题(subject)等。此外，通过SDK的form表单对象设置同步跳转returnUrl和异步通知notifyUrl。特别地，notifyUrl必须是一个公网可访问的URL且不能包含自定义查询参数。在沙盒环境下，网关使用沙箱网关地址(https://openapi.alipaydev.com/gateway.do)。完成调用后，SDK返回一个支付页面的URL（或可直接生成HTML表单自动POST提交）。我们的系统将此URL提供给前端，前端跳转即可进入支付宝付款页面。 - 同步返回处理：我们在支付宝下单时指定了returnUrl，例如配置为https://<ourdomain>/order/complete。当用户支付完成后，支付宝会引导用户浏览器访问此URL并附带支付结果参数（如out_trade_no, trade_no等以及签名）。本系统需提供对应的HTTP GET接口来处理。例如：
app.get('/order/complete', (req, res) => {    const { out_trade_no, trade_no, trade_status } = req.query;    // 支付宝同步回调，不可靠，仅用于给用户展示结果    res.render('order_complete', { orderNo: out_trade_no });});
在该页面呈现时，并不以req.query的数据作为最终依据（因为同步回调可能被拦截篡改，也可能在支付尚未真正确认时触发）。我们主要利用out_trade_no让前端知道是哪一订单，可以在页面中通过Ajax轮询后端查询实际订单状态。在页面上告知用户“支付结果确认中”，然后请求我们的订单查询API获取该订单状态和卡密。只有当异步通知已处理完毕，查询API返回订单已支付，页面才会显示卡密。这样即使同步参数被篡改或提前到达，也不会导致错误发货。
异步通知接口设计：notifyUrl例如配置为https://<ourdomain>/api/pay/alipay/notify，对应我们系统中的支付模块通知路由（如3.4伪代码所示）。支付宝在支付完成后，会以POST请求调用此地址，Content-Type为application/x-www-form-urlencoded。通知参数包括：
out_trade_no（商户订单号，即我们生成的order_no）、
trade_no（支付宝交易号）、
trade_status（交易状态，如TRADE_SUCCESS）、
total_amount（订单金额）、
以及支付宝签名sign和签名算法sign_type等。我们的接口需要先从请求中解析出所有参数，然后按照支付宝签名规则使用事先配置的支付宝公钥进行验签。支付宝SDK通常提供alipaySdk.checkNotifySign(postData)来直接完成验签，只要在初始化SDK时提供了支付宝公钥。验签通过后，再检查订单号存在与金额匹配，然后进行后续发卡处理。
安全起见，我们可能还验证一下seller_id或app_id是否是本商户的，以防把别人的通知当成自己的（不过支付宝通常只把通知发给指定商户的notifyUrl）。处理完毕后，我们按照支付宝规定返回字符串success（HTTP 200响应，内容exactly为success），表示接收成功。
其他外部接口：目前系统仅涉及支付宝支付。若未来扩展出REST API供第三方查询订单或提交订单，需定义相应的外部接口文档，如开放某些GET/POST接口获取商品列表、下单（这相当于我们前台用的接口可以文档化）。在此项目范围内，未实现对公众开放的API，仅前端和支付交互。因此本节重点说明了支付对接部分。
6 用户界面设计
6.1 界面设计规范
本系统的用户界面设计遵循简洁直观、一致性和响应式布局的规范，具体原则如下：
统一风格与布局：前台和后台界面均采用统一的设计风格，以Bootstrap为基础样式框架，保证按钮、表单、表格等组件的一致性。配色上前台以清爽简洁为主，突出商品信息；后台界面偏中性专业风，突出功能模块。布局方面，桌面端采用自适应栅格布局，1366×768及以上分辨率下可正常显示，界面元素随窗口大小调整。前台主要内容区域居中显示，后台采用典型的左侧导航菜单+右侧内容区域布局，方便切换管理功能。
导航与信息架构：所有页面顶端设置清晰的导航栏。前台导航包括网站标题（或Logo）、商品分类（如有分类的话）和购物流程指引；后台导航栏突出系统名称及管理员身份，并提供菜单入口（商品管理、卡密管理、订单管理、统计报表等）。用户可以方便地在各主要功能页面之间切换。页面还包含面包屑导航指示当前位置（后台部分页面）。
表单与交互: 对于涉及用户输入的界面，如登录表单、下单数量输入、卡密导入上传等，遵循明확的标签和提示。表单控件右侧或下方提供校验反馈，例如输入格式错误时以红色提示文字告知。关键操作（如提交支付、删除商品、作废卡密）使用醒目的按钮并在交互上进行二次确认（比如点击“删除”按钮后弹出确认对话框，提示操作不可恢复）。所有确认框、提示信息使用简洁的语言，明确指出后果和解决办法。
响应与性能: 界面交互做到及时反馈。用户点击按钮后，如果操作可能较慢（如导入大文件），界面显示加载动画或进度条，防止用户误以为无响应。查询类功能提供加载指示器，数据列表超过一页时启用分页组件。采用AJAX的地方，错误情况下捕获异常并给出友好提示（如“网络异常，请重试”）。在保证体验的前提下简化页面元素，避免过多图片或脚本导致加载缓慢。敏感页面（登录页、支付结果页）确保在各种浏览器下功能正常，不依赖特定插件。
安全与表单设计: 前端对用户输入进行基本验证和过滤，防止明显的非法输入传到后台。同时利用HTML的required、type=email等属性简化校验。对于涉及密码、卡密等敏感信息的界面，采取隐藏或遮蔽措施：如管理员在查看卡密列表时，默认只显示部分内容，需要点击才显示完整（并在一定时间后重新遮蔽），以防止旁窥。界面上的所有输出内容都经过转义，以抵御XSS攻击。后台管理页面使用CSRF令牌机制，防止跨站请求伪造。在用户体验和安全之间取得平衡，既要易用也要安全。
6.2 主要界面流转（界面流图）
6.3 高保真界面原型

7 总结
从体系结构到模块划分，从数据库模式到接口协议，再到界面布局与交互细节，各方面均作了细致规划。通过Node.js + Express + MySQL这一成熟技术栈，我们设计了一个三层架构的Web应用，能够可靠地支撑数字商品的在线销售与自动发货需求。设计中特别关注了支付集成的流程安全，采用支付宝官方SDK和严格验签保障交易的可靠性；利用数据库事务、锁机制确保卡密分配的一致性和原子性；通过模块化和接口抽象提高系统的可扩展性（未来增加新支付方式或功能模块时影响最小）。
在非功能需求方面，设计贯彻了性能、安全、可用性的要求——采用InnoDB引擎和优化索引满足一定并发下的性能需求；多层次的安全措施（输入验证、权限控制、日志审计等）保护系统和用户数据；良好的UI/UX设计提升了可用性，减少出错率和学习成本。所有这些都为下一步的系统实现打下了坚实基础。
