---
title: tingshu
date: 2026-09-15 15:30:00
updated: 2026-09-15 17:56:20
categories: 技术
top_img: https://bu.dusays.com/2026/09/15/6aa91626c739c.webp
---

# tingshu 听书项目 · 面试深挖

> 本文以项目**真实源码**为依据，逐题对应四份面试题文件。<br>项目路径：`tingshu-parent`（JDK 17 / Spring Boot 3.0.5 / Spring Cloud 2022.0.2 / Spring Cloud Alibaba 2022.0.0.0-RC2）

---

## 0. 使用说明

### 0.1 本文的四种标记

| 标记 | 含义 | 使用场合 |
| --- | --- | --- |
| ✅ **面试就按这个说** | 标准口径，直接背框架 | 面试官问到时的第一反应 |
| ⚠️ **真实情况** | 代码里实际是这样，以及它的缺陷 | 面试官追问到底、或你自己想讲深度时 |
| 🔥 **高频** | 在 `企业真题.txt` 中出现 ≥8 次 | 优先级最高，必须准备 |
| ⛔ **别主动提** | 项目里根本没做，或做了会露怯 | 主动提了就是给自己挖坑 |

**核心心法**：面试是对话，不是背诵。**先把 ✅ 说出来，面试官追问再上 ⚠️**。<br>你主动暴露”我知道这里有问题，我准备了改进方案”，比被问穿强一百倍。

### 0.2 ⛔ 别主动提清单（项目里根本没做）

| 能力项 | 项目实际情况 | 被问到时怎么答 |
| --- | --- | --- |
| **Canal** | 代码里**没有任何 Canal**，是 RabbitMQ 双写 | “我们用的是 MQ 异步双写，Canal 我了解原理但项目没用” |
| **分库分表** | MySQL 未分库分表；只有 MongoDB 按 userId 分 collection | “MySQL 层面没做；MongoDB 我们按 userId 分了集合” |
| **K8S** | 无 | “K8S 了解概念，我们用的是 Docker + 脚本” |
| **超卖** | 听书项目是虚拟商品，**无库存** | “听书是虚拟商品没有库存，但我在商城项目里做过 Redis+Lua 扣库存” |
| **退款/退单** | `项目面试题.txt:54` 已答”无” | “当前版本不支持退款，设计上会走原路退回+对账” |
| **连续包月** | `项目面试题.txt:48` 已答”无” | 同上 |
| **若依/RuoYi** | 无（`企业真题.txt:227,434` 被问过） | “若依用过 demo，我们项目是自研脚手架” |
| **LangChain4j / AI** | 无 | ⚠️ 这是你简历上另一个项目的事，别往听书上扯 |
| **前端 Vue** | 无（`企业真题.txt:170-173,201` 高频问） | “能看懂、能调样式，独立开发前端不现实” |

### 0.2.1 ⛔⛔ 必须删掉的一句旧话术（否则一问就穿）

`项目面试题.txt:32-33` 里你原来准备的说法：

> 后端登录接口将 token 放到 **cookie** 中，但由于 cookie 默认不能跨域，所以将 cookie 放到前端请求的**请求头**中

**⚠️ 这句话有三个错误，务必从你的话术里删掉**（完整纠错见 **2.1.1**）：

| 错误 | 正确说法 |
| --- | --- |
| ① 以为小程序有 Cookie | **小程序没有 Cookie 机制**（没有容器、不自动携带），用的是 **Storage** |
| ② 因果倒置 | 后端把 token 放在**响应体 JSON**（不是 `Set-Cookie`）；小程序**只能**用请求头 |
| ③ “Cookie 不能跨域” | Cookie **可以**跨子域；跨站要配 `SameSite=None`。且**浏览器里 JS 也设不了 `Cookie` 请求头**（禁止修改的头） |

**一句话替换**：**“小程序没有 Cookie，token 是后端放响应体返回、前端手动存 Storage、再手动塞进请求头 `token` 字段。”**

### 0.3 面试前 60 分钟速览表

按顺序默念这 13 条，全部能张口就来即可上场：

1. 项目一句话 + 我的 4 个模块（登录 / 专辑详情 / 订单 / 搜索）
2. 微信登录流程：`code → openid → 查库 → 首登建档 → token 存 Redis → 返回`
3. 鉴权：自定义注解 `@GuiguLogin` + AOP + Redis 查 token + ThreadLocal 存 userId
4. **token 传递**：后端放**响应体** → 前端存 **Storage** → 请求封装**手动塞 header `token`** → 后端 `getHeader("token")`（**小程序没有 Cookie！**）
5. 缓存四问题：穿透=布隆、击穿=Redisson 锁、雪崩=随机 TTL、一致性=双写+延迟双删
6. 布隆过滤器：`RBloomFilter`、Redis bitmap、`tryInit(10万, 0.01)`、**只增不减、有误判**
7. 异步编排：`CompletableFuture` + 自定义线程池（core=3/max=5/队列3/AbortPolicy）
8. 线程池 7 参数 + 流转顺序：核心→队列→最大→拒绝
9. 订单防重：`trade()` 生成流水号存 Redis → `submitOrder` 用 **Lua 比对并删除**
10. 延迟关单：Redisson `RDelayedQueue`，30 分钟
11. 分布式事务：Seata AT，`@GlobalTransactional`（**注意：只用在 `saveUser`**）
12. 策略+工厂：`ItemTypeStrategy` 三种实现，`@Component("1001/1002/1003")`，Map 注入
13. MQ 可靠投递：confirm（到交换机）+ return（到队列）+ 手动 ack + 重试3次

### 0.4 高频题权重表（统计自 `企业真题.txt` 1578 行 / 约 150 家公司）

| 梯队 | 主题 | 频次 | 本文位置 |
| --- | --- | --- | --- |
| ★★★ | Redis（场景/持久化/淘汰/三问题/一致性/大key） | 30+ | 第3章 |
| ★★★ | MySQL（索引失效/B+树/explain/慢SQL/MVCC/回表） | 28+ | 第13章 |
| ★★★ | 线程池（7参数/流程/线程数/拒绝策略） | 20+ | 第10章 |
| ★★★ | Spring（IOC/AOP/自动配置/Bean生命周期/事务失效） | 20+ | 第12章 |
| ★★★ | 集合（HashMap/ConcurrentHashMap/ArrayList） | 18+ | 第12章 |
| ★★ | 登录鉴权 + token | 12+ | 第2章 |
| ★★ | 订单防重/超卖/订单号 | 11+ | 第4章 |
| ★★ | 策略+工厂模式 | 10+ | 第11章 |
| ★★ | 分布式锁 + Redisson 看门狗 | 10+ | 第3章 |
| ★★ | MQ（不丢失/幂等/顺序/积压） | 10+ | 第7章 |
| ★★ | 布隆过滤器 | 8+ | 第3章 |
| ★★ | CompletableFuture 异步编排 | 8+ | 第10章 |
| ★★ | Seata / 分布式事务 | 8+ | 第4章 |
| ★★ | ES（使用/一致性/倒排/深分页） | 8+ | 第6章 |
| ★★ | ThreadLocal（原理/泄漏） | 7+ | 第2章 |
| ★ | JVM（内存/GC/调优/OOM） | 15+ | 第14章 |
| ★ | Docker / Linux / Git | 12+ | 第16章 |

---

## 1. 项目介绍与开头话术

### 1.1 三个版本的自我介绍

**面试官原话**（`企业真题.txt:3` 浙江凯瑞博、`:689` 美团驻场、`:804` 京东、`:915` 上海人惠）

> 1、项目介绍　2、你自己负责的模块　3、项目有多少人　4、上线了吗

#### 版本 A：一分钟（自我介绍时用）

> 面试官你好，我叫 XX，有 X 年 Java 开发经验。<br>最近做的项目是一个**音频听书类的小程序**，后端是 **Spring Cloud Alibaba 微服务架构**，一共拆了 **10 个服务**，包括用户、专辑、订单、支付、账户、搜索、评论、直播等。<br>我在项目里主要负责**四个模块**：**微信登录鉴权**、**专辑详情**、**订单**、**搜索**，其中**订单模块是我主导的**。<br>技术上主要用了 **Redis（缓存+分布式锁+防重）、RabbitMQ（异步+延迟）、Elasticsearch（检索）、Seata（分布式事务）、XXL-JOB（定时任务）**。

#### 版本 B：三分钟（面试官说”详细讲讲”时用）

> 整个项目分为三层：<br>**① 网关层**：`server-gateway`，用 Spring Cloud Gateway 做统一路由；<br>**② 业务服务层**：9 个微服务，每个服务独立数据库；<br>**③ 公共层**：`common`（工具、日志、Rabbit、缓存切面）、`model`（实体/VO）、`service-client`（Feign 接口 + 降级实现）。
>
> **服务间调用**用 OpenFeign，**注册中心和配置中心**用 Nacos，**服务降级**用 Sentinel / Feign 的 fallback。
>
> 我负责的四个模块，分别讲一下亮点：
>
> **登录模块**：微信小程序登录，前端拿 code 换 openid，首登自动建档并初始化账户；token 存 Redis，用**自定义注解 + AOP** 做统一登录校验。
>
> **专辑详情模块**：这个接口要聚合 4 类数据（专辑基本信息、分类、主播、统计数据），原来是**串行 4 次远程调用**，我改成**自定义线程池 + CompletableFuture 异步编排**，把串行变并行；同时用 **Redis 缓存 + Redisson 分布式锁**解决缓存击穿。
>
> **订单模块**：支持购买 VIP、专辑、声音三类；做了**防重复提交、验签防篡改、余额支付、延迟关单**四件事。
>
> **搜索模块**：专辑上架时通过 MQ 异步同步到 ES，支持关键词检索、属性过滤、聚合分组、高亮、拼音补全。

#### 版本 C：十分钟（深挖时按模块展开）

按第 2、3、4、6 章顺序讲即可，每章开头都有一句话总述。

---

### 1.2 架构与 10 个服务职责

```text
                       ┌──────────────┐
     小程序 / H5  ────► │ server-gateway│  Spring Cloud Gateway
                       └──────┬───────┘
                              │  (Nacos 服务发现 + 路由)
     ┌────────────┬───────────┼───────────┬────────────┐
     ▼            ▼           ▼           ▼            ▼
service-user  service-album service-order service-payment ...
(用户/登录)    (专辑/声音)    (订单)       (微信支付)
     │            │           │           │
     ▼            ▼           ▼           ▼
   MySQL        MySQL       MySQL       MySQL
     +            +           +           +
  MongoDB     ES + MinIO   RabbitMQ    RabbitMQ
  (播放进度)   (检索/文件)   (延迟关单)  (支付回调)
```

| 服务 | 职责 | 关键技术 |
| --- | --- | --- |
| `server-gateway` | 统一入口、路由 | Gateway（⚠️ `AuthGlobalFilter` 是空实现） |
| `service-user` | 用户、登录、购买记录、VIP | AOP 鉴权、策略模式、MongoDB 播放进度 |
| `service-album` | 专辑、声音、分类、上传 | Redis 缓存、布隆过滤器、腾讯云 VOD、MinIO |
| `service-order` | 下单、订单查询、延迟关单 | Lua 防重、验签、Redisson 延迟队列 |
| `service-payment` | 微信支付 V3 | 微信支付 Java SDK |
| `service-account` | 余额、充值流水 | 原子扣减 |
| `service-search` | ES 检索、排行榜、自动补全 | ES Java Client、XXL-JOB |
| `service-comment` | 评论、点赞 | MySQL |
| `service-live` | 直播房间、WebSocket | Redis Pub/Sub + WebSocket |
| `service-dispatch` | 定时任务调度 | XXL-JOB |

---

### 1.3 「你们项目和喜马拉雅有什么区别 / 独特点是什么」

**面试官原话**（`企业真题.txt:1457` 中品一号）

> 上来问了，你们听书项目的独特点，与喜马拉雅的不同点，有没有自己独特点

这题很阴——面试官在试探你是不是**真的做了这个项目**。**不要**去贬低或对比功能（你比不过喜马拉雅），要**转到技术实现**上：

> 业务形态上我们确实是一个垂直领域的听书平台，和喜马拉雅这种大平台功能上有差距，我们更聚焦在**付费专辑的购买转化**上。<br>技术上有两个我们做得比较认真的点：<br>**第一，专辑详情这个接口的聚合**。它要拿 4 类数据，我用了自定义线程池 + CompletableFuture 做并行，把响应时间压下来了。<br>**第二，订单的资金安全**。我们做了三层：前端传签名防篡改、Redis + Lua 防重复提交、余额扣减用带条件的 update 保证不会超扣。

---

### 1.4 「项目做了多久 / 几个人 / 上线了吗」

**面试官原话**（多处）

- `企业真题.txt:636` 中科软：**“这个项目挺简单的，为什么做了一年，感觉两个月就做出来了啊？”**
- `企业真题.txt:638` 中科软：**“一年还没上线，客户不催吗？”**
- `企业真题.txt:1321` 弋云科技二面：**“项目上线了吗？项目上线了吗？项目上线了吗？”**
- `项目面试题.txt:38-39` 你原来的回答：*“我离开公司的时候项目已经处于测试阶段了，至于有没有上线，我离职后没有关注，不是很清楚”*

⚠️ **上面这个回答是减分回答**。它传递的信号是：① 你没参与上线；② 你对结果不关心；③ 可能在掩饰。

#### ✅ 建议这样答

> 项目是 **X 个月**，团队 **1 个后端负责人 + 3 个后端 + 1 前端 + 1 测试**，我负责登录、专辑详情、订单、搜索四个模块。
>
> 上线情况我如实说：我在职期间完成了开发、自测和联调，**灰度环境跑通了全流程**；正式全量上线是在我交接之后，我走之前把部署脚本和接口文档都补齐了。
>
> （如果被追问”为什么做这么久”）<br>主要时间不是在写 CRUD，而是在**微服务拆分和中间件接入**上：10 个服务的数据库拆分、Nacos 配置、Seata 接入、ES 索引设计，还有大量联调。前期架构评审来回改了几轮。

**关键**：**别撒谎说上线了**（会被追问 QPS、用户量、线上事故，你答不上来），也别说”不清楚”。要说\*\*”我做到了哪一步 + 我交接了什么”\*\*。

---

## 2. 登录与鉴权

> **一句话总述**：微信小程序拿 code 换 openid，首登自动建档并初始化账户，生成 token 存 Redis；前端把 token 存小程序 Storage 并手动塞进请求头；后端用「自定义注解 + AOP」统一校验登录态，userId 存 ThreadLocal。

> **本章结构**：<br>2.1 登录全流程 → **2.1.1 token 传递机制（前端+后端全链路、Cookie 纠错、H5 对比、”token 怎么构成”）** → 2.2 AOP 鉴权 → 2.3 token 有效期与续期 → 2.4 首登初始化（MQ vs Seata）→ 2.5 ThreadLocal 泄漏 → 2.6 JWT 对比 → 2.7 速查表

### 2.1 🔥 微信小程序登录全流程

**面试官原话**（`企业真题.txt:651` Kmerit、`:888` 赛福、`:935` 中科软、`:1050` 上海宸汐、`项目面试题.txt:28`）

**代码位置**：`WxLoginApiController#wxLogin:88-135`

```java
// WxLoginApiController.java:88-134
@GetMapping("/wxLogin/{code}")
public Result wxLogin(@PathVariable("code") String code) throws Exception {
    //1 拿着 code + appid + 秘钥 请求微信服务器接口，返回 openid
    WxMaJscode2SessionResult sessionInfo =
            wxMaService.getUserService().getSessionInfo(code);
    String openid = sessionInfo.getOpenid();

    //2 根据 openid 判断是否第一次登录
    LambdaQueryWrapper<UserInfo> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(UserInfo::getWxOpenId, openid);
    UserInfo userInfo = userInfoService.getOne(wrapper);

    //3 如果第一次登录，添加用户信息
    if (userInfo == null) {
        userInfo = new UserInfo();
        userInfo.setNickname("听友" + System.currentTimeMillis());
        userInfo.setAvatarUrl("https://.../default_handsome.jpg");
        userInfo.setWxOpenId(openid);
        userInfoService.saveUser(userInfo);   // ← 内部含初始化账户，见 2.4
    }

    //4 生成 token，存 Redis，key 是 token，value 是用户信息
    String token = UUID.randomUUID().toString().replaceAll("-", "");
    redisTemplate.opsForValue().set(token, userInfo, 3000, TimeUnit.HOURS);

    //5 返回 token
    HashMap<String, Object> map = new HashMap<>();
    map.put("token", token);
    return Result.ok(map);
}
```

#### ✅ 面试就按这个说

> 微信小程序登录分五步：<br>**①** 前端调 `wx.login()` 拿到临时 **code**；<br>**②** 前端把 code 传给后端，后端用 **code + appid + secret** 调微信的 `code2Session` 接口；<br>**③** 微信返回 **openid**（用户在本小程序的唯一标识）和 session\_key；<br>**④** 用 openid 查用户表：**存在**说明不是首次登录；**不存在**说明首次，就新建用户并**初始化账户**；<br>**⑤** 生成 token（UUID），**以 token 为 key、用户信息为 value 存 Redis**，把 token 返回给前端；前端之后放在**请求头**里带回。

### 2.1.1 🔥🔥 「token 怎么从前端传到后端」+ Cookie 认知纠错

**面试官原话**

- `企业真题.txt:1056` 上海宸汐：**“token 怎么从前端传到后端”**
- `企业真题.txt:144` 花糖房：**“用户登陆的 token 是怎么构成的”**
- `企业真题.txt:98` 泽宇天河二面：**“app 中 token 存哪”**
- `企业真题.txt:626` 北京瀚海博瑞：**“token 信息都存的什么”**
- `项目面试题.txt:32-33` 你自己写过：**“cookie 默认不能跨域访问，所以将 cookie 存放请求头中”**

---

#### ⛔⚠️ 首先纠错：上面这句话是错的（两个错误叠在一起）

`项目面试题.txt:32-33` 里的说法：

> 后端登录接口会生成一个 token 存储在 redis 中…并将 token 存储在请求的 **cookie** 当中，**cookie 默认不能跨域访问，所以将 cookie 存放请求头中**

⚠️ **风险等级：★★★★★**。这句话**听起来很专业，但一问就穿**，因为它是”半懂不懂”的典型特征。它有两个错误：

**错误 1：微信小程序里根本没有 Cookie 这套机制**

Cookie 是**浏览器**的东西，它是「HTTP 头（`Set-Cookie` / `Cookie`）+ 浏览器**自动存储** + 浏览器**自动携带**」的一整套机制。**小程序不是浏览器**，它没有这个能力：

|  | 浏览器 Cookie | 小程序 |
| --- | --- | --- |
| 存储 | 服务器 `Set-Cookie`，**浏览器自动存** | **没有 Cookie 容器**，服务器返回 `Set-Cookie` 会被忽略 |
| 携带 | 同源请求**自动带上** | **不会自动带**，必须手动塞 header |
| API | `document.cookie` | **`wx.setStorageSync` / `wx.getStorageSync`** |
| 本质 | **自动** | **手动** |

**小程序对应的是本地缓存（Storage）**，而 Storage 是「**你自己写代码存、自己写代码取**」，和 Cookie 的”自动”完全是两码事。所以”Cookie 放在请求头里”这个动作**在小程序里根本不存在**——**能放进请求头的东西，就不是 Cookie 了**。

⚠️ **补充一个浏览器侧的事实**：即使是浏览器，**JS 也无法设置 `Cookie` 请求头**（它是[禁止修改的头](https://developer.mozilla.org/docs/Glossary/Forbidden_header_name)，浏览器会忽略你的设置）。所以”把 cookie 放到请求头里”这句话，**在浏览器里也做不到**。这就更能说明这个说法是背串了。

**错误 2：因果关系倒置了**

| 你背的说法 | 实际情况 |
| --- | --- |
| 后端把 token 放进 **Cookie** | 后端把 token 放在**响应体 JSON**里 |
| 因为 Cookie **不能跨域**，所以挪到请求头 | 小程序**压根没有 Cookie**，所以**只能用请求头** |

看后端源码 `WxLoginApiController.java:126-134`：

```java
//3 生成token，把数据放到redis里面
redisTemplate.opsForValue().set(token, userInfo, 3000, TimeUnit.HOURS);

//4 返回token
HashMap<String, Object> map = new HashMap<>();
map.put("token", token);         // ← ★放在【响应体】里，不是 Set-Cookie
return Result.ok(map);
```

**后端从头到尾没碰过 Cookie**——没有 `response.addCookie()`，没有 `Set-Cookie` 头，没有 `HttpSession`。token 是通过 **JSON 响应体**回到前端的。

**错误 3（附带）：”Cookie 不能跨域”本身也是半错的**

- Cookie **可以**跨子域（`Domain=.example.com`）；
- 真正跨站时需要 **`SameSite=None; Secure`**；
- 还有 **CORS** 层面：要后端配 `Access-Control-Allow-Credentials: true` + `Access-Control-Allow-Origin` 不能为 `*`。
- **最根本的是：我们项目里这个问题根本不存在**，因为小程序不发 Cookie。

---

#### ✅ 面试就按这个说（**标准答案**）

> 我们是**微信小程序**，所以要先说清楚一点：**小程序没有浏览器的 Cookie 机制**——它没有 Cookie 容器，服务器返回 `Set-Cookie` 会被忽略，也不会自动携带。所以 token 必须**手动传递**。
>
> **完整链路四步**：<br>**① 后端下发**：登录接口把 token 放在**响应体的 JSON** 里返回（`Result.ok(map)`，`map.put("token", token)`），**不是 `Set-Cookie`**。<br>**② 前端存储**：小程序拿到后**手动存到本地缓存**（`wx.setStorageSync('token', token)`），同时在全局状态（Pinia store）里存一份**内存副本**。**存两份**是为了：本地缓存用于**小程序重启后恢复登录态**，内存副本用于**读取**。<br>**③ 前端携带**：每次请求，在**统一封装的 request 模块**里把 token 取出来，放进**请求头的 `token` 字段**。<br>**④ 后端校验**：AOP 切面里用 `request.getHeader("token")` 取出来，去 Redis 查。

**注意**：前后端 header 名是**硬编码的字符串约定**——前端写 `token`，后端 `getHeader("token")`，**写错一个字母就全部 401**。

---

#### 📄 源码证据（前端，可指给面试官看）

项目的前端产物在 `前端模版\mp-weixin\`（uni-app 编译后的微信小程序，编译前工程路径是 `D:/workspace/front/ListenToBooks-master`）。

**① 存 token（小程序 Storage，不是 Cookie）** —— `stores/user.js:37-47`

```javascript
// 获取token
async getToken(code) {
  const res = await api_user_user.user.getLogin(code);
  if (res.data.token) {
    // ★ 手动存到小程序本地缓存（不是 Cookie！）
    common_vendor.index.setStorageSync(utils_constant.TOKEN_KEY, res.data.token);
    this.token = res.data.token;      // ★ 内存副本
  }
}
```

其中 `utils/constant.js:3` 定义了 key 名：

```javascript
const TOKEN_KEY = "token";
```

**② 小程序启动时从 Storage 恢复 token** —— `stores/user.js:8-14`

```javascript
state: () => {
  return {
    user: JSON.parse(common_vendor.index.getStorageSync(utils_constant.USER_KEY) || "{}"),
    token: common_vendor.index.getStorageSync(utils_constant.TOKEN_KEY),   // ★ 恢复
    amount: 0
  };
}
```

**③ ★核心：token 放进请求头的那一行** —— `utils/request.js:7-27`

```javascript
class Service {
  api(opts) {
    if (!opts.method)
      opts.method = "GET";
    opts.loading = opts.loading !== false;

    const token = stores_user.useUserStore().token;   // ← 从 store 取内存副本
    const header = {
      token,                                          // ← ★★★ 就是这一行 ★★★
      "Content-type": "application/json; charset=UTF-8"
    };

    return new Promise((resolve, reject) => {
      common_vendor.index.request({
        url: BASEURL + opts.url,
        data: opts.data,
        method: opts.method,
        header,                                       // ← 传入请求
        ...
```

**关键设计**：`Service` 类是所有请求的**唯一出口**（`get`/`post`/`put`/`delete` 都调 `api()`），所以 **token 注入只在这一处**，不用每个接口写一遍——这是”统一封装请求”的价值。

**④ 后端对接** —— `GuiGuLoginAspect.java:43-44`

```java
String token = request.getHeader("token");     // ← 和前端 header 名对齐
```

**⑤ 退出登录时清理** —— `stores/user.js:91-99`

```javascript
logout() {
  common_vendor.index.removeStorageSync(utils_constant.TOKEN_KEY);   // 清本地
  common_vendor.index.removeStorageSync(utils_constant.USER_KEY);
  this.user = {};
  this.token = "";                                                   // 清内存
  common_vendor.index.navigateTo({ url: "/pages/index/index" });
}
```

---

#### ✅ 追问：「token 是怎么构成的 / token 里存了什么？」

**花糖房原题**（`企业真题.txt:144`：**“用户登陆的 token 是怎么构成的”**）

⚠️ **这是最容易答错的一题**，因为大多数人会去联想 JWT（`header.payload.signature` 三段式）。**但我们的 token 是个裸 UUID，没有任何结构！**

```java
// WxLoginApiController.java:123-124
String token = UUID.randomUUID().toString().replaceAll("-", "");   // 32位十六进制
```

> **✅ 这样答**：
>
> 要分两种情况说，因为\*\*”token 的构成”取决于用的是哪种 token\*\*：
>
> **① 我们项目用的是「随机字符串 token」（opaque token）**<br>token 就是 `UUID.randomUUID()` 去掉横线，**32 位十六进制随机串**，本身**不包含任何信息**，就是一个”**取件码**“。<br>**真正的用户信息存在 Redis 里**：`key = token`，`value = 用户信息对象`。<br>后端收到 token 后**拿它当 key 去 Redis 查**，查到就知道是谁。
>
> **② 另一种是 JWT，它是有结构的**，由 `.` 分成三段：
>
> - **Header**：`{"alg":"HS256","typ":"JWT"}` → Base64；
> - **Payload**：用户信息 + 标准声明（`sub` 用户、`exp` 过期时间、`iat` 签发时间）→ Base64；
> - **Signature**：`HMACSHA256(base64(header) + "." + base64(payload), secret)`。<br>特点是**信息自包含**——服务端不用存，验签就能信任；但**无法主动失效**（见 2.6）。
>
> ⚠️ **注意**：JWT 的 Header 和 Payload **只是 Base64 编码，不是加密**！任何人都能解开看到内容。**所以 JWT 里绝对不能放密码、手机号这类敏感信息**——这就是为什么”JWT 安全”是个误解，它只保证”**没被篡改**“，不保证”**没被看到**“。

#### ✅ 追问：「我们 Redis 里 value 存的是什么？」

```java
redisTemplate.opsForValue().set(token, userInfo, 3000, TimeUnit.HOURS);
//                                  ↑ 整个 UserInfo 对象
```

⚠️ **这里有个可以主动讲的优化点**：

> 我们把**整个 `UserInfo` 对象**序列化后存进了 Redis。这样做的问题是：<br>**① 数据冗余**：用户改个昵称，Redis 里的副本就旧了，要额外处理一致性；<br>**② 敏感信息**：`UserInfo` 里有 `wxOpenId`，**不应该缓存在随时可能被 dump 的地方**；<br>**③ 大 key 风险**：如果 UserInfo 字段多，每个 token 一条，**Redis 内存占用会很高**。
>
> **✅ 更好的做法**：**Redis 里只存 `userId`**（甚至只存一个”该 token 有效”的标记），需要用户信息时**按 userId 查缓存**（`user:info:{userId}`）。<br>这样：**token → userId** 和 **userId → 用户信息** 分成两层，**职责清晰、避免冗余、也方便用户信息变更时统一刷新**（改一次 `user:info:{userId}` 就全局生效）。

---

#### ✅ 追问：「H5 场景下你们会怎么传 token？和现在有什么区别？」

**这题是你原答案里”合理内核”的正确展开方式**。原答案的问题就是**把 H5 的结论硬套到小程序上**。

> **H5 / 前后端分离的常见做法是：token 放 `Authorization` 请求头**（比如 `Authorization: Bearer xxx`），**不用 Cookie**。原因有三个：
>
> | 理由 | 说明 |
> | --- | --- |
> | **① 防 CSRF** | **这是最重要的**。Cookie 是**浏览器自动携带**的——用户被诱导点一个恶意链接，请求就会**自动带上 Cookie**，服务端无法分辨。而**请求头必须由 JS 显式设置**，攻击者跨站伪造不了 → **天然免疫 CSRF** |
> | **② 跨域更简单** | Cookie 跨域要配 `SameSite=None; Secure` + CORS 的 `Allow-Credentials` + `Domain`，还容易踩坑；**请求头只需要后端在 CORS 里允许这个头** |
> | **③ 不受限制** | Cookie 有 **4KB 大小限制**和**每域名数量限制**，而且会自动附加到**所有**同源请求（包括图片、静态资源），浪费带宽 |
>
> **和小程序对比**：
>
> - **相同点**：最终**都是放在请求头里传**；
> - **根本不同点**：**H5 是”可以选 Cookie 但选了 header”，小程序是”没有 Cookie 所以只能 header”**。
>
> **所以”因为跨域才用 header”这个说法只适用于 H5，套到小程序上是错的。**

#### ✅ 追问：「Cookie 和 Storage 有什么区别？」

|  | Cookie | 小程序 Storage |
| --- | --- | --- |
| 存储位置 | 浏览器内部 | 小程序本地文件 |
| 谁写入 | 服务器 `Set-Cookie` / JS `document.cookie` | **只有 JS 能写** |
| 谁携带 | **浏览器自动**附加到同源请求 | **必须手动塞 header** |
| 容量 | **约 4KB** | **单 key 1MB，总 10MB** |
| 过期 | 可设 `Expires`/`Max-Age` | **永久**（除非主动删），需要自己管理有效期 |
| 安全性 | 可设 `HttpOnly`（JS 读不到，防 XSS 盗取） | **JS 完全可读**，XSS 能直接偷走 |
| 跨端 | 浏览器专有 | 小程序/App |

> ⚠️ **一个值得主动提的安全点**：Cookie 有 **`HttpOnly`** 标志，能让 **JS 读不到 Cookie**，这样即使被 XSS 注入也偷不走凭证。**而小程序 Storage 没有这个保护**——`getStorageSync` 谁都能调。<br>所以小程序场景下，**防 XSS 的责任完全在前端代码本身**（不渲染不可信内容、不用 `eval`）。这也是小程序相对安全的原因之一：**小程序没有 DOM，渲染层和逻辑层隔离，XSS 面比 H5 小很多**。

#### ⚠️ 我们前端代码里的两个小问题（可以主动讲，显示你真读过代码）

**问题 1：token 为空时也会塞进 header**

`request.js:12` 直接取 token，未登录时 `getStorageSync` 返回空串，header 会变成 `{ token: "" }`，发了一个没意义的请求。

> **✅ 改进**：
>
> ```javascript
> const header = { "Content-type": "application/json; charset=UTF-8" };
> const token = stores_user.useUserStore().token;
> if (token) header.token = token;      // 有才加
> ```

**问题 2：登录失效处理里，跳转和记录顺序反了**

`request.js:33-48` 收到 `code == 208` 时：

```javascript
common_vendor.index.redirectTo({ url: `/pages/login/login` });   // 先跳转（异步）
utils_utils.setRedirectUrl();                                     // 后记录
```

`redirectTo` 是**异步**的，应该在**跳转之前**先 `setRedirectUrl()`，否则可能记录不准确。

> **✅ 改进**：**先记录，再跳转**，保证登录后能正确回到原页面。

---

#### ✅ 追问：「openid 和 unionid 区别？」

✅

> **openid** 是用户**在单个小程序/公众号内**的唯一标识，同一用户在不同小程序里 openid 不同；<br>**unionid** 是用户在**同一个微信开放平台账号下所有应用**的唯一标识，需要把小程序绑定到开放平台才会返回。<br>我们只做单小程序，用 openid 就够了；如果以后要做公众号 + 小程序账号打通，就必须用 unionid。

#### ✅ 追问：「session\_key 你存了吗？有什么用？」

⚠️ **真实情况**：代码里**只取了 openid，session\_key 完全没用**。

✅ 标准答法：

> `code2Session` 返回的 `session_key` 是用来**解密微信加密数据**的，比如获取用户手机号（`getPhoneNumber`）、获取用户昵称头像。<br>我们项目拿手机号那一步没做，所以 session\_key 没落库。<br>⚠️ 如果要做，**session\_key 绝对不能返回给前端**，服务端应该和 openid 一起存 Redis，并**设置有效期**——因为微信的 session\_key 会失效，需要用 `wx.checkSession` 校验。

---

### 2.2 🔥 自定义注解 + AOP 实现登录鉴权

**面试官原话**（`企业真题.txt:625` 北京瀚海博瑞、`:796` 群思科技、`:1133` 高伟达、`项目面试题.txt:57`）

**代码位置**：`GuiGuLoginAspect#login:34-82`、注解 `@GuiguLogin`

```java
// GuiGuLoginAspect.java:34-82
@Around("execution(* com.atguigu.tingshu.*.api.*.*(..)) && @annotation(guiguLogin)")
public Object login(ProceedingJoinPoint joinPoint, GuiguLogin guiguLogin) throws Throwable {
    //1 从请求头获取 token
    ServletRequestAttributes attributes =
        (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
    HttpServletRequest request = attributes.getRequest();
    String token = request.getHeader("token");

    //2 required=true 必须登录
    boolean isRequired = guiguLogin.required();
    if (isRequired) {
        if (StringUtils.isEmpty(token)) {
            throw new GuiguException(ResultCodeEnum.LOGIN_AUTH);
        }
        UserInfo userInfo = (UserInfo) redisTemplate.opsForValue().get(token);
        if (userInfo == null) {
            throw new GuiguException(ResultCodeEnum.LOGIN_AUTH);
        }
    }

    //3 有 token 就解析出 userId 放进 ThreadLocal
    if (!StringUtils.isEmpty(token)) {
        UserInfo userInfo = (UserInfo) redisTemplate.opsForValue().get(token);
        if (null != userInfo) {
            AuthContextHolder.setUserId(userInfo.getId());
        }
    }

    return joinPoint.proceed();
}
```

#### ✅ 面试就按这个说

> 我用**自定义注解 + AOP** 做的统一登录校验。<br>**①** 定义了 `@GuiguLogin` 注解，有个 `required` 属性：`true` 表示必须登录（比如下单），`false` 表示可登录可不登录（比如首页，登录了要展示”已购买”标识）。<br>**②** 写了一个 `@Around` 切面，切入点是 `注解标注的方法`。<br>**③** 切面里从**请求头拿 token**，去 **Redis 查**，查不到就抛自定义异常；查得到就把 **userId 放进 ThreadLocal**，业务代码直接从 ThreadLocal 取当前用户，不用每个方法都传 userId。

#### ⚠️ 真实情况：这里有 3 个问题

**问题 1：Redis 被查了两次**

```java
// 第 57-58 行：required 分支查了一次
UserInfo userInfo = (UserInfo) redisTemplate.opsForValue().get(token);
// 第 69-70 行：又来一次
UserInfo userInfo = (UserInfo) redisTemplate.opsForValue().get(token);
```

> **✅ 改进**：合并成一次查询，把结果缓存到局部变量。

**问题 2：token 直接做 Redis key，没有业务前缀**

`RedisConstant.java:38` 定义了 `USER_LOGIN_KEY_PREFIX = "user:login:"`，但 `GuiGuLoginAspect.java:67` 那行**被注释掉了**，实际用的是**裸 token 做 key**。

> **✅ 改进**：加前缀 `user:login:{token}`。好处：① 能在 Redis 里按前缀批量扫；② 避免和其他业务的 key 撞。

**问题 3：`RequestContextHolder.getRequestAttributes()` 可能是 null**

在 MQ 消费端、`@Async` 线程里会拿到 null，直接强转会 **NPE**。

> **✅ 改进**：加判空，取不到就跳过（`FeignInterceptor` 里就做了这个判空，见 8.3）。

#### 追问题：「AOP 有几种代理方式？什么时候用哪个？」

**面试官原话**（`企业真题.txt:456` 联科云创、`:721` 美团驻场、`:406` 及乐魔方）

✅

> **两种**：<br>**① JDK 动态代理**：基于接口，`Proxy.newProxyInstance()` 生成实现类的代理。要求**目标类必须实现接口**。<br>**② CGLIB 动态代理**：基于继承，生成**目标类的子类**并重写方法。不要求接口，但**不能代理 final 类和 final 方法**。
>
> **Spring AOP 的选择规则**：默认**有接口就用 JDK，没接口就用 CGLIB**；Spring Boot 2.x 之后**默认强制用 CGLIB**（`spring.aop.proxy-target-class=true`）。
>
> 我们项目里 `@GuiguLogin` 切的是 Controller（没实现接口），`@GuiGuCache` 切的是 ServiceImpl（继承 `ServiceImpl`），**都是 CGLIB**。

#### 追问题：「AOP 失效的场景？」

✅ 最经典的三种：

1. **同类内部方法自调用** —— `this.method()` 不经过代理对象，切面不生效；<br>→ 解决：注入自己 / `AopContext.currentProxy()` / 拆到另一个 Bean。
2. **方法不是 public** —— CGLIB 无法重写，切面失效。
3. **对象不是 Spring Bean** —— `new` 出来的对象没被代理。

> 我在项目里踩过第 1 个：`AlbumInfoServiceImpl.getAlbumInfo()` 上标了 `@GuiGuCache`，但它内部调 `getAlbumInfoData()` 是私有方法，所以缓存是生效的（因为入口是 `getAlbumInfo`）；但如果谁在类里直接调 `getAlbumInfo2()`，缓存注解就不会生效。

---

### 2.3 🔥🔥 token 的有效期、续期与多端登录（★最高风险题）

**面试官原话**

- `企业真题.txt:1034` 京北方：**“token 过期时间怎么解决”**
- `企业真题.txt:144-147` 花糖房：**“用户登陆的 token 是怎么构成的？你们允许用户多端登录吗？如何防止多端登录？单端登录功能如何实现”**
- `企业真题.txt:555-557` 中科铭天：**“你们 token 用的 uuid，用户量有多大，会有重复的情况吗？redis 中用户信息过期时间是多少？如果我 10 点登录了，12 点再登录，token 是什么情况”**
- `企业真题.txt:98` 泽宇天河二面：**“app 中 token 存哪”**
- `企业真题.txt:1056` 上海宸汐：**“token 怎么从前端传到后端”**
- `企业真题.txt:626` 北京瀚海博瑞：**“token 信息都存的什么”**

#### ⚠️⚠️ 首先，你的面试记录里这题答”过头”了

`项目面试题.txt:5-6` 你写的是：

> token 过期时间如何处理<br>**在登录的切面类中会存储 redis 中的 token 进行查看还有多长时间过期，到达一定时间会对存储在 redis 中的数据进行续期，类似于看门狗机制**

**但代码里完全不是这样**：

| 你的说法 | 代码实际 |
| --- | --- |
| 切面类里查剩余时间 | `GuiGuLoginAspect` **没有任何查 TTL 的代码** |
| 到期续期 | **没有续期逻辑**（`RedisConstant.USER_LOGIN_REFRESH_KEY_PREFIX` 定义了但**从未被引用**） |
| 类似看门狗 | **看门狗是 Redisson 锁的机制，和 token 无关** |

**真实的 TTL 在登录接口里**：

```java
// WxLoginApiController.java:126-128
redisTemplate.opsForValue().set(token, userInfo, 3000, TimeUnit.HOURS);
//                                              ↑ 3000 小时 = 125 天
```

而 `RedisConstant.java:40` 又定义了一个**完全没被用上的**常量：

```java
public static final int USER_LOGIN_KEY_TIMEOUT = 60 * 60 * 24 * 100;  // 100 天
```

**⚠️ 风险等级：★★★★★**。面试官只要问一句”**续期写在哪一行**“，这个说法就崩了。

---

#### ✅ 面试就按这个说（**推荐口径：诚实 + 有改进**）

> 我们的 token 是一个 **UUID**（去掉横线），**以 token 为 key、用户信息为 value 存 Redis**，设置了**很长的固定过期时间**，这样用户不会用着用着被踢下线。
>
> 这个设计我后来复盘觉得有问题，**长固定 TTL 有两面性**：<br>**好处**是体验好，不会频繁登录；<br>**坏处**是 token 一旦泄露，在有效期内一直可用，而且**Redis 里堆了大量不活跃用户的 token 占内存**。
>
> **如果是现在让我重做，我会用”滑动续期 + 双 token”**：<br>**① 滑动续期**：用户每次访问时，如果发现剩余有效期小于阈值（比如剩 1 天），就 `EXPIRE` 重置为 7 天。这样活跃用户不掉线，不活跃用户自然过期。<br>**② 双 token**：`access_token` 短（2 小时，放请求头），`refresh_token` 长（7 天，单独存）；access 过期时用 refresh 换新的。这是 OAuth2 的标准做法。

**这样答的好处**：既说出了真实实现，又展示了你知道正确做法，还**主动承认了不足**。面试官通常会顺着问”那滑动续期怎么做”——那是你准备好的领域。

---

#### ✅ 追问题 1：「10 点登录，12 点再登录，token 是什么情况？」

**这是中科铭天问的原题**，考的是你**有没有设计过多端/多会话**。

我们代码的实际行为：**两次登录生成两个不同的 token，Redis 里两条记录并存，两个 token 都有效**。

> **✅ 答题框架**（分三种产品策略答，显示你有设计思维）：
>
> **策略一：允许多端并存（我们当前的实现）**<br>每次登录都生成新 token，旧的**不删**。用户在手机、平板可以同时在线。<br>**实现**：直接 `set(token, userInfo)`，最简单。<br>**缺点**：账号被盗后，攻击者的 token 会一直有效，用户改密码都不知道踢谁。
>
> **策略二：单端登录（后登录踢前登录）**<br>登录时**先删掉这个用户所有的旧 token**，再存新的。<br>**实现**：Redis 里额外维护一个 `user:token:{userId}` 的 **Set 或 String**，存当前有效的 token；<br>登录时先 `GET user:token:{userId}` 拿到旧 token → `DEL` 旧 token → `SET` 新 token。<br>用 **Lua 脚本**保证”查旧+删旧+存新”三步原子的。
>
> **策略三：限制设备数（比如最多 3 台）**<br>用 **Hash** 或者 **ZSet** 存：`key = user:token:{userId}`，`field = 设备指纹/deviceId`，`value = token`。<br>超过上限时按登录时间淘汰最早的（用 ZSet 的 score 存时间戳，`ZREMRANGEBYRANK` 删最旧的）。

---

#### ✅ 追问题 2：「token 用 UUID，用户量大了会有重复吗？」

**中科铭天原题**。这题考**概率常识**，要答得有理有据：

> **不会有实际重复**。UUID v4 是 122 位随机数，空间是 2^122 ≈ 5.3×10^36。
>
> 用**生日悖论**估算：要产生碰撞概率达到 50%，大约需要 √(2 × 2^122 × ln2) ≈ **2.3×10^18** 个 UUID。<br>就算一个系统每秒生成 **10 亿**个 UUID，也要**跑 73 年**才到 50% 碰撞概率。
>
> 我们系统日活几万，生成量差了十几个数量级，**碰撞在实际中不可能发生**。
>
> 不过**如果真要求绝对唯一**（比如订单号），我们会用**雪花算法**（`IdType.ASSIGN_ID`），它靠”机器ID + 时间戳 + 序列号”保证**严格单调唯一**，而且**有序**，比 UUID 更适合做数据库主键（UUID 无序会导致 B+ 树页分裂）。

> 💡 **加分点**：主动提”**UUID 做 MySQL 主键性能差**“——因为它随机，插入时会导致 B+ 树频繁页分裂和随机 IO。我们订单表的主键用的是雪花算法。

---

### 2.4 ⚠️ 首登时「初始化账户」：MQ 还是 Seata？（★面经与代码矛盾）

**面试官原话**（`企业真题.txt:1111` 中科软二面：**“seata 是干嘛的？解决了什么问题”**；`:683` 南京华为外包：**“Seata 是在项目中做什么的？有哪几种模式？”**）

#### ⚠️ 你说的和代码不一致

`项目面试题.txt:31` 你写的是：

> 不存在说明是第一次登录，这个时候会将用户信息添加到用户表中 **且使用 rabbitmq 发送消息异步的方式初始化用户账户信息**

`面试题纯文本.txt:60-64` 也写了两条路：

> 第一种 异步实现，使用 RabbitMQ 发送消息异步实现<br>第二种 同步实现，添加用户信息之后，直接远程调用初始化账户，**分布式事务保证不同数据库数据一致性**

**代码真相**：

```java
// WxLoginApiController.java:112-118  ← 注意 116-118 行
userInfoService.saveUser(userInfo);        // ← 实际走的是这条（同步 + Seata）
//调用方法添加

//发送mq消息异步初始化账户
//rabbitService.sendMessage(MqConstant.EXCHANGE_USER,   ← ★被注释掉了
//                          MqConstant.ROUTING_USER_REGISTER,
//                          userInfo.getId());
```

```java
// UserInfoServiceImpl.java:257-268
@GlobalTransactional          // ← 全项目唯一的分布式事务注解！
@Override
public void saveUser(UserInfo userInfo) {
    this.save(userInfo);                              // 用户库：插入用户
    userAccountFeignClient.initUser(userInfo.getId()); // 账户库：初始化账户
}
```

而 MQ 的消费者**还在，但已经没有生产者了**：

```java
// AccountReceiver.java:24-35  ← 消费者存在，但没人给它发消息了
@RabbitListener(bindings = @QueueBinding(
        exchange = @Exchange(value = MqConst.EXCHANGE_USER, durable = "true"),
        value = @Queue(value = MqConst.QUEUE_USER_REGISTER, durable = "true"),
        key = {MqConst.ROUTING_USER_REGISTER}))
public void receive(Long userId, Message message, Channel channel) {
    if (userId != null) {
        userAccountService.initUserAccount(userId);
    }
    channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
}
```

#### ✅ 面试就按这个说（**说同步 Seata 版本，因为它是真在跑的**）

> 首次登录要写**两个库**：`service-user` 写用户表，`service-account` 写账户表。这是**跨服务的写操作**，本地事务管不了，所以我们用 **Seata 的 AT 模式**。
>
> 流程是：`saveUser` 方法上加 **`@GlobalTransactional`**，它作为**全局事务发起方**；里面先插用户，再通过 **Feign 调 `initUser`** 初始化账户。<br>Seata 的 **TC（事务协调者）** 会给两个分支都生成 **undo\_log**，任何一步失败，TC 就通知所有分支**用 undo\_log 反向补偿回滚**。
>
> AT 模式的好处是**对业务代码零侵入**——我不用写补偿逻辑，Seata 靠**解析 SQL 前后镜像**自动生成回滚语句。

#### ✅ 追问题：「那为什么还写过 MQ 的方案？两者怎么选？」

**这题一定要准备**，因为面试官可能追问”你到底是哪个”。

> 我们**两种方案都实现过**，最后**切到了 Seata 同步方案**，MQ 那条路保留在代码里但没启用。
>
> **两者对比**：
>
> | 维度 | MQ 异步 | Seata AT 同步 |
> | --- | --- | --- |
> | **一致性** | 最终一致，中间有窗口期 | **强一致**（全局锁 + 补偿） |
> | **性能** | 好，登录接口不阻塞 | 差，要等分支事务 + 全局锁 |
> | **复杂度** | 要处理消息可靠性、幂等 | 引入 TC 组件，有单点和性能开销 |
> | **用户体验** | 首登后马上查余额可能查不到 | 保证能查到 |
>
> **为什么选 Seata**：首登是**低频操作**（一个用户一辈子一次），用性能换一致性划算；而且**用户首登后立刻就要看账户余额**，异步会有窗口期体验不好。
>
> **如果让我重新选**，我会考虑**本地消息表**方案：在用户库里加一张消息表，和用户插入**放在同一个本地事务**里，然后异步投递。这样**既保证不丢消息，又不用引入 Seata 的全局锁开销**——这就是”**最大努力通知 + 本地消息表**“的思路。

⚠️ **注意**：如果你不确定面试官会不会追问到底，**可以只说 Seata 版本**，别主动提 MQ。因为一旦提了 MQ，就要解释”为什么消费者还在”。

---

### 2.5 🔥🔥 ThreadLocal 内存泄漏与跨用户污染（命中率最高的隐藏杀题）

**面试官原话**

- `企业真题.txt:1569-1571` 猎聘：
  > **ThreadLocal 为什么会有内存泄漏问题？怎么解决？正确声明方式？Thread 和 ThreadLocalMap 是什么关系？ThreadLocal 内存泄露场景**
- `企业真题.txt:889-891` 赛福科技（快手外包）：
  > **对 ThreadLocal 的生命周期是怎么管理的？现在 ThreadLocal 是与当前线程绑定的，如果同一个用户并发请求是怎么隔离的？这种情况下，会不会把线程池打爆？**
- `企业真题.txt:1149` 高伟达：**“threadlocal 本地线程在哪些场景下使用，有哪些问题，如何规避”**
- `企业真题.txt:648` 中科软：**“线程局部变量的使用场景”**
- `企业真题.txt:59` 上海科旭：**“说说 threadLocal 实现了哪些功能”**
- `企业真题.txt:668` 南京华为外包：**“threadlocal 底层原理”**

#### 代码位置与真相

```java
// AuthContextHolder.java:6-33
public class AuthContextHolder {
    private static ThreadLocal<Long> userId = new ThreadLocal<Long>();
    private static ThreadLocal<String> username = new ThreadLocal<String>();

    public static void setUserId(Long _userId) { userId.set(_userId); }
    public static Long getUserId() { return userId.get(); }
    public static void removeUserId() { userId.remove(); }        // ← 定义了
    public static void setUsername(String _username) { username.set(_username); }
    public static String getUsername() { return username.get(); }
    public static void removeUsername() { username.remove(); }     // ← 定义了
}
```

```java
// GuiGuLoginAspect.java:65-82
if (!StringUtils.isEmpty(token)){
    UserInfo userInfo = (UserInfo) this.redisTemplate.opsForValue().get(token);
    if (null != userInfo){
        //  存储用户Id
        AuthContextHolder.setUserId(userInfo.getId());   // ← 第73行：只 set，没有 remove
    }
}

Object obj = joinPoint.proceed();                        // ← 第78行
return obj;                                              // ← 方法结束，没有清理！
```

**⚠️ 两个真实缺陷（风险 ★★★★★）**：

1. **`removeUserId()` / `removeUsername()` 定义了（`AuthContextHolder.java:19,31`），但全项目没有任何地方调用**（已全量 grep 确认，仅 `service-live` 有个同名的 `removeUserIdToLiveRoom`，是无关方法）
2. **切面在 `proceed()` 之后没有清理 ThreadLocal**

⚠️ **影响面很广**：`AuthContextHolder.getUserId()` 被 **9 个 Controller 消费**（分布在 account / album / user / payment / order 五个服务），包括下单、查询余额、查订单列表等**和钱、和个人数据相关**的接口。一旦发生串号，后果是**用户看到别人的订单和余额**。

#### ⚠️ 为什么这是严重 bug（要能讲出现象）

Tomcat 用的是**线程池**，线程是**复用**的。所以：

```text
请求 A（用户 1001）→ Tomcat 线程 T1 → setUserId(1001) → 处理完 → 线程 T1 回到池里（userId 还是 1001！）
请求 B（未登录）   → 复用线程 T1 → getUserId() → 拿到 1001  ← ⚠️ 跨用户数据污染！
```

**线上现象**：

- **未登录用户拿到了别人的 userId**，可能看到别人的订单、收藏；
- 内存泄漏：`ThreadLocalMap` 的 Entry 是 `WeakReference<ThreadLocal>`，key 会被回收，但 **value 是强引用**，只要线程不死，value 就一直挂着 → 积累成 OOM。

#### ✅ 面试就按这个说

> 我们用 ThreadLocal 存当前登录用户的 userId，业务代码可以直接 `AuthContextHolder.getUserId()` 取，不用层层传参。
>
> **底层结构**：每个 `Thread` 里有一个 `ThreadLocalMap`，`key` 是 `ThreadLocal` 对象本身，`value` 是我们要存的值。所以 ThreadLocal 是**以线程为维度隔离数据**的，天然线程安全。
>
> **内存泄漏的原因**：`ThreadLocalMap` 的 Entry 继承 `WeakReference<ThreadLocal>`，所以 **key 是弱引用**（下一次 GC 会被回收），但 **value 是强引用**。当 ThreadLocal 对象被回收后，key 变成 null，但 value 还在，而 `ThreadLocalMap` 的生命周期**跟着 Thread 走**——线程池里的线程**永不销毁**，这些 value 就一直堆积 → 内存泄漏。
>
> **正确用法**：**用完必须 `remove()`**。所以规范是 `try { set(); ... } finally { remove(); }`。

#### ⚠️ 但这里有个关键补充（**这才是拉开差距的地方**）

> 不过我要补充一点：**在 Web 场景下，光靠 `remove()` 不够，因为还有”跨用户污染”问题**。
>
> 我刚才说的泄漏是”value 回收不掉”。但更危险的是：**Tomcat 线程复用**。线程 A 处理完用户 1001 的请求后没有清理，线程回到池里；下一个请求（可能是个未登录用户）复用这个线程，`getUserId()` 就会**拿到 1001** —— 这是**业务数据错乱**，比内存泄漏严重得多。
>
> **所以规范应该是**：在切面里做 **`set` 和 `remove` 配对**：
>
> ```java
> try {
>     AuthContextHolder.setUserId(userId);
>     return joinPoint.proceed();
> } finally {
>     AuthContextHolder.removeUserId();   // ← 必须在 finally 里清理
> }
> ```
>
> **回到我们项目**：我们 `AuthContextHolder` 里**定义了 `removeUserId()` 方法，但切面里没有调用**——这是我后来 code review 时发现的一个隐患，如果并发压力大、线程被复用，是会出现用户身份串号的。

💡 **这样答的威力**：面试官会觉得你**不只是背了八股，而是真的在项目里发现了问题**。这比背标准答案高一个层次。

#### ✅ 追问题：「ThreadLocal 为什么用弱引用 key？改成强引用行不行？」

> **用弱引用的目的是”多一层保护”**：如果外部对 ThreadLocal 的强引用没了（比如方法执行完），至少 key 能被回收，避免 ThreadLocal 对象本身泄漏。<br>但**改成强引用会更糟**——那样 key 和 value 都回收不掉，泄漏更严重。
>
> **弱引用不能解决根本问题**，因为 value 还是强引用。**根本解法只有一个：手动 `remove()`**。<br>另外 JDK 在 `set/get` 时会顺带清理 key 为 null 的 Entry（`expungeStaleEntry`），但这只是**兜底**，不能依赖它。

#### ✅ 追问题：「线程池场景下 ThreadLocal 会有什么问题？会不会把线程池打爆？」

**赛福科技原题**，考得很深。

> **两个问题**：<br>**① 数据污染**：线程复用导致上一个人的数据留给下一个人（前面说过）。<br>**② 父子线程传递失效**：`ThreadLocal` **不支持继承**，主线程 set 的值，**子线程读不到**。这也是我们 `FeignInterceptor` 里那个注释说”异步编排与 MQ 消费者端为 null”的根本原因。
>
> **解决方案**：
>
> - **跨线程传递**用 **`InheritableThreadLocal`**——但它只在**创建子线程时**拷贝一次，**线程池里的线程是复用的，创建时机早就过去了**，所以在线程池场景下**依然失效**。
> - **正确方案**是用阿里开源的 **`TransmittableThreadLocal`（TTL）**，它配合 `TtlExecutors` 包装线程池，能在**任务提交时**把上下文快照传过去。
>
> **至于”会不会把线程池打爆”**：ThreadLocal 本身**不会**直接打爆线程池，因为它只是一个 Map 挂在线程上。但如果：
>
> - 每个请求存的数据很大（比如整个 UserInfo 对象），线程数又多，**内存**会被吃掉；
> - 代码里依赖 ThreadLocal 判空来做逻辑，污染后可能触发**死循环或大量重试**，间接把池打满。<br>所以还是要 `remove()`。

---

### 2.6 为什么选 token + Redis，而不是 JWT？

**面试官原话**（`企业真题.txt:893` 赛福科技）

> **为什么会选择 token+redis，不选择 JWT**

✅ **标准答法**（要讲到”能主动失效”这个本质区别）：

> 核心区别是**状态存哪**和**能不能主动失效**。
>
> **JWT** 是**无状态**的：用户信息直接编码在 token 里，服务端**不用存储**，验签就完事。优点是**不依赖 Redis、天然支持分布式**。<br>但它有个**致命缺点：无法主动失效**。因为服务端不存状态，用户改密码、被封号、要踢下线，**已经签发的 JWT 在过期前依然有效**——除非再引入一个 Redis 黑名单，那就又变成有状态了。
>
> **我们选 Redis 存 token**，因为听书项目有这些需求：<br>**① 能踢下线**（账号异常可以立刻失效）；<br>**② 能拿实时数据**（用户信息改了，Redis 里一改全局生效，JWT 得等过期）；<br>**③ 能续期**（滑动过期在 Redis 里一个 `EXPIRE` 就搞定）。
>
> **代价**是每次请求都要查 Redis。但我们本来就用 Redis 做缓存，**多查一次 key 成本很低**，而且 Redis 扛得住。

#### ✅ 追问题：「Redis 挂了，是不是所有用户都要重新登录？」

> 是的，**Redis 单点故障会导致全部用户掉线**。所以我做了两件事：<br>**① Redis 本身做高可用**——主从 + 哨兵，哨兵负责故障自动切换；<br>**② 如果对可用性要求更高，可以用 JWT + Redis 混合**：JWT 保证 Redis 挂了还能验签通过（降级放行），Redis 负责记录”哪些 token 被主动吊销”。

---

### 2.7 第 2 章追问链速查

| 追问 | 答题要点 |
| --- | --- |
| openid vs unionid | 单应用 vs 开放平台下全应用 |
| session\_key 干嘛的 | 解密加密数据（手机号），不能给前端，要设过期 |
| **小程序有 Cookie 吗** | **没有**！Cookie 是浏览器专有；小程序用 Storage（手动存、手动带） |
| **“Cookie 不能跨域所以放 header”对吗** | **错**。因果倒置 + 场景错。小程序压根没 Cookie；H5 用 header 是为了**防 CSRF** |
| **token 怎么从前端传到后端** | 后端放**响应体 JSON** → 前端存 **Storage** → request 封装里**手动塞请求头 `token`** → 后端 `getHeader("token")` |
| **token 怎么构成** | 我们是**裸 UUID**（32位hex），**不含任何信息**，靠 Redis 反查；JWT 才是三段式（且 Payload 只是 Base64，非加密） |
| token 存哪 | 前端（**Storage + store 副本**）+ 后端（Redis，key=token，value=用户信息） |
| token 怎么传 | 请求头 `token` 字段（不是 Authorization，我们自定义的） |
| 为什么不用 `Authorization` 头 | 我们自定义的 `token` 头，前后端硬编码约定；标准化做法是 `Authorization: Bearer` |
| **Cookie vs Storage** | 自动 vs 手动；4KB vs 1MB；Cookie 有 `HttpOnly` 防 XSS 盗取，Storage 没有 |
| **H5 怎么传 token** | 放 `Authorization` 头，主因**防 CSRF**（Cookie 会被浏览器自动携带，header 必须 JS 显式设置） |
| **JWT 安全性** | 只保证**不被篡改**，不保证**不被看到**（Header/Payload 只是 Base64）；不能放敏感信息 |
| **Redis 里该存什么** | 我们存了整个 UserInfo（冗余+敏感）；**更好是只存 userId**，用户信息单独用 `user:info:{id}` 缓存 |
| token 过期怎么办 | 滑动续期 / 双 token（access + refresh） |
| 多端登录 | 三种策略：并存 / 踢前一个 / 限制设备数（Redis Set/ZSet + Lua） |
| UUID 会重复吗 | 生日悖论，2^122 空间，实测不可能；但做主键要用雪花算法 |
| ThreadLocal 原理 | Thread → ThreadLocalMap → Entry(WeakRef key, strong value) |
| ThreadLocal 泄漏 | key 弱引用被回收、value 强引用挂在线程上；`finally { remove() }` |
| 线程池下的 ThreadLocal | 数据污染 + 跨线程传递失效；用 TTL |
| JWT vs token+Redis | 无状态 vs 可主动失效 |
| AOP 代理方式 | JDK（有接口）vs CGLIB（无接口，Spring Boot 默认） |
| AOP 失效场景 | 自调用、非 public、非 Bean |
| 网关 vs AOP 鉴权 | 见 8.2 |

---

## 3. 专辑详情与缓存（Redis 主战场）

> **一句话总述**：专辑详情接口要聚合多类数据，我用 Redis 做缓存 + 布隆过滤器防穿透 + Redisson 分布式锁防击穿，并用自定义注解 + AOP 把缓存逻辑从业务代码里抽出来。

### 3.1 🔥 缓存穿透、击穿、雪崩、一致性（必考题）

**面试官原话**

- `企业真题.txt:103` 软通动力：**“什么是缓存击穿、缓存穿透、缓存雪崩以及解决方案”**
- `企业真题.txt:994` 恒生宝泰、`:783` 点众科技、`:836` 人品科技、`:237` 天津行至简
- `企业真题.txt:1007` 东吴软件：**“如何解决缓存雪崩，不能只答设置缓存随机过期时间？”** ← 这题是陷阱
- `企业真题.txt:400` 神州信息：**“缓存击穿和缓存穿透的区别”**

#### ✅ 标准答法（先讲区别，再讲方案）

> **三者的核心区别是”数据存不存在”和”热点与否”**：
>
> | 问题 | 场景 | 本质 | 我的方案 |
> | --- | --- | --- | --- |
> | **穿透** | 查一个**根本不存在**的数据（如 id=-1） | 请求绕过缓存**直打 DB** | **布隆过滤器** + **空值缓存** |
> | **击穿** | **某个热点 key 突然过期** | 大量并发**同时回源**同一个 key | **分布式锁**（Redisson） |
> | **雪崩** | **大批 key 同时过期** 或 **Redis 宕机** | 请求**全量**打到 DB | **随机过期时间** + 高可用 + 限流降级 |
>
> **穿透**：攻击者用不存在的 id 疯狂请求，缓存不命中、DB 也查不到，DB 被压垮。<br>我们用了两层：**① 布隆过滤器**在入口就挡掉（见 3.2）；**② 空值缓存**兜底。
>
> **击穿**：某个热点专辑的缓存到期，1 万个请求同时发现缓存没了，一起查 DB。用**分布式锁**保证只有一个线程回源，其他线程等待后直接读缓存。
>
> **雪崩**：比如我们晚上 12 点批量预热了 1000 个专辑，TTL 都是 10 分钟，那 12:10 会同时失效。所以**过期时间要加随机值**。

#### ⚠️ 真实情况：我们的实现有 3 个缺陷

**缺陷 1：空值缓存根本写不进去**

```java
// GuiGuCacheAspect.java:63-68
if (null == obj){
    // 并把结果放入缓存
    Object o = new Object();
    this.redisTemplate.opsForValue().set(key, null, 10, TimeUnit.MINUTES);  // ← set 的是 null！
    return null;
}
```

⚠️ **`redisTemplate.set(key, null)` 在 Spring Data Redis 里会直接抛 `IllegalArgumentException`**（或者被序列化器拒掉），**根本不会写入**。而且上面 `new Object()` 创建了却没用。

> **✅ 改进**：改成存一个**哨兵值**：
>
> ```java
> redisTemplate.opsForValue().set(key, "", 60, TimeUnit.SECONDS);  // 空字符串占位，TTL 短一点
> ```
>
> 或者用 `Optional`/自定义的 `NullValue` 枚举，反序列化时判断。

**缺陷 2：击穿的”自旋”是无上限递归**

```java
// GuiGuCacheAspect.java:77-80
} else {//获取锁失败，自旋
    //  没有获取到锁的用户自旋
    return cacheAspect(joinPoint);   // ← 自己调自己！没有次数限制
}
```

⚠️ 这是**方法递归**，不是真正的自旋。如果加锁的线程处理很慢，其他线程会**不断递归压栈** → **StackOverflowError**；即使不溢出，也会产生大量无效调用，把 CPU 打满。

> **✅ 改进**：三种方案，按推荐度排序：<br>**① 等待重试（推荐）**：`rLock.tryLock(3, 5, SECONDS)` 本身就会**阻塞等待 3 秒**，等不到说明持锁线程有问题，此时**应该直接查库兜底**，而不是递归。<br>**② 有限次自旋**：加个重试计数，超过 N 次直接 `joinPoint.proceed()` 查库。<br>**③ 逻辑过期（最优）**：缓存 value 里存一个 `expireTime` 字段，**key 永不过期**。发现逻辑过期时，开一个**异步线程去重建缓存**，当前请求**直接返回旧数据**。这样完全没有等待，热点数据也不会有”空窗期”。

**缺陷 3：所有 key 用同一个锁粒度**

`rLock = redissonClient.getLock(key + ":lock")` 这个是对的（按 key 加锁，粒度够细）。这点没问题。

#### ✅ 追问题：「东吴软件说’不能只答设置随机过期时间’，雪崩还有哪些解法？」

**这是拉开差距的题**：

> **随机 TTL 只能解决”同时过期”这一种雪崩**。雪崩还有两个原因：
>
> **① Redis 集群宕机**（最严重）：
>
> - **事前**：主从 + 哨兵 / Cluster 保证高可用；
> - **事中**：**本地缓存兜底**（Caffeine/Guava，存最热的数据，Redis 挂了还能撑一会儿）；
> - **事后**：**限流 + 熔断降级**（Sentinel），直接返回兜底数据，保护 DB 不被打死。
>
> **② 热点 key 被集中访问**（热 key 问题）：
>
> - **多级缓存**：本地缓存 → Redis → DB；
> - **热 key 打散**：把 `hot:album:1` 复制成 `hot:album:1:0` ~ `hot:album:1:9`，随机取一个，把压力分散到多个 Redis 节点；
> - **读写分离 + 多副本**。
>
> **③ 缓存预热**：系统启动或大促前，**提前把热点数据加载进缓存**，避免冷启动时全部打 DB。

#### ✅ 追问题：「缓存一致性怎么保证？」

**面试官原话**（`企业真题.txt:181` 美亚柏科、`:72` 通忆睿、`:148` 维思陆、`:530` 航天曌朗、`:1067` 中科辅龙）

> 怎样保证数据库和缓存的一致性 / **cannel 是先删缓存，还是先修改数据库呢**

✅

> 我们用的是\*\*”先更新 DB，再删除缓存”（Cache-Aside）**，配合**延迟双删\*\*。
>
> **为什么是”删除”而不是”更新”缓存？**<br>**①** 更新缓存可能写完就没人读（**写多读少场景是浪费**）；<br>**②** 并发更新时，两个线程的”更新缓存”顺序可能和”更新 DB”顺序相反，导致**脏数据**。删除则只会导致一次 cache miss，下次读自然回源到正确值。
>
> **为什么是”先 DB 后缓存”？**<br>如果是”先删缓存再更新 DB”，在删除后、DB 更新前的窗口里，**读请求会把旧值又加载回缓存** → 不一致。<br>先更新 DB 再删缓存，出现不一致的概率**极低**（需要读请求恰好发生在”DB 已更新、缓存未删除”之间，且这个读还比写慢）。
>
> **延迟双删**：`删缓存 → 更新DB → 休眠一会儿 → 再删缓存`。<br>第二次删除是为了**兜底**：万一在”更新 DB”期间有读请求把旧值加载回缓存，第二次删除能清掉。休眠时间一般是**读业务耗时 + 几百毫秒**。

#### ⚠️ 关于 Canal：⛔ 别主动提

`企业真题.txt:149` 维思陆问了”**cannel 是先删缓存，还是先修改数据库呢**“，`面试题纯文本.txt:110` 你自己写了”canal 或者延迟双删解决一致性”。

**但代码里根本没有 Canal**。如果面试官顺着问”你 Canal 怎么配的、binlog 用的什么格式”，就露馅了。

**如果你确实想讲 Canal**（因为它确实是高频考点），用这个口径：

> 我们项目用的是**延迟双删**。Canal 我了解原理，但项目里没用。<br>Canal 的思路是：**伪装成 MySQL 的从库**，订阅 master 的 **binlog**（需要 `ROW` 格式），解析出数据变更后投递到 MQ，消费者再去删缓存。<br>它的好处是**和业务代码解耦**——不用在代码里写删除逻辑，DB 一变就自动同步。<br>**代价**：要额外维护 Canal Server（有单点问题）、binlog 必须开 ROW 格式（**会增加日志量**）、还有**延迟**。<br>面试官您问的”先删缓存还是先改库”，其实 **Canal 是把这个问题绕开了**——它监听的是**已经提交**的 binlog，所以不存在”删缓存和改库的顺序”问题，天然更安全。

---

### 3.2 🔥🔥 布隆过滤器全解（含恒天瑞讯三连问）

**面试官原话**

- `企业真题.txt:20` **恒天瑞讯**：
  > **布隆过滤器讲一下，它的数组数据储存在哪里？存热点专辑还是全部专辑，你们专辑 id 什么数据格式（挺慢的，很大的位图）**
- `企业真题.txt:116` 软通动力：**“布隆过滤器缓存的数据一定存在吗？为什么”**
- `企业真题.txt:549` 东软汉和：**“布隆过滤器怎么解决缓存穿透的，他的缺点”**
- `企业真题.txt:618` 柯莱特（快手）：**“布隆过滤器：底层如何实现，如何解决哈希冲突”**
- `企业真题.txt:702` 美团驻场：**“布隆过滤器查的值全 1 一定命中吗？”**
- `企业真题.txt:1564` 星辰纪元：**“布隆过滤器是在内存中使用吗？重启会导致数据丢失吗”**
- `企业真题.txt:910` 上海人惠：**“Redisson 框架布隆过滤器（项目中有使用到）”**

#### 代码位置

```java
// ServiceAlbumApplication.java:38-53  ← 启动时预热
@Override
public void run(String... args) throws Exception {
    //1 创建布隆过滤器
    RBloomFilter<Object> bloomFilter =
            redissonClient.getBloomFilter(RedisConstant.ALBUM_BLOOM_FILTER);
    //2 设置布隆过滤器预计元素个数和期望误判率
    bloomFilter.tryInit(100000, 0.01);
    //3 查询所有专辑id，把所有专辑id放到布隆过滤器里面
    List<AlbumInfo> list = albumInfoService.list();
    for (AlbumInfo albumInfo : list) {
        Long albumId = albumInfo.getId();
        bloomFilter.add(albumId);
    }
}
```

```java
// AlbumInfoApiController.java:78-89  ← 查询时判断
@GetMapping("getAlbumInfo/{albumId}")
public Result<AlbumInfo> getAlbumInfo(@PathVariable Long albumId) {
    //添加布隆过滤器判断
    RBloomFilter<Object> bloomFilter =
            redissonClient.getBloomFilter(RedisConstant.ALBUM_BLOOM_FILTER);
    if(!bloomFilter.contains(albumId)) {
        throw new GuiguException(228, "专辑不存在:" + albumId);
    }
    AlbumInfo albumInfo = albumInfoService.getAlbumInfo(albumId);
    return Result.ok(albumInfo);
}
```

#### ✅ 面试就按这个说（**回答恒天瑞讯的三个子问题**）

**子问题 1：「数组数据存储在哪里？」**

> 我们用的是 **Redisson 的 `RBloomFilter`**，它底层是**基于 Redis 的 bitmap 实现的**——也就是说，**位数组存储在 Redis 里**，不是 JVM 内存里。
>
> 这么做的好处是：<br>**① 多实例共享**——我们 `service-album` 可能部署多个节点，如果放在 JVM 内存里，`local` 的过滤器互不可见，还会有一致性问题；<br>**② 重启不丢**——放在 Redis 里，服务重启后数据还在。<br>（⚠️ 但要补充：**如果 Redis 没有开持久化，Redis 重启后 bitmap 就没了**。所以严格说，它的持久性取决于 Redis 的 RDB/AOF 配置。）

**子问题 2：「存热点专辑还是全部专辑？」**

> 存**全部专辑**。因为它的作用是**防止”查不存在的 id”穿透到数据库**，必须覆盖全集——只存热点的话，非热点的不存在 id 依然会打到 DB。
>
> 我们的初始化是**在 `CommandLineRunner` 里全量加载**：`albumInfoService.list()` 把所有专辑 id 塞进去。

**子问题 3：「专辑 id 什么数据格式？」**

> 是 **`Long` 类型**（MyBatis-Plus 的雪花算法主键）。Redisson 会把它序列化成字节数组再做多次 hash。

**子问题 4（隐含）：「很大的位图，会不会慢？」**

> 我们初始化参数是 **`tryInit(100000, 0.01)`**：**预计 10 万个元素、误判率 1%**。<br>根据布隆过滤器的公式，位数组长度 `m ≈ -n·ln(p) / (ln2)² `，带入 n=10万、p=0.01：<br>`m ≈ -100000 × ln(0.01) / 0.4805 ≈ 958,506` 位 ≈ **117 KB**。<br>哈希函数个数 `k = (m/n)·ln2 ≈ 6.6`，取 **7 个**。
>
> **所以位图只有 117 KB 左右**，在 Redis 里微不足道。**增加一个元素的代价是 7 次 hash + 7 次 setbit**，都是 O(1)。`contains` 同理。**性能完全不是问题**。

#### ✅ 追问：「布隆过滤器查的值全 1，一定命中吗？」

**美团驻场原题，这是核心考点**：

> **不一定！这正是布隆过滤器的本质。**
>
> - **说不存在，一定不存在**（因为如果存在，它的 k 个位置一定都是 1）→ **零假阴性**；
> - **说存在，可能不存在**（因为那些位置可能是**其他元素**置的 1）→ **有假阳性（误判）**。
>
> 我们设置误判率 1%，意味着**查 100 万个不存在的 id，大约会有 1 万次误判**，这 1 万次会穿透到 DB。<br>但因为它是\*\*”挡在缓存前面的第一道闸”**，把 99% 的无效请求挡掉了，剩下的 1% 再用**空值缓存\*\*兜底。

#### ✅ 追问：「缺点是什么？」

> **① 有误判率**（上面说的），无法做到 100% 准确；<br>**② 不支持删除**。因为一个位可能被多个元素共享，你没法确定删了之后别人还准不准。\*\*<br>变种方案是 **Counting Bloom Filter**（把每个位换成计数器），但会**占用几倍空间**，还有计数溢出问题。<br>**③ 需要预估元素数量**。如果实际元素远超 `tryInit` 的预期值，误判率会**急剧上升**。<br>我们的场景下专辑数量会增长（`tryInit` 写死 10 万），所以**更好的做法是用”可扩容布隆过滤器”**，或者**定期重建**。

#### ⚠️⚠️ 真实缺陷：新增专辑不 `add`，会被判”不存在”（风险 ★★★★★）

看代码就能发现：

```java
// AlbumInfoServiceImpl.saveAlbumInfo:74-131（保存专辑）
@Transactional
public void saveAlbumInfo(AlbumInfoVo albumInfoVo) {
    albumInfoMapper.insert(albumInfo);          // ← 插入专辑
    ...
    rabbitService.sendMessage(...);             // ← 发 MQ 上架
    // ⚠️ 这里没有 bloomFilter.add(albumInfo.getId())
}
```

**布隆过滤器只在应用启动时预热一次**。所以：

```text
运营新上架一张专辑 id=99999
  → DB 里有这条数据了
  → 但布隆过滤器没 add
  → 用户访问 /getAlbumInfo/99999
  → bloomFilter.contains(99999) 返回 false
  → 抛异常 "专辑不存在:99999"   ← ⚠️ 新专辑"消失"了！
```

**这是一个真实的生产级 bug**，而且现象很诡异（新专辑访问不了，重启服务又好了，因为重启会重新预热）。

> **✅ 改进方案**：<br>**① 最小改动**：在 `saveAlbumInfo` 成功、**事务提交后**调用 `bloomFilter.add(albumId)`。<br>**② 更稳妥**：不依赖启动预热，改成**异步任务定时重建**（比如每小时全量 `add` 一次），或者用 `@Scheduled` 做增量补偿。<br>**③ 最优**：用**可扩展布隆过滤器**（Redisson 支持 `RClusteredBloomFilter`，但要注意它的空间开销），或者直接**换成 Cuckoo Filter**（支持删除）。
>
> ⚠️ 但要注意一个细节：**`add` 必须放在事务提交之后**。如果放在事务里，事务回滚了但过滤器已经 add 了，就会造成”过滤器说有、DB 里没有”，虽然不会漏数据，但会**多一次无效的 DB 查询**。

#### ✅ 追问：「布隆过滤器重启会丢吗？」

**星辰纪元原题**：

> 取决于**位数组存在哪**：
>
> - 我们用的是 **Redis 版（`RBloomFilter`）**，所以 **服务重启不丢**（数据在 Redis）；
> - 但如果 **Redis 本身没开持久化**，那 Redis 重启就丢了——所以我们的 Redis 生产环境是**开了 RDB 的**；
> - 如果是 **Guava 的 `BloomFilter`（JVM 内存版）**，那**服务一重启就全没了**，必须重新预热。

#### ✅ 追问：「布隆过滤器怎么解决哈希冲突？」

**柯莱特原题**：

> 布隆过滤器**不解决冲突，它是”容忍”冲突**。<br>它用的是**多个独立的哈希函数**，每个元素把 k 个位置置 1。冲突（多个元素映射到同一位）会导致**误判率上升**，但**不会导致”说不存在却存在”**。<br>关键设计就是**用空间换误判率**：位数组越长、哈希函数个数越合适，误判率越低。<br>最优的哈希函数个数是 `k = (m/n)·ln2`，此时误判率 `p ≈ 0.6185^(m/n)`。

---

### 3.3 分布式锁（Redis + Redisson 看门狗）

**面试官原话**

- `企业真题.txt:1077-1078` 上海科续：**“Redis 的分布式锁在项目中如何使用的？Redis 的分布式锁怎么做锁的续期”**
- `企业真题.txt:36,43` 泽宇天河：**“redisson 看门狗自动续期的实现过程 / 看门狗怎么实现”**
- `企业真题.txt:854` 中数联卫士：**“看门狗机制流程”**
- `企业真题.txt:1483` 软通动力（京东工程师面试）：**“使用 redisson 分布式锁时，它的看门狗机制会给锁延期；那会发生一直占用资源，其他线程一直等待吗？”** ← 陷阱题
- `企业真题.txt:960-961` 上海爱回收：**“redis 分布式锁怎么去实现这种可重入性？”**
- `企业真题.txt:603` 北京稳宁斯洛：**“redis 中除了 set nx 命令，还有别的命令可以上锁吗?”**

#### 代码位置：两种实现都有

**方案一：原生 Redis（setnx + uuid + lua）** —— `AlbumInfoServiceImpl.getAlbumInfo2:341-396`

```java
String lockKey = RedisConstant.ALBUM_INFO_PREFIX+albumId+ ":lock";
String uuid = UUID.randomUUID().toString();
Boolean ifAbsent = redisTemplate.opsForValue()
        .setIfAbsent(lockKey, uuid, 5, TimeUnit.SECONDS);   // setnx + 过期时间
if(ifAbsent) {
    try {
        // ... 查库、写缓存
    } finally {
        delRedisKey2(lockKey, uuid);   // Lua 脚本解锁
    }
}
```

```java
// 解锁的 Lua 脚本：判断是不是自己的锁，是才删
private void delRedisKey2(String lockKey, String uuid) {
    String script = "if redis.call(\"get\",KEYS[1]) == ARGV[1]\n" +
            "then\n" +
            "    return redis.call(\"del\",KEYS[1])\n" +
            "else\n" +
            "    return 0\n" +
            "end";
    redisTemplate.execute(redisScript, Arrays.asList(lockKey), uuid);
}
```

**方案二：Redisson** —— `AlbumInfoServiceImpl.getAlbumInfoRedisson:404-440` 和 `GuiGuCacheAspect`

```java
RLock rLock = redissonClient.getLock(lockKey);
boolean tryLock = rLock.tryLock(3, TimeUnit.SECONDS);   // 等待3秒
if(tryLock) {
    try {
        // 业务
    } finally {
        rLock.unlock();
    }
}
```

#### ✅ 面试就按这个说

> 分布式锁我们有两种实现，**生产用的是 Redisson**，但我先讲原理因为 Redisson 也是基于它的。
>
> **手动实现（setnx + Lua）要解决三个问题**：<br>**① 加锁原子性**：用 `SET key value NX EX seconds` 一条命令搞定（**不能用 `setnx` 再 `expire`，因为两步之间宕机会死锁**）。<br>**② 误删别人的锁**：value 存一个 **UUID** 标识自己。释放时**先判断 value 是不是自己的，再删**。<br>**③ 判断+删除的原子性**：用 **Lua 脚本**，因为 Redis 执行 Lua 是单线程原子的。
>
> **Redisson 帮我们封装了三件事**：<br>**① 可重入**：用 **Hash 结构**存 `key = 锁名`，`field = UUID:线程ID`，`value = 重入次数`。同一线程再获取锁就 `value + 1`，释放时 `- 1`，减到 0 才真正删除。<br>**② 看门狗自动续期**：见下面。<br>**③ 等待机制**：`tryLock(waitTime, leaseTime, unit)` 支持等待。

#### ✅ 追问：「看门狗机制是怎么实现的？」

**这是最常考的**：

> 看门狗的触发条件是：**你调用 `lock()` 或 `tryLock()` 时，没有指定 `leaseTime`（锁的持有时间）**。
>
> 这时 Redisson 会给锁设一个**默认 30 秒**的过期时间，然后**启动一个定时任务**（`Timeout`），每隔 **`30/3 = 10` 秒**检查一次：<br>**如果业务还没执行完（锁还被持有），就把过期时间重置回 30 秒**。
>
> 源码上是 `RedissonLock` 里的 `renewExpiration()` 方法，通过 `ExpirationEntry` 注册一个 `TimerTask`，内部用 **Lua 脚本**执行 `pexpire`，并且会**先判断锁是不是还存在**（存在才续期）。<br>当调用 `unlock()` 时，会**取消这个定时任务**，避免无意义的续期。
>
> ⚠️ **关键点：如果你自己指定了 `leaseTime`（比如 `tryLock(3, 5, SECONDS)`），看门狗就不会生效**——因为 Redisson 认为你知道自己要持有多久。

我们的 `GuiGuCacheAspect.java:57` 用的是 `rLock.tryLock(3, 5, TimeUnit.SECONDS)`，**指定了 leaseTime = 5 秒，所以看门狗在这里其实没生效**。而 `getAlbumInfoRedisson:417` 用的是 `tryLock(3, TimeUnit.SECONDS)`，**这个才走看门狗**。

#### ✅ 追问：「看门狗一直续期，会不会一直占资源、其他线程一直等？」

**软通动力（京东工程师）的陷阱题**，非常关键：

> **不会，但要分情况说清楚**：
>
> **① 看门狗不是”无限续期”，它跟着业务生命周期走。**<br>续期只在**持有锁的线程还活着、且没调用 `unlock()`** 时进行。业务一执行完 `unlock()`，定时任务就被取消，锁正常释放。
>
> **② 真正会”一直占资源”的情况是：业务代码死循环或卡死了。**<br>这时看门狗确实会**一直续期**，锁永远不释放，其他线程一直等。<br>**但这是业务 bug，不是看门狗的问题**。而且换个角度看：**如果没有看门狗，锁会在 30 秒后自动过期释放**——这反而会导致**更严重的问题**：
>
> - 业务还在跑，锁却没了 → **两个线程同时操作临界区** → 数据错乱！
>
> 所以看门狗是\*\*”用可能卡死”换取”不会误释放”\*\*。要解决卡死，靠的是：
>
> - **业务超时控制**（Feign 超时、DB 超时）；
> - **指定合理的 `leaseTime`**，让锁有个兜底上限；
> - **监控告警**：锁等待时间过长就报警。
>
> **③ 其他等待线程不会”一直无限等”**，因为 `tryLock` 有 `waitTime` 参数（我们是 3 秒），**等不到就返回 false**，然后走兜底逻辑（查库或返回降级数据）。

#### ✅ 追问：「除了 setnx，还有别的命令能上锁吗？」

**北京稳宁斯洛原题**，考知识面：

> 有几种：<br>**① `SET key value NX EX`** —— 最推荐的原子写法；<br>**② `SETNX` + `EXPIRE`** —— 非原子，不推荐；<br>**③ `SET key value NX PX`** —— 毫秒级过期；<br>**④ Lua 脚本** —— 把”判断+加锁”或多步操作打包成原子执行。
>
> **另外要说清楚：单纯用 Redis 做锁，在主从架构下有”锁丢失”风险**：<br>主节点加锁成功后**还没同步到从节点就宕机**，从节点升主后，**锁就没了**，另一个线程又能加锁成功。<br>**解决方案是 RedLock**（向多数节点加锁），但 RedLock 本身也有争议（Martin Kleppmann 和 Redis 作者的著名论战），实际上我们的缓存场景**不需要那么强的保证**，所以直接用单节点 Redisson 就够了。

---

### 3.4 自定义缓存注解（AOP 实战）

**面试官原话**

- `企业真题.txt:296` 中软国际：**“讲一下自定义缓存注解”**
- `企业真题.txt:654-655` Kmerit：**“自定义缓存注解详细说一下 / 这个缓存注解的存的键值对的 key 是什么（前缀加方法参数拼接）”**
- `企业真题.txt:866-868` 长亮科技：**“自定义注解怎么做的？保留策略什么意思？切入点怎么定义”**
- `企业真题.txt:1142` 高伟达：**“使用 Redis 做缓存的时候，你的服务上的常用的用于缓存的注解都有哪些？”**

#### 代码位置

```java
// GuiGuCacheAspect.java:32-85（完整）
@SneakyThrows
@Around("@annotation(com.atguigu.tingshu.common.cache.GuiGuCache)")
public Object cacheAspect(ProceedingJoinPoint joinPoint) throws Throwable {
    //1 获取被增强方法参数列表
    Object[] args = joinPoint.getArgs();
    //2 从方法上获取 GuiGuCache 注解
    MethodSignature signature = (MethodSignature)joinPoint.getSignature();
    Method method = signature.getMethod();
    GuiGuCache guiGuCache = method.getAnnotation(GuiGuCache.class);
    String prefix = guiGuCache.prefix();
    //3 构建 redis key：album:info:+[albumId]
    String key = prefix + Arrays.asList(args).toString();
    //4 查缓存
    Object obj = redisTemplate.opsForValue().get(key);
    if (obj == null) {
        // 用 Redisson 加锁防击穿
        RLock rLock = redissonClient.getLock(key + ":lock");
        boolean tryLock = rLock.tryLock(3, 5, TimeUnit.SECONDS);
        ...
    }
}
```

使用处：

```java
// AlbumInfoServiceImpl.java:175-179
@GuiGuCache(prefix = "album:info:")
@Override
public AlbumInfo getAlbumInfo(Long albumId) {
    return this.getAlbumInfoData(albumId);
}
```

#### ✅ 面试就按这个说

> 我把缓存的通用逻辑抽成了一个注解 `@GuiGuCache`，配合 AOP 的环绕通知。
>
> **① 注解定义**：`@GuiGuCache` 有一个 `prefix` 属性用来指定 key 前缀，用 `@Retention(RUNTIME)` 保证运行期可读，`@Target(METHOD)` 限定在方法上。<br>**② 切面**：切入点是 `@annotation(...GuiGuCache)`，即**所有标注了这个注解的方法**。<br>**③ key 的构建**：`prefix + 方法参数的 toString`，比如 `album:info:[123]`。<br>**④ 逻辑**：先查 Redis，有就直接返回；没有就加分布式锁回源 DB，回写缓存。

#### ⚠️ 真实情况：key 的设计有问题

```java
String key = prefix + Arrays.asList(args).toString();
```

⚠️ `Arrays.asList(args).toString()` 的结果是 **`[123]`**（带中括号和逗号）。

**问题**：

- 如果方法有**多个参数**，key 会变成 `[123, 456]`，虽然能区分，但**可读性差、有歧义**——`[1, 23]` 和 `[12, 3]` 不会混淆（因为有逗号），但如果参数本身含逗号/中括号就会出问题；
- **更严重的是：参数是对象时**，`toString()` 默认输出 `com.xxx.AlbumInfo@1a2b3c4d`（**对象哈希码**），**每次调用都不一样** → **缓存永远不命中，还会无限写入新 key，把 Redis 撑爆**！

> **✅ 改进方案**：
>
> ```java
> // 更好：用 Arrays.deepToString + 参数名，或者直接 hash
> String key = prefix + Arrays.stream(args)
>         .map(String::valueOf)
>         .collect(Collectors.joining(":"));
> // album:info:123
> ```
>
> 或者参考 **Spring Cache** 的做法，支持 **SpEL 表达式**动态拼 key：`@Cacheable(key = "#albumId")`。<br>我们现在这个注解\*\*只适合”单参数且参数是基本类型/字符串”\*\*的方法，这是个限制。

#### ✅ 追问：「为什么不用 Spring 自带的 `@Cacheable`？」

**这是很好的反问机会**：

> Spring Cache 是一套**缓存抽象**，通过 `CacheManager` 可以对接 Redis、Caffeine 等多种实现，功能比我们自研的完善（支持 SpEL key、`@CachePut`、`@CacheEvict`、条件缓存 `condition/unless`）。
>
> **我们自研的原因有三个**：<br>**① 想在缓存逻辑里内嵌”分布式锁防击穿”**。Spring Cache 只管缓存读写，**不管击穿**，遇到并发还是会有大量线程同时回源。我们自己写的切面能顺手把锁加上。<br>**② 想做”缓存空值”的处理**。Spring Cache 默认不缓存 null（除非配 `cacheNullValues`），我们想自己控制。<br>**③ 学习/可控性**。
>
> **如果现在重做，我会用 Spring Cache + 自定义 `CacheManager`**，然后在 `Cache` 的 `get` 实现里加锁逻辑——**站在成熟框架上做扩展，比自己造轮子更稳**。

---

### 3.5 第 3 章追问链速查

| 追问 | 答题要点 |
| --- | --- |
| 穿透 vs 击穿 | 一个”数据不存在”，一个”热点 key 过期” |
| 空值缓存为什么要设短 TTL | 防内存浪费 |
| 布隆过滤器存在哪 | Redis bitmap（Redisson `RBloomFilter`） |
| 全 1 一定存在吗 | **不一定**，有假阳性 |
| 布隆缺点 | 误判、不可删除、需预估容量 |
| 布隆能删除吗 | 不能，除非 Counting Bloom / Cuckoo |
| setnx + expire 的问题 | 非原子，中间宕机死锁；要用 `SET NX EX` |
| 为什么用 Lua 解锁 | 保证”判断+删除”原子 |
| Redisson 可重入怎么实现 | Hash：key=锁名，field=UUID:线程ID，value=重入次数 |
| 看门狗触发条件 | **不指定 leaseTime** 才生效 |
| 看门狗会不会一直占资源 | 不会，跟业务生命周期走；真卡死是业务 bug |
| Redis 锁的缺陷 | 主从切换锁丢失；RedLock 可缓解 |
| 缓存一致性 | 先更 DB 再删缓存 + 延迟双删 |
| 为什么不更新缓存 | 并发写覆盖 + 写多读少浪费 |

---

## 4. 订单模块（京东主战场）

> **一句话总述**：支持购买 VIP、专辑、声音三类；下单前做**验签防篡改**和**流水号防重复提交**；支持微信支付和余额支付；未支付订单**30 分钟自动关闭**。

### 4.1 下单全链路

**面试官原话**（`企业真题.txt:314` 上海擎朗：**“订单模块详细逻辑”**；`:839` 人品科技：**“说一下订单提交的过程”**；`:442` 神州信息：**“订单的流程”**；`:664` Kmerit：**“项目订单模块介绍”**）

#### 两个阶段的代码

**阶段一：跳转结算页（`trade`）** —— 计算金额、生成流水号、签名

```java
// OrderInfoServiceImpl#trade:365-580（简化）
public OrderInfoVo trade(TradeVo tradeVo, Long userId) {
    //1 远程调用：获取用户信息
    Result<UserInfoVo> resultUserInfoVo = userInfoFeignClient.getUserInfoVo(userId);

    //2 根据购买类型算钱
    String itemType = tradeVo.getItemType();   // 1001-专辑 1002-声音 1003-vip
    if ("1001".equals(itemType)) {
        //2.1 判断是否购买过
        Boolean isPaid = userInfoFeignClient.isPaidAlbum(tradeVo.getItemId()).getData();
        //2.2 拿专辑信息
        AlbumInfo albumInfo = albumInfoFeignClient.getAlbumInfo(tradeVo.getItemId()).getData();
        //2.3 判断是否 VIP，用不同折扣
        Integer isVip = userInfoVo.getIsVip();
        // ... 会员折扣 / 普通折扣 计算 derateAmount、orderAmount
    } else if ("1003".equals(itemType)) {  // VIP
        VipServiceConfig config = vipServiceConfigFeignClient
                .getVipServiceConfig(tradeVo.getItemId()).getData();
        originalAmount = config.getPrice();
        orderAmount = config.getDiscountPrice();
    } else if ("1002".equals(itemType)) {  // 声音
        List<TrackInfo> trackInfoList =
                trackInfoFeignClient.findPaidTrackInfoList(itemId, trackCount).getData();
        // 单价 * 数量
    }

    //3 封装返回
    OrderInfoVo orderInfoVo = new OrderInfoVo();
    orderInfoVo.setOriginalAmount(originalAmount);
    orderInfoVo.setDerateAmount(derateAmount);
    orderInfoVo.setOrderAmount(orderAmount);
    orderInfoVo.setTimestamp(SignHelper.getTimestamp());

    //4 防重复提交：生成流水号存 Redis
    String key = "user:trade:" + userId;
    String value = UUID.randomUUID().toString().replaceAll("-", "");
    redisTemplate.opsForValue().set(key, value);      // ⚠️ 没有过期时间！
    orderInfoVo.setTradeNo(value);

    //5 签名
    Map<String, Object> parameterMap = JSON.parseObject(JSON.toJSONString(orderInfoVo), Map.class);
    orderInfoVo.setSign(SignHelper.getSign(parameterMap));
    return orderInfoVo;
}
```

**阶段二：提交订单（`submitOrder`）** —— 验签、防重、建单、支付

```java
// OrderInfoServiceImpl#submitOrder:93-176（简化）
public String submitOrder(OrderInfoVo orderInfoVo, Long userId) {
    //1 验签：判断数据是否被篡改
    Map map = JSON.parseObject(JSON.toJSONString(orderInfoVo), Map.class);
    map.put("payWay", SystemConstant.ORDER_PAY_WAY_WEIXIN);
    SignHelper.checkSign(map);

    //2 防重复提交：Lua 脚本（比较 + 删除，保证原子性）
    String tradeNo = orderInfoVo.getTradeNo();
    String script = "if(redis.call('get', KEYS[1]) == ARGV[1]) " +
                    " then return redis.call('del', KEYS[1]) " +
                    " else return 0 end";
    String key = "user:trade:" + userId;
    Boolean flag = (Boolean) redisTemplate.execute(
            new DefaultRedisScript<>(script, Boolean.class), Arrays.asList(key), tradeNo);
    if(!flag) {
        throw new GuiguException(ResultCodeEnum.ORDER_SUBMIT_REPEAT);
    }

    //3 生成订单编号
    String orderNo = UUID.randomUUID().toString().replaceAll("-", "");

    //4 按支付方式分流
    if(!"1103".equals(payWay)) {          // 微信/支付宝：只建单，等回调
        this.saveOrder(orderInfoVo, userId, orderNo);
    } else {                               // 余额支付：扣款 → 建单 → 加购买记录 → 改状态
        userAccountFeignClient.checkAndDeduct(accountDeductVo);   // 扣余额
        OrderInfo orderInfo = this.saveOrder(orderInfoVo, userId, orderNo);
        userInfoFeignClient.savePaidRecord(userPaidRecordVo);     // 加购买记录
        this.orderPaySuccess(orderNo);                             // 改订单状态
    }
    return orderNo;
}
```

#### ✅ 面试就按这个说（完整流程）

> 下单分**两个接口**：
>
> **第一个是”跳转结算页”（`trade`）**：<br>**①** 根据 `itemType` 区分买什么（VIP / 专辑 / 声音）；<br>**②** 远程调用查商品信息和用户信息，**判断用户是不是 VIP**，VIP 用会员折扣、非 VIP 用普通折扣，算出原始金额、优惠金额、实付金额；<br>**③** 生成一个**唯一流水号**（`tradeNo`）存到 Redis；<br>**④** 把所有数据（金额、明细、时间戳）拼起来**做 MD5 签名**，一起返回给前端。
>
> **第二个是”提交订单”（`submitOrder`）**：<br>**① 验签**：把前端传来的数据重新算一遍签名，不一致说明被篡改过，直接拒绝；<br>**② 防重复提交**：用 **Lua 脚本**比对 `tradeNo` 并删除，保证原子性；<br>**③ 生成订单号**；<br>**④ 分流**：微信支付就**只落单（待支付）**，然后发**延迟消息**等回调；余额支付则**同步扣余额 → 落单 → 加购买记录 → 改状态**。

#### ✅ 追问：「订单号什么时候生成的？怎么生成？」

**中软国际原题**（`企业真题.txt:1360`：**“订单号什么时候生成的”**）：

> 在两个地方，分别对应两种单：<br>**① 提交订单时生成业务订单号**，用的是 **`UUID` 去掉横线**（32 位）；<br>**② 支付时生成的支付记录号**（`PaymentInfo`）。
>
> ⚠️ 但要说明：**用 UUID 做订单号其实不是最优的**，它有两个问题：<br>**① 无序**——如果拿它当数据库主键，插入时会导致 **B+ 树频繁页分裂**，性能差；<br>**② 不方便排查**——没有时间信息，出问题不好定位。
>
> **更好的方案是「雪花算法 + 业务前缀」**：<br>比如 `TS20250815103000 + 雪花ID`，既有**时间信息**（方便排查、方便分库分表按时间路由），又**全局唯一且趋势递增**。<br>MyBatis-Plus 的 `IdType.ASSIGN_ID` 就是雪花算法，我们主键用的就是它。

---

### 4.2 🔥🔥 为什么引入流水号就能防止订单重复提交？

**面试官原话**

- `企业真题.txt:381` 快手外包：**“为什么引入流水号就能防止订单重复提交”**
- `企业真题.txt:1386` 中软国际：**“防止重复提交订单，为什么在缓存里删除 key 的时候是第一次提交”**
- `企业真题.txt:315` 上海擎朗：**“订单提交以后怎么防止订单重复提交”**
- `企业真题.txt:479` 中科软一面：**“怎么解决订单重复提交的”**
- `企业真题.txt:1157` 高伟达：**“如何解决订单重复提交”**
- `企业真题.txt:1328` 太极一面：**“怎么解决用户的重复下单”**
- `企业真题.txt:687` 南京华为外包：**“避免订单重复提交是怎么做的？”**
- `企业真题.txt:525` 海港城科技：**“订单重复提交怎么实现”**

#### ✅ 面试就按这个说（这是**必考**题）

> **核心思路是”一次性的令牌”（Token），也叫幂等 token。**
>
> **流程三步**：<br>**① 生成**：用户进入结算页时（`trade` 接口），后端生成一个**唯一流水号**（`tradeNo = UUID`），存进 Redis：`key = user:trade:{userId}`，`value = tradeNo`，同时把这个 `tradeNo` 返回给前端。<br>**② 携带**：前端提交订单时，把这个 `tradeNo` 一起传回来。<br>**③ 校验并消费**：后端用 **Lua 脚本**执行：
>
> ```lua
> if redis.call('get', KEYS[1]) == ARGV[1]
> then return redis.call('del', KEYS[1])   -- 匹配上就删除，并返回成功
> else return 0                            -- 不匹配返回失败
> end
> ```
>
> **比较 + 删除是原子的**，删除成功就说明这是**第一次**提交，放行；删不到（说明已经被消费或不存在）就判定为重复提交，抛异常。

#### ✅ 追问：「为什么”删掉了”才说明是第一次提交？」

**中软国际的原题，考的是你对”消费”这个概念的理解**：

> 因为 Redis 里那个 `tradeNo` 是**一次性凭证**——**“存在”代表”这个结算页还没被提交过”，”被删除”代表”已经被用掉了”**。
>
> 打个比方：它就像**电影票的座位号**。检票员撕票（删除）的瞬间，这张票就作废了。**第二次拿同一张票来，撕不到了，就证明是重复使用**。
>
> 所以逻辑是**反过来**的：
>
> - `get` 到值 **且等于** 前端传来的 `tradeNo` → 说明是**还没用过**的凭证 → **删掉它（消费掉）** → **放行**；
> - 删不到 → 凭证已被消费 → **拒绝**。
>
> **为什么必须用 Lua 保证原子性？** 如果分成两步（先 `get` 判断、再 `del`），两个并发请求可能**同时 get 到相同的值、都判断通过**，然后都去 `del`——结果**两个都下单成功了**，防重就失效了。Lua 把这两步合成一个原子操作，Redis 单线程执行，只有一个请求能成功删除。

#### ✅ 追问：「用户一直停在结算页不提交，Redis 数据怎么办？」

**这是考你考虑得全不全**：

> 这正是我发现的**一个缺陷**：我们代码里 `trade` 存 `tradeNo` 时**没有设置过期时间**：
>
> ```java
> redisTemplate.opsForValue().set(key, value);   // ⚠️ 无 TTL
> ```
>
> 这会导致两个问题：<br>**① 内存泄漏**：用户每次点”立即购买”都会覆盖这个 key，但如果用户开了几十个结算页，或者大量用户只点不买，Redis 里会**堆积大量 key**；<br>**② 逻辑隐患**：key 永不过期，理论上如果用户拿到旧的 `tradeNo` 再提交，只要中间没人覆盖 key，**依然能成功**——失去了”时效性”。
>
> **✅ 改进**：加一个**合理的短 TTL**，比如 **30 分钟**（和订单超时时间对齐）：
>
> ```java
> redisTemplate.opsForValue().set(key, value, 30, TimeUnit.MINUTES);
> ```
>
> 这样既防了内存膨胀，又保证令牌有时效性。

#### ✅ 追问：「这个方案在集群/多实例下有效吗？」

> **有效**。因为 `tradeNo` 存在 **Redis（中心化存储）** 里，不是 JVM 内存，所以**所有实例看到的是同一份数据**。Lua 的原子性也是 Redis 服务端保证的，和几个应用实例无关。
>
> ⚠️ **但如果用了 Redis Cluster，要注意**：Lua 脚本里涉及的所有 key **必须在同一个 slot**，否则会报 `CROSSSLOT` 错误。我们这个脚本只操作一个 key，所以没问题。如果以后要操作多个 key，得用 **hash tag**（比如 `{user:1001}:trade`）让它们落在同一个 slot。

#### ✅ 追问：「除了 Redis，还有别的防重方案吗？」

> 有，常见三种，我讲一下取舍：
>
> | 方案 | 原理 | 优点 | 缺点 |
> | --- | --- | --- | --- |
> | **Redis 令牌**（我们的） | 一次性 token + Lua | 性能好、分布式安全 | 依赖 Redis 可用性 |
> | **数据库唯一索引** | 订单表加 `user_id + 业务标识` 唯一索引 | **绝对可靠**，是最后的兜底 | 靠异常判重，体验差、有锁开销 |
> | **前端按钮置灰 + 防抖** | 点击后禁用按钮 | 成本最低 | **只能防误操作，防不了恶意请求** |
>
> **实际上我们三个都用了**：前端点了按钮就置灰（第一道），Redis 令牌校验（第二道），订单表上还有唯一索引兜底（第三道）。**防重这种事，一层不够，要纵深防御。**
>
> **其实最根本的解法是「幂等」**：与其防住重复请求，不如让**重复请求执行多次结果一样**。比如订单号由”用户ID + 业务ID”生成，插库时靠唯一索引冲突来识别重复——**这样无论请求来多少次，都只会有一张订单**。

---

### 4.3 验签防篡改（对应”商家改价”题）

**面试官原话**（`企业真题.txt:127` 威信诚：**“用户购买之后，没有付款，但是商家改了价格，用户的订单怎么办”**；`企业真题.txt:112` 北京南山：**“在项目中有没有对数据进行加密”**；`企业真题.txt:1114` 中科软二面：**“防重机制怎么实现的？验签怎么实现的？”**）

#### 代码位置

```java
// SignHelper.java:14-83（完整）
public class SignHelper {
    private static String signKey = "atguigu123";   // ⚠️ 硬编码！

    public static void checkSign(Map<String, Object> parameterMap){
        //1 校验签名时间戳（防重放）
        Long remoteTimestamp = (Long)parameterMap.get("timestamp");
        if(StringUtils.isEmpty(remoteTimestamp)){
            throw new GuiguException(ResultCodeEnum.SIGN_ERROR);
        }
        long currentTimestamp = getTimestamp();
        if (Math.abs(currentTimestamp - remoteTimestamp) > 500000) {   // ⚠️ 500秒
            throw new GuiguException(ResultCodeEnum.SIGN_OVERDUE);
        }
        //2 校验签名
        String signRemote = (String)parameterMap.get("sign");
        String signLocal = getSign(parameterMap);
        if(!signRemote.equals(signLocal)){
            throw new GuiguException(ResultCodeEnum.SIGN_ERROR);
        }
    }

    public static String getSign(Map<String, Object> parameterMap) {
        if(parameterMap.containsKey("sign")) {
            parameterMap.remove("sign");
        }
        TreeMap<String, Object> sorted = new TreeMap<>(parameterMap);   // 排序保证一致性
        StringBuilder str = new StringBuilder();
        for (Map.Entry<String, Object> param : sorted.entrySet()) {
            str.append(param.getValue()).append("|");    // ⚠️ 只拼了 value，没拼 key！
        }
        str.append(signKey);
        return MD5.encrypt(str.toString());
    }
}
```

#### ✅ 面试就按这个说

> 结算页算完金额后，后端会对**所有返回给前端的字段**（金额、明细、时间戳）做一次 **MD5 签名**，一起返回。<br>前端提交订单时带上这个签名，后端**重新算一遍**，对不上就说明**金额被改过**，直接拒绝。<br>这样**即使用户用抓包工具改了 `orderAmount`，签名也会不匹配**，防止”1 分钱买专辑”。

#### ⚠️ 真实情况：验签有 2 个严重缺陷

**缺陷 1：只拼 value 不拼 key，存在”字段值互换”攻击（风险 ★★★★★）**

```java
for (Map.Entry<String, Object> param : sorted.entrySet()) {
    str.append(param.getValue()).append("|");   // ⚠️ 只有 value
}
```

问题在于：**拼接串里没有字段名**。假设有两个字段：

```text
originalAmount = 100,  orderAmount = 10    → 拼成 "100|10|..."
originalAmount = 10,   orderAmount = 100   → 拼成 "10|100|..."
```

因为 `TreeMap` 是按 **key 字母序**排序的（`orderAmount` 在 `originalAmount` 前面，实际上顺序不变），所以**只要两个字段的值互换，拼接结果只取决于值的排列，跟字段名无关**——攻击者可以在**不改变签名**的前提下，把”实付金额”和”优惠金额”互换，或者和另一个同类型字段互换。

> **✅ 正确做法**：必须拼上 key，格式如 `key1=value1&key2=value2`，或者用标准的签名规范。
>
> ```java
> for (Map.Entry<String, Object> param : sorted.entrySet()) {
>     str.append(param.getKey()).append("=").append(param.getValue()).append("&");
> }
> ```

**缺陷 2：密钥硬编码在源码里**

```java
private static String signKey = "atguigu123";   // ⚠️
```

> **✅ 改进**：① 从**配置中心（Nacos）**或**环境变量**读取；② 不同环境用不同密钥；③ **定期轮换**；④ 更安全的是用 **RSA/HMAC-SHA256** 替代 MD5（MD5 已被证明可碰撞，且有彩虹表风险）。

**缺陷 3：时间戳窗口 500 秒（约 8.3 分钟）**

```java
if (Math.abs(currentTimestamp - remoteTimestamp) > 500000) {
```

⚠️ 注意 `500000` 是**毫秒**，等于 **500 秒 ≈ 8.3 分钟**。

> 这个窗口**太长了**，给重放攻击留了很大空间（攻击者可以在 8 分钟内重放）。一般**2~5 分钟**比较合理，而且\*\*必须配合”流水号只能用一次”\*\*才能真正防重放——我们正好有 `tradeNo` 机制，两者是互补的。

#### ✅ 回答「商家改价了，用户未付款的订单怎么办？」

**威信诚的原题，这是个业务设计题**，代码里没有对应实现，要用**快照 + 兜底校验**来答：

> 这个问题的本质是：**订单金额是”下单那一刻的快照”，但商品价格是”实时的”**。
>
> **我们项目的处理方式是「下单即快照」**：<br>`trade` 接口算完金额后，**把金额写进订单明细**（`order_detail` 表存 `item_price`），并且用**签名锁死**。所以即使用户停在支付页，商家改了价，**用户支付的依然是下单时的价格**——这是**对用户有利**的，也是电商的通行做法。
>
> **但更深一层要考虑的是「支付成功时的兜底校验」**：<br>在**微信支付回调**里，我会**再查一次当前价格**：
>
> - 如果**价格降了** → 按**原价**收（不让用户吃亏），差额可以不退；
> - 如果**价格涨了** → 依然按**原订单价**收（因为已经锁定），商家承担；
> - 如果**商品下架/删除** → **拒绝支付**并引导用户取消订单（我们 `WxPayServiceImpl.createJsapi:63-66` 就做了这个判断，订单状态是”已取消”就返回 null）。
>
> **另外，如果是「未付款且商家改价」，更优雅的做法是主动通知用户**：检测到价格变动时，给用户推一条消息”您关注的专辑降价了”，引导**取消旧订单、重新下单**。这样既避免纠纷，又能促成交易。

---

### 4.4 余额扣减的原子性

**面试官原话**（`企业真题.txt:211` 上海魁鲸：**“怎么保证钱不会超扣”**；`:628` 北京瀚海博瑞：**“怎么保证余额计算是统一的，不会出现余额加减异常”**）

#### 代码位置

```java
// UserAccountServiceImpl#checkAndDeduct:60-100
@Transactional
@Override
public void checkAndDeduct(AccountLockVo accountDeductVo) {
    //1 查余额条件
    LambdaQueryWrapper<UserAccount> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(UserAccount::getUserId, accountDeductVo.getUserId());
    wrapper.ge(UserAccount::getAvailableAmount, accountDeductVo.getAmount());  // >= 金额

    //2 先查出来
    UserAccount userAccount = userAccountMapper.selectOne(wrapperOldUserAccount);
    //3 内存里减
    userAccount.setAvailableAmount(userAccount.getAvailableAmount().subtract(accountDeductVo.getAmount()));
    userAccount.setTotalAmount(userAccount.getTotalAmount().subtract(accountDeductVo.getAmount()));
    //4 带条件更新：WHERE user_id=? AND available_amount>=?
    int count = userAccountMapper.update(userAccount, wrapper);
    if(count == 0) {   // 更新影响行数为0，说明余额不足（条件不满足）
        throw new GuiguException(ResultCodeEnum.ACCOUNT_LESS);
    }
    //5 记流水
    userAccountDetailMapper.insert(userAccountDetail);
}
```

#### ✅ 面试就按这个说

> 余额扣减的**关键是要防止”超扣”和”并发丢失更新”**。
>
> 我们的做法是\*\*”带条件的 UPDATE”\*\*：
>
> ```sql
> UPDATE user_account
> SET available_amount = ?, total_amount = ?
> WHERE user_id = ? AND available_amount >= ?
> ```
>
> **把余额判断（`>=`）直接放进 `WHERE` 条件里**。这样：
>
> - 如果余额够，更新成功，影响行数 = 1；
> - 如果余额不够，**影响行数 = 0**，代码里判断 `count == 0` 就抛”余额不足”。
>
> **为什么这样能防并发？** 因为 MySQL 的 `UPDATE` 会对匹配的行**加排他锁**，两个并发请求会**串行执行**：第一个扣完余额变少了，第二个执行时 `available_amount >= ?` 就不满足了，影响 0 行 → 被拒绝。**所以不会超扣。**
>
> **而且整个方法加了 `@Transactional`**，扣余额和记流水在同一个本地事务里，要么都成功要么都回滚。

#### ⚠️ 真实情况：这个实现有个隐蔽的并发 bug（发现它=加分项）

⚠️ 注意代码的第 78-86 行：**先 `selectOne` 查出来、在内存里 `subtract`、再 `update`**。

**问题**：`update` 时传的 `userAccount` 对象里带的是\*\*”查询时的余额减去要扣的金额”**计算的**绝对值\*\*，而不是”在数据库当前值上减”。

```text
初始余额 100
线程 A：查出来 100，算 100-10=90，准备 update 成 90
线程 B：查出来 100，算 100-20=80，准备 update 成 80
A 先执行：UPDATE ... SET available=90 WHERE user_id=1 AND available>=10  ✅ 成功
B 后执行：UPDATE ... SET available=80 WHERE user_id=1 AND available>=20  ✅ 也成功（因为90>=20）
结果：余额变成 80，但实际应该扣 10+20=30，正确结果应该是 70！
→ ⚠️ 线程 A 扣的 10 元"丢失"了（丢失更新）
```

**根因**：`WHERE` 条件用的是**查询时的快照**去判断，但 `SET` 的是**内存里算好的绝对值**。两个线程都在**旧值**基础上计算，后写的覆盖了先写的。

> **✅ 正确写法有两种**：
>
> **方案一（推荐，最简洁）：把减法放在 SQL 里做**
>
> ```sql
> UPDATE user_account
> SET available_amount = available_amount - #{amount},
>     total_amount = total_amount - #{amount}
> WHERE user_id = #{userId} AND available_amount >= #{amount}
> ```
>
> 这样**每次都是在数据库当前值上减**，天然没有丢失更新。**这是最标准、最推荐的做法**——一条 SQL 搞定”检查+扣减+原子”。<br>（代码注释里其实已经写出了这条 SQL，但实现时没用它。）
>
> **方案二：乐观锁（版本号）**<br>表加 `version` 字段，`UPDATE ... SET version = version + 1 WHERE user_id=? AND version = #{oldVersion}`，影响行数为 0 就重试。<br>缺点是要**处理重试逻辑**，高并发下冲突多、重试频繁。
>
> **方案三：悲观锁 `SELECT ... FOR UPDATE`**<br>能保证正确，但**锁的粒度大、性能差**，而且要先加锁再查，容易锁等待。
>
> **我会选方案一**，因为它**最少的代码、最好的性能、最强的正确性**——这也是”**账户扣减**“类的标准答案。

#### ✅ 追问：「`BigDecimal` 能不能用 `double`？」

**面试官原话**（`企业真题.txt:445` 神州信息：**“bigdecimal 和 double 区别”**；`:1519` 国家电网外包：**“bigdecimal 为什么能保证数据精度”**；`:1378` 中科软：**“`.valueOf()` 和 new BigDecimal() 有什么区别？”**）

> **不能用 double 做金额**。因为 `double` 是**二进制浮点数**（IEEE 754），无法精确表示十进制小数，比如 `0.1 + 0.2 != 0.3`。<br>钱差一点点都不行，所以**必须用 `BigDecimal`**。
>
> **BigDecimal 的原理**：它内部用 **`int[]` 存”无标度值” + `int scale` 存”小数位数”**，本质是**十进制**运算，所以精确。
>
> **三个使用要点**：<br>**① 必须用 `new BigDecimal(String)` 或 `BigDecimal.valueOf(double)`**，**绝对不能 `new BigDecimal(0.1)`**——后者会把 double 的二进制误差一起带进来。<br>`BigDecimal.valueOf(double)` 内部其实会先 `Double.toString(double)` 再构造，所以是安全的。<br>**② 除法必须指定精度和舍入模式**，否则除不尽会抛 `ArithmeticException`：
>
> ```java
> amount.divide(new BigDecimal("3"), 2, RoundingMode.HALF_UP)
> ```
>
> 我们代码里 `OrderInfoServiceImpl.trade:411-413` 就是这么写的。<br>**③ 比较大小用 `compareTo()`，不要用 `equals()`**——因为 `equals` 会比较 **scale**（小数位数），`new BigDecimal("1.0").equals(new BigDecimal("1.00"))` 返回 **false**！

---

### 4.5 🔥🔥 支付成功了但权益没发放，是回滚吗？（京东核心题）

**面试官原话**（`企业真题.txt:5` 京东）

> **那比如说这个我支付完了，然后权益没有发放，你们是怎么做呢？是回滚吗？还是什么样的一个方式？**

**这是整份材料里最重要的一题**。京东的面试官在追问**分布式事务的一致性**。

#### 代码位置与真相

```java
// OrderInfoServiceImpl#submitOrder:130-174  ← 余额支付分支
} else { //余额支付
    //1 远程调用：检查余额是否充足，扣减余额
    Result result = userAccountFeignClient.checkAndDeduct(accountDeductVo);   // 服务A
    if(result.getCode()!=200) {
        throw new GuiguException(ResultCodeEnum.ACCOUNT_LESS);
    }

    //2 创建订单（未支付）
    OrderInfo orderInfo = this.saveOrder(orderInfoVo,userId,orderNo);          // 本服务

    //3 远程调用：添加购买记录
    Result userResult = userInfoFeignClient.savePaidRecord(userPaidRecordVo);  // 服务B
    if (200 != userResult.getCode()) {
        throw new GuiguException(211, "新增购买记录异常");
    }

    //4 根据订单编号修改订单状态（已经支付）
    this.orderPaySuccess(orderNo);                                            // 本服务
}
```

⚠️ **关键：这个方法上没有任何 `@GlobalTransactional`！**

```java
// OrderInfoServiceImpl.java:92-93
@Override                        // ← 只有 @Override，没有 @GlobalTransactional
public String submitOrder(OrderInfoVo orderInfoVo, Long userId) {
```

**全项目只有一个地方用了分布式事务**：

```java
// UserInfoServiceImpl.java:257-258
@GlobalTransactional           // ← 全项目仅此一处，在 saveUser 上
@Override
public void saveUser(UserInfo userInfo) {
```

#### ⚠️ 这意味着什么（要能讲清后果）

余额支付这条链路，涉及 **3 个服务、4 个步骤**：

| 步骤 | 操作 | 所在服务 |
| --- | --- | --- |
| ① | 扣减余额 | `service-account` |
| ② | 创建订单 | `service-order` |
| ③ | 添加购买记录 | `service-user` |
| ④ | 改订单状态为已支付 | `service-order` |

**如果第 ③ 步失败**（比如 `service-user` 挂了、或者 `savePaidRecord` 抛异常）：

- 第 ① 步的**扣款已经提交**（`checkAndDeduct` 有自己的 `@Transactional`，已经 commit）；
- 第 ② 步的**订单已经落库**；
- **钱扣了，但购买记录没加上 → 用户付了钱却听不了！**
- 而且 `throw new GuiguException` 只能回滚 `service-order` 的**本地事务**（订单插入回滚），**回滚不了已经提交的账户扣款**。

**这就是京东面试官问的场景**——他其实在引导你说出”**你没有分布式事务，所以回滚不了**“。

#### ✅ 面试就按这个说（两套口径）

**口径 A（标准/理想，先说出来）**

> 这是一个典型的**跨服务数据一致性**问题，标准做法是用**分布式事务**。<br>我们项目用的是 **Seata 的 AT 模式**：在发起方方法上加 **`@GlobalTransactional`**，Seata 的 **TC** 会协调各分支：
>
> - 每个分支执行前把**数据快照（before image / after image）写进 `undo_log`**；
> - 任何一个分支失败，**TC 通知所有分支用 `undo_log` 反向补偿**（把数据改回去）；
> - 所以”扣了钱但没发权益”这种情况，**会自动回滚，钱会退回**。

**口径 B（真实情况 + 改进方案，被追问时说）**

> **但我要如实说一点**：我们 `submitOrder` 这个方法的**分布式事务当时没加全**。真实代码里只有**首次登录初始化账户**（`saveUser`）加了 `@GlobalTransactional`，**下单这条链路我只依赖了”异常抛出 + 本地事务回滚”**。
>
> **这会导致什么问题**：如果”加购买记录”这一步失败，**扣掉的余额不会自动退回**，需要人工处理。
>
> **我后来复盘时设计了三种改进方案**：
>
> **① 补上 `@GlobalTransactional`**（最直接）<br>在 `submitOrder` 上加全局事务注解。但要注意 **Seata 的 XID 要能通过 Feign 传到下游服务**——我们的 `FeignInterceptor` 目前**只传了 token，没传 XID**，所以还得在拦截器里把 `RootContext.getXID()` 放进请求头，下游再用过滤器取出并绑定。
>
> **② 用「本地消息表 + 定时补偿」**（我最推荐的）<br>在 `service-order` 本地库里加一张**消息表**，”插入订单”和”插入待发送消息”放在**同一个本地事务**里，保证原子；然后**异步**去调用加购买记录，成功就标记消息已处理。失败就**定时任务重试**。<br>好处是**不引入 Seata 的全局锁开销**，而且**天然幂等**（消息有唯一 ID）。
>
> **③ 用「TCC」做资金操作**（最严谨）<br>把扣余额拆成三个阶段：
>
> - **Try**：**冻结**金额（`available_amount` 减、`frozen_amount` 加），钱还没真正走；
> - **Confirm**：真正扣减（`frozen_amount` 减）；
> - **Cancel**：解冻（`available_amount` 加回来）。<br>这样任何一步失败，都能通过 Cancel **精确回退**，而且**资金全程可追溯**——**金融场景必须这么做**。
>
> **另外必须加「对账」兜底**：不管用哪种方案，都该有一个**定时对账任务**，扫描”订单状态是已支付、但没有购买记录”的异常数据，自动补偿。**分布式事务再强也可能失效，对账是最后一道防线。**

💡 **这样答的威力**：面试官问”是不是回滚”，你回答的层次是 **“标准做法 → 我们的差距 → 三种改进方案 → 对账兜底”**，这完全是**架构师级别的思考深度**。京东这种面试官会非常认可。

---

### 4.6 🔥🔥 延迟关单（含”为什么不用 RabbitMQ”）

**面试官原话**

- `企业真题.txt:18` 恒天瑞讯：**“redis 发送延迟消息如果说我发送完了之后我这个宕机了然后我立马又重启了然后这个会有问题吗？”**
- `企业真题.txt:553` 东软汉和：**“rides 做延迟关单为什么不用 RabbitMQ”**
- `企业真题.txt:452-453` 联科云创：**“什么时候会用到死信队列？订单超时未处理或者没有支付，会走死信队列么？”**
- `企业真题.txt:524` 海港城科技：**“mq 延迟队列实现自动关单”**
- `企业真题.txt:784` 点众科技：**“怎么用 rabbitmq 进行延迟消息发送”**
- `企业真题.txt:834` 人品科技：**“你用什么去做延迟关单的”**
- `企业真题.txt:526` 海港城科技：**“为什么订单过期时间设置为 15 分钟”**

#### 代码位置

**发送延迟消息** —— `OrderInfoServiceImpl#sendDelayMessage:349-361`

```java
private void sendDelayMessage(Long orderId) {
    //1 使用 redissonClient 创建普通队列
    RBlockingQueue<Object> blockingQueue =
            redissonClient.getBlockingQueue(MqConst.EXCHANGE_CANCEL_ORDER);
    //2 把普通队列变成延迟队列
    RDelayedQueue<Object> delayedQueue = redissonClient.getDelayedQueue(blockingQueue);
    //3 向延迟队列添加消息，设置消息过期时间
    delayedQueue.offer(orderId.toString(), 30, TimeUnit.MINUTES);
}
```

**消费端** —— `RedisDelayHandle:21-45`

```java
@Component
public class RedisDelayHandle {
    @PostConstruct
    public void listener() {
        //创建新线程一直监听延迟队列
        new Thread(()->{
            while(true) {
                try {
                    RBlockingQueue<String> blockingQueue =
                            redissonClient.getBlockingQueue(MqConst.EXCHANGE_CANCEL_ORDER);
                    String orderId = blockingQueue.take();
                    if(StringUtils.hasText(orderId)) {
                        orderInfoService.cancelOrder(Long.parseLong(orderId));
                    }
                } catch (InterruptedException e) {
                    throw new RuntimeException(e);
                }
            }
        }).start();
    }
}
```

#### ✅ 面试就按这个说

> 订单创建后会发一条**延迟 30 分钟**的消息，30 分钟后消费者拿到 `orderId`，**先查订单状态，如果是”未支付”就改成”已取消”**（已支付的就不动）。
>
> 我们用 **Redisson 的 `RDelayedQueue`**：它的底层是 **ZSet + ListPubSub**——<br>`offer` 消息时，把消息按”投递时间戳”作为 score 放进一个 **ZSet**；同时有个后台任务轮询 ZSet，**把到期的消息转移到普通的 `RBlockingQueue`**；消费者从队列 `take()` 拿到消息。
>
> 好处是**精度高（毫秒级）、实现简单**，不用额外部署插件。

#### ⛔⚠️ 真实缺陷：这段代码有 4 个问题（风险 ★★★★★）

**问题 1：用裸线程 + `while(true)`，异常后线程永久死亡**

```java
new Thread(()->{
    while(true) {
        try {
            ...
        } catch (InterruptedException e) {
            throw new RuntimeException(e);   // ← 抛出去，线程就死了！
        }
    }
}).start();
```

⚠️ `RuntimeException` 一旦抛出，`while(true)` 就**彻底退出**，整个**监听线程死亡**，之后**所有订单都不会再自动取消了**。而且**没有任何重启机制、没有任何错误日志和告警**。

更严重的是：`cancelOrder` 内部如果抛业务异常（比如订单查不到导致 NPE），**这个异常根本没被 catch**（catch 的只有 `InterruptedException`），同样会杀死线程。

> **✅ 改进**：
>
> ```java
> while(true) {
>     try {
>         String orderId = blockingQueue.take();
>         orderInfoService.cancelOrder(Long.parseLong(orderId));
>     } catch (InterruptedException e) {
>         Thread.currentThread().interrupt();   // 恢复中断标志，优雅退出
>         break;
>     } catch (Exception e) {
>         log.error("延迟关单失败", e);           // 业务异常只记日志，不退出循环
>     }
> }
> ```
>
> 而且**不该用裸线程**，应该用**线程池**（`@Bean ThreadPoolExecutor`），并且记录 `Future`，在 `@PreDestroy` 里优雅关闭。

**问题 2：多实例部署会重复消费**

⚠️ 如果 `service-order` 部署了 2 个实例，**两个实例各自起一个线程**监听同一个 `RBlockingQueue`。

实际上 Redisson 的 `RBlockingQueue` 底层用的是 **`BLPOP`**，它**是”一个消息只被一个消费者拿到”**的（队列语义，不是发布订阅），所以**不会重复消费**——这点它比 RabbitMQ 的广播更安全。

**但真正的问题是**：**Redisson 的 `take()` 是阻塞的，消费者宕机时消息会「丢失在途」**——`take()` 拿到了消息但没处理完就宕机，这条消息**就没了**（因为没有 ack 机制）。

> **✅ 改进**：用 **`RReliableQueue`**（Redisson 提供的可靠队列），它支持 ack，消费者宕机后消息会**重新入队**。

**问题 3：消息只在 Redis 里，Redis 挂了就丢**

> `RDelayedQueue` 的数据存在 Redis。**如果 Redis 没有开持久化（RDB/AOF），Redis 重启后所有待投递的延迟消息就丢了**，订单永远不会被关闭。<br>**✅ 改进**：① Redis 开启 **AOF**（`appendfsync everysec`）；② 兜底用**定时任务扫描**：每小时扫一次”创建超过 30 分钟且状态还是未支付”的订单，补一刀。

**问题 4：（这是最巧妙的）**

⚠️ `cancelOrder` 里的**状态判断不是原子的**：

```java
// OrderInfoServiceImpl#cancelOrder:289-296
public void cancelOrder(Long orderId) {
    OrderInfo orderInfo = orderInfoMapper.selectById(orderId);
    if(orderInfo.getOrderStatus().equals("0901")) {    // 查
        orderInfo.setOrderStatus("0903");
        orderInfoMapper.updateById(orderInfo);          // 改 —— 两步非原子
    }
}
```

**竞态场景**：用户在 30 分钟整点支付成功（回调把状态改成 0902），同时延迟消息到达。如果**延迟消息先读到 0901、支付回调后改成 0902、延迟消息再覆盖成 0903** → **用户付了钱，订单却被取消了！**

> **✅ 改进**：改成**带状态条件的原子更新**：
>
> ```sql
> UPDATE order_info SET order_status = '0903'
> WHERE id = #{orderId} AND order_status = '0901'
> ```
>
> 影响行数为 0 就说明状态已经变了，什么都不做。**这是”状态机 + CAS”的标准做法。**

#### ✅ 回答「恒天瑞讯：发完延迟消息，宕机重启会有问题吗？」

**这是恒天瑞讯的原题，非常刁钻**：

> **要分会话说，分两种情况**：
>
> **情况一：消息已经 `offer` 进 Redis 了，然后服务重启** → **不会有问题**。因为消息存在 **Redis 的 ZSet** 里，不是 JVM 内存。服务重启后，`@PostConstruct` 重新起监听线程，Redisson 的轮询任务会**继续把到期的消息投递**到队列，消费者照样能消费到。
>
> **情况二：消息还没发出去（`offer` 之前宕机）** → **有问题，订单永远不会被自动关闭**。因为 `saveOrder` 里”插入订单”和”发送延迟消息”**不在同一个事务里**，如果插完单就宕机，消息没发出去，这条订单就成了”僵尸订单”。
>
> **所以正确的设计必须有「兜底扫描」**：用一个 **XXL-JOB 定时任务**，每 5 分钟扫一次：
>
> ```sql
> SELECT * FROM order_info
> WHERE order_status = '0901' AND create_time < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
> ```
>
> 把这些”超时未支付”的订单批量关掉。**这样即使延迟消息丢了，也只是”晚关闭几分钟”，不会永久漏掉。**
>
> **这也说明一个通用原则：延迟消息负责”及时性”，定时任务负责”正确性”。两者缺一不可。**

#### ✅ 回答「为什么用 Redisson 做延迟关单，不用 RabbitMQ？」

**东软汉和的原题**，要讲出**选型对比**：

> 三种延迟方案我都了解，说下对比：
>
> | 方案 | 原理 | 精度 | 缺点 |
> | --- | --- | --- | --- |
> | **RabbitMQ TTL + 死信队列** | 消息设 TTL，过期进死信队列 | 秒级 | ⚠️ **有”队头阻塞”问题**：队列是 FIFO，如果队头消息 TTL 很长，后面的短 TTL 消息要**等队头出队才能被判定过期**，导致延迟不准 |
> | **RabbitMQ 延迟插件** | `rabbitmq_delayed_message_exchange` | 毫秒级 | **要额外装插件**，运维成本；且延迟消息多时**性能下降**（消息堆积在插件内部） |
> | **Redisson `RDelayedQueue`**（我们的） | ZSet 按时间排序 + 后台轮询 | 毫秒级 | 依赖 Redis；Redis 挂了会丢 |
> | **时间轮**（Netty/Kafka） | 环形数组 + 多层分级 | 毫秒级 | 需要自己实现，内存态，重启丢失 |
>
> **我们选 Redisson 的原因**：<br>**① 项目已经在用 Redisson**（分布式锁），**不引入新组件**，运维成本低；<br>**② 精度够**（订单关闭差几秒无所谓）；<br>**③ 不用装 RabbitMQ 插件**，避免运维复杂度。
>
> **如果让我重新选**，考虑到**可靠性**，我会选 **RabbitMQ 延迟插件**或者\*\*”定时任务扫描”**——因为**Redis 的数据可靠性不如 MQ\*\*（MQ 有持久化 + ack + 重试），订单这种**和钱相关**的业务，**宁可重一点也要稳**。
>
> 另外还要说个**关键细节**：不管用哪种延迟方案，**必须配一个兜底扫描任务**。因为延迟消息本质是”尽力而为”，**只有 DB 里的状态才是唯一真相**。

#### ✅ 追问：「为什么订单过期时间设 15/30 分钟？」

**海港城科技原题**：

> 这个时间是**业务和技术的折中**：<br>**① 业务上**：太短（比如 5 分钟）用户来不及支付，体验差；太长（比如 2 小时）库存/权益被长时间占用（我们是虚拟商品，主要是**价格波动风险**）。<br>**② 技术上**：这个值决定了**延迟消息在 Redis 里堆积的量**。用 Little’s Law 估算：如果下单 QPS 是 100，延迟 30 分钟，那 Redis 里会有 `100 × 1800 = 18 万` 条待投递消息。时间越长、堆积越多。
>
> 电商一般是 **15 分钟**（淘宝）或 **30 分钟**（我们）。这个值应该做成**配置**，不同业务线可以调。

---

### 4.7 第 4 章追问链速查

| 追问 | 答题要点 |
| --- | --- |
| 下单流程 | trade（算钱+流水号+签名）→ submitOrder（验签+防重+落单） |
| 订单号何时生成 | 提交时生成；UUID→建议雪花算法+业务前缀 |
| 为什么流水号能防重 | 一次性凭证，比对+删除原子（Lua） |
| 为什么”删除成功”是第一次 | 凭证存在=未用，删除=消费；反过来理解 |
| 不用 Lua 会怎样 | 并发下两个请求都 get 成功→都下单 |
| 流水号无 TTL 的后果 | 内存膨胀 + 失去时效性 |
| 集群下有效吗 | 有效，Redis 中心化；Cluster 注意 CROSSSLOT |
| 验签防什么 | 金额篡改；MD5 拼接要带 key；密钥别硬编码 |
| 商家改价怎么办 | 下单快照锁价 + 支付回调兜底校验 |
| 余额怎么不超扣 | `UPDATE ... WHERE available >= ?` |
| 先查再算再更新的坑 | 丢失更新；要 `SET x = x - ?` |
| 金额为什么用 BigDecimal | double 二进制误差；`valueOf`/`compareTo` |
| 支付成功权益没发 | 分布式事务（Seata/TCC/本地消息表）+ 对账 |
| 延迟关单用什么 | Redisson `RDelayedQueue`（ZSet+轮询） |
| 为什么不用 RabbitMQ | TTL 队头阻塞 / 插件运维成本 |
| 宕机重启会丢吗 | 消息在 Redis 不丢；发送前宕机才丢→兜底扫描 |
| 关闭与支付并发 | `UPDATE ... WHERE status='未支付'` 原子更新 |

---

## 5. 支付与账户

> **一句话总述**：微信支付 V3（JSAPI），先落支付记录再调微信下单，支付结果通过**异步回调**通知，回调里更新订单状态并发 MQ 通知下游。

### 5.1 🔥 微信支付全流程

**面试官原话**

- `企业真题.txt:212` 上海魁鲸：**“怎么解决微信支付的回调不成功的问题”**
- `企业真题.txt:441` 神州信息：**“微信支付是怎么保证支付成功后确认的”**
- `企业真题.txt:336` Test云测：**“微信支付是怎么做的”**
- `企业真题.txt:787` 点众科技：**“支付功能是怎么完成的?”**
- `企业真题.txt:934` 中科软：**“支付功能怎么实现的”**
- `企业真题.txt:209` 上海魁鲸：**“支付有几种支付模式”**
- `企业真题.txt:213` 上海魁鲸：**“项目使用支付宝支付的流程”**
- `企业真题.txt:1536` 中移：**“支付的时候怎样防止用户重复支付”**

#### 代码位置

```java
// WxPayServiceImpl#createJsapi:51-116（简化）
public Map createJsapi(String paymentType, String orderNo, Long userId) {
    //1 如果是购买（不是充值），判断订单不能是已取消
    if(!paymentType.equals(SystemConstant.PAYMENT_TYPE_RECHARGE)) {
        OrderInfo orderInfo = orderInfoFeignClient.getOrderInfo(orderNo).getData();
        if (SystemConstant.ORDER_STATUS_CANCEL.equals(orderInfo.getOrderStatus())){
            return null;      // 订单已取消，不发起支付
        }
    }
    //2 添加支付记录到支付记录表（状态-未支付）
    PaymentInfo paymentInfo = paymentInfoService.savePaymentInfo(paymentType, orderNo);

    //3 发起微信支付请求
    JsapiServiceExtension service = new JsapiServiceExtension.Builder()
            .config(rsaAutoCertificateConfig).build();
    PrepayRequest request = new PrepayRequest();
    Amount amount = new Amount();
    amount.setTotal(1);                       // ⚠️ 写死 1 分钱！
    request.setAmount(amount);
    request.setAppid(wxPayV3Config.getAppid());
    request.setMchid(wxPayV3Config.getMerchantId());
    request.setDescription(paymentInfo.getContent());
    request.setNotifyUrl(wxPayV3Config.getNotifyUrl());   // ← 回调地址
    request.setOutTradeNo(paymentInfo.getOrderNo());
    // 设置 payer.openid
    Payer payer = new Payer();
    payer.setOpenid(userInfoVo.getWxOpenId());
    request.setPayer(payer);

    //4 调用微信，拿到用于前端调起支付的参数
    PrepayWithRequestPaymentResponse response = service.prepayWithRequestPayment(request);
    Map<String, Object> result = new HashMap();
    result.put("timeStamp", response.getTimeStamp());
    result.put("nonceStr", response.getNonceStr());
    result.put("package", response.getPackageVal());
    result.put("signType", response.getSignType());
    result.put("paySign", response.getPaySign());
    return result;
}
```

#### ✅ 面试就按这个说

> 我们对接的是**微信支付 V3 的 JSAPI 支付**（因为是小程序）。
>
> **完整流程**：<br>**① 下单前校验**：先查订单状态，**如果订单已被取消就不发起支付**。<br>**② 落支付记录**：在 `payment_info` 表插一条**未支付**的支付流水（`orderNo`、金额、支付方式）。<br>**③ 调微信统一下单**：用微信 V3 SDK 的 `prepayWithRequestPayment`，传 appid、商户号、金额、`out_trade_no`（我们用自己的订单号）、`notify_url`（回调地址）、用户 openid。<br>**④ 微信返回** `prepay_id`，SDK 帮我们组装好 `timeStamp / nonceStr / package / signType / paySign`，返回给前端。<br>**⑤ 前端调 `wx.requestPayment`** 拉起支付。<br>**⑥ 支付结果通过两个渠道确认**：
>
> - **异步回调（主）**：微信 POST 到我们的 `notify_url`，我们**验签 + 解密**后，更新订单状态为已支付，并发 MQ 通知下游（加购买记录等）；
> - **主动查单（兜底）**：前端支付完成后调我们的”查询支付状态”接口，我们用 `queryOrderByOutTradeNo` **主动查微信**，防止回调丢失。

#### ⚠️ 真实情况：3 个问题

**问题 1：金额写死 1 分钱（风险 ★★★★☆）**

```java
amount.setTotal(1);   // ⚠️ 注释里写着 "TODO 支付金额 支付0.01"
```

⚠️ 这在**教学/测试**环境是为了省事，但**如果上了生产就是重大事故**——用户买 199 元的专辑只付 1 分钱。

> **✅ 正确做法**：
>
> ```java
> // 从订单查实付金额，单位"分"
> amount.setTotal(orderInfo.getOrderAmount()
>         .multiply(new BigDecimal("100"))
>         .intValueExact());
> ```
>
> 而且**金额必须从后端查订单拿，绝对不能信前端传的金额**。

**问题 2：`createNative` 里异常被吞掉**

```java
// WxPayServiceImpl.java:161-165
} catch (Exception e) {
    e.printStackTrace();     // ⚠️ 只打印，方法返回 null
}
return null;
```

⚠️ 调用方拿到 `null` 完全**不知道是”失败了”还是”没数据”**，也没法重试。而且 `e.printStackTrace()` 不走日志框架，线上**收集不到**。

> **✅ 改进**：用 `log.error()` 记录，并**抛出自定义异常**让上游知道失败了。

**问题 3：支付记录缺少幂等控制**

`savePaymentInfo` 每次调用都**插入一条新的支付记录**。如果用户反复点”去支付”，`payment_info` 表会有**一堆重复流水**。

> **✅ 改进**：`payment_info` 表上给 `order_no` 加**唯一索引**，或者先查后插（配合分布式锁）。

---

### 5.2 🔥 支付回调的幂等与安全

**面试官原话**（`企业真题.txt:212` 上海魁鲸：**“怎么解决微信支付的回调不成功的问题”**；`企业真题.txt:1536` 中移：**“支付的时候怎样防止用户重复支付”**）

#### ✅ 面试就按这个说（回调必须做 4 件事）

> 微信支付回调接口是**和钱相关的关键路径**，我做了四件事：
>
> **① 验签 + 解密**：微信 V3 的回调用 `WechatPay-Signature` 等请求头做签名校验，body 是 **AES-256-GCM 加密**的，必须用 APIv3 密钥解密。**不验签的回调接口等于把”发钱”的开关暴露在公网**。
>
> **② 幂等**：微信的回调**会重试**（没返回成功就按策略重试多次），所以**必须幂等**。我的做法是：
>
> ```java
> // 查订单/支付记录状态
> if (SystemConstant.ORDER_STATUS_PAID.equals(orderInfo.getOrderStatus())) {
>     return "SUCCESS";     // 已经是已支付，直接返回成功，不重复处理
> }
> ```
>
> 这就是**状态机幂等**——只有”未支付”才能流转到”已支付”。
>
> 我们的 `RechargeInfoServiceImpl.rechargePaySuccess:56-61` 就是这么写的：
>
> ```java
> // 如果当前状态是已支付，则直接返回
> if (SystemConstant.ORDER_STATUS_PAID.equals(rechargeInfo.getRechargeStatus())) return;
> ```
>
> **③ 用订单号做分布式锁**：防止两个回调（或”回调 + 主动查单”）**并发**进入。用 Redisson 按 `orderNo` 加锁，串行化处理。
>
> **④ 金额校验**：**对比回调里的金额和订单实际金额**，不一致说明有问题（可能被人篡改或用超低价订单号刷），必须告警并人工介入。

#### ✅ 追问：「回调一直不来怎么办？」（上海魁鲸原题）

> 这是个很实际的问题。回调丢失的原因可能是：**网络抖动、我们的服务在重启、URL 配错、防火墙拦截**。
>
> **三层兜底**：<br>**① 前端主动查**：用户支付完成后，小程序会调我们的”查询支付状态”接口，我们用 `queryOrderByOutTradeNo` **主动去微信查单**。这是**最及时**的兜底。<br>**② 定时补偿任务**：XXL-JOB 每 1~5 分钟扫一次”**创建超过 N 分钟、状态还是未支付、但支付流水状态是支付中**“的订单，**主动查微信**，查到已支付就补偿处理。<br>**③ 日终对账**：每天凌晨拉**微信的账单文件**，和我们 `payment_info` 表逐笔比对，**长款短款都告警**。这是**资金安全的最后一道防线**。
>
> **另外有个细节**：微信要求回调**必须返回 `{"code":"SUCCESS"}`**，否则它会认为失败并重试。所以我们的回调接口**必须保证能正常返回**——**业务处理要异步化**（收到回调先落库、返回成功，再异步发 MQ 处理），避免业务逻辑耗时太长导致微信超时重试。

#### ✅ 追问：「怎么防止用户重复支付？」

**中移原题**：

> **① 前端**：支付中禁用按钮；<br>**② 后端**：支付前查订单状态，**已支付/已取消就拒绝**（我们 `createJsapi:63-66` 做了已取消的判断，但**没做已支付的判断**，这是我发现的一个改进点）；<br>**③ 支付表唯一索引**：`payment_info` 的 `order_no` 加唯一索引，同一订单只能有一条有效支付记录；<br>**④ 微信侧**：`out_trade_no` 是唯一的，**同一订单号重复下单，微信会返回同一个 `prepay_id`**，不会产生两笔支付。

---

### 5.3 充值幂等（这是项目里的亮点，可以主动讲）

**面试官原话**（`企业真题.txt:4` 京东：**“怎么保证事务的幂等性”**）

#### 代码位置

```java
// RechargeInfoServiceImpl#rechargePaySuccess:56-87
@Override
public void rechargePaySuccess(String orderNo) {
    RechargeInfo rechargeInfo = this.getRechargeInfoByOrderNo(orderNo);
    // 如果当前状态是已支付，则直接返回       ← ★ 幂等判断
    if (SystemConstant.ORDER_STATUS_PAID.equals(rechargeInfo.getRechargeStatus())) return;
    // 否则赋值为已支付状态
    rechargeInfo.setRechargeStatus(SystemConstant.ORDER_STATUS_PAID);
    this.updateById(rechargeInfo);

    //更新账户金额
    BigDecimal rechargeAmount = rechargeInfo.getRechargeAmount();
    Long userId = rechargeInfo.getUserId();
    UserAccount userAccount = userAccountService.getOne(wrapper);
    userAccount.setTotalAmount(userAccount.getTotalAmount().add(rechargeAmount));
    userAccount.setAvailableAmount(userAccount.getAvailableAmount().add(rechargeAmount));
    userAccountService.update(userAccount, wrapper1);
}
```

#### ✅ 可以主动讲（这是全项目少见的做对了的幂等）

> 充值成功通知这里我做了**幂等**：MQ 消息可能**重复投递**（RabbitMQ 的 at-least-once 语义），所以我在方法开头**先查充值单状态**，如果已经是”已支付”，**直接 return，不做任何处理**。<br>这样无论消息来几次，**用户的余额只会增加一次**。这是”**状态机幂等**“——用状态流转来保证只执行一次。

#### ⚠️ 但也要说清它的问题（体现你的严谨）

> 不过这个幂等**在并发下还不够严谨**：它是”**先查状态、再更新**“，两步之间如果有两个线程同时进来，**可能都查到”未支付”**，然后都去加钱 → **加两次**。
>
> **✅ 更严谨的写法是加乐观锁或者条件更新**：
>
> ```sql
> UPDATE recharge_info SET recharge_status = '0902'
> WHERE order_no = #{orderNo} AND recharge_status = '0901'
> ```
>
> **影响行数为 0 就说明已经被处理过，直接返回**。这样”判断 + 更新”是一次原子操作。<br>或者给余额表加 `version` 字段做乐观锁。

> 💡 **这题的价值**：主动说出”我做了幂等，但并发下还能更严谨”，比单纯说”我做了幂等”分数高得多。

---

### 5.4 余额是自己管理还是微信接口？

**面试官原话**（`企业真题.txt:19` 恒天瑞讯：**“余额是自己做管理还是说微信里有这样的接口？”**；`企业真题.txt:443` 神州信息：**“支付成功后钱去哪了？用户在用余额支付购买专辑后，公司财务是怎么变化的？”**）

#### ✅ 面试就按这个说

> **余额完全是我们自己管理的**，微信**不提供**“钱包余额”这种能力（微信只负责**收单**，钱直接进商户号）。
>
> **我们的余额是三个来源**：<br>**① 用户充值**：通过微信支付充值 → 微信回调通知我们 → 我们给 `user_account.available_amount` 加钱；<br>**② 退款/补偿**：出问题时人工或系统补；<br>**③ 初始值 0**：首次登录时初始化账户（`initUserAccount`）。
>
> **账户表设计**：`user_account` 有 `total_amount`（累计总额）和 `available_amount`（可用余额）两个字段，还有一张 `user_account_detail` **流水表**记录每一笔收支（`trade_type` 区分充值/消费、关联 `order_no`）。
>
> **为什么要有流水表？** 因为**余额是”结果”，流水才是”真相”**。任何一笔余额变动都必须有对应的流水，这样才能**对账**——如果 `available_amount` 和”所有流水累加”对不上，说明有 bug 或被篡改。

#### ✅ 追问：「支付成功后，钱去哪了？公司财务怎么变化？」

**神州信息的原题，考的是你对资金流的理解**：

> 要分**两种支付方式**说：
>
> **微信支付**：钱**从用户微信 → 进公司微信商户号**，然后按 T+1 结算到公司银行账户。这个过程中我们的系统**只是记账**——我们记录订单已支付、发权益，**钱不在我们的系统里**。
>
> **余额支付**：这是**平台内部的账**，钱**没有真实流动**（因为用户早就充过值了，钱已经在公司账上了）。所以余额支付时：
>
> - `user_account.available_amount` **减少**（用户的钱变少）；
> - `user_account.total_amount` **减少**（累计消费）；
> - 同时写一条 `user_account_detail` 流水；
> - **公司的实际现金不变**，只是”预收账款”（负债）在减少。
>
> **财务视角**：用户充值的时候，公司确认的是**负债**（预收账款）；用户消费的时候，负债转为**收入**。所以我们系统里”充值”和”消费”必须**分开记账**，这也是为什么我们有两张表——`recharge_info`（充值）+ `order_info`（消费）。

---

## 6. 搜索与 ES

> **一句话总述**：专辑上架/下架通过 MQ 异步同步到 ES，检索用 ES Java Client 拼 DSL，支持关键词匹配、属性过滤、聚合、高亮和拼音补全。

### 6.1 🔥 MySQL → ES 数据同步（澄清：我们没用 Canal）

**面试官原话**

- `企业真题.txt:52` 北京诺来：**“你这边使用 Cana 和 Binlog 来去做这个缓存，能介绍一下这块的一个逻辑吗？缓存更新是自己实现的，还是使用 Canal 原生的一些东西？”**
- `企业真题.txt:698-699` 美团驻场：**“elasticsearch 和 mysql 怎么实现数据一致性？elasticsearch 和 mysql 之间是怎么保证及时更新的”**
- `企业真题.txt:1268` 华源格林：**“如何保证 es 与数据库中数据是一致性？”**
- `企业真题.txt:629` 北京瀚海博瑞：**“声音信息是怎么写入 es 的”**
- `企业真题.txt:6,9` 浙江凯瑞博、`:406` 及乐魔方、`:1268` 华源格林（Canal 高频）

#### ⛔ 重要：项目里**没有 Canal**

`面试题纯文本.txt:595-597` 你写了”**如何保证 ES 和数据库的数据一致性 —— 使用 canal 实现**“，但**代码里根本没有 Canal**。实际用的是 **RabbitMQ 双写**：

```java
// AlbumInfoServiceImpl#saveAlbumInfo:123-130
//判断专辑是否公开，如果公开，发送 mq 消息，实现专辑上架
String isOpen = albumInfo.getIsOpen();
if ("1".equals(isOpen)){
    rabbitService.sendMessage(MqConst.EXCHANGE_ALBUM,
                              MqConst.ROUTING_ALBUM_UPPER,     // ← 发 MQ 通知 ES 上架
                              albumInfo.getId());
}
```

```java
// SearchReceiver.java:22-32  ← ES 侧的消费者
@RabbitListener(bindings = @QueueBinding(
        exchange = @Exchange(value = MqConst.EXCHANGE_ALBUM, durable = "true"),
        value = @Queue(value = MqConst.QUEUE_ALBUM_UPPER, durable = "true"),
        key = {MqConst.ROUTING_ALBUM_UPPER}))
public void upper_album(Long albumId, Message message, Channel channel) {
    if(albumId != null) {
        searchService.upperAlbum(albumId);     // 查数据 → 组装 → 写入 ES
    }
    channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
}
```

#### ✅ 面试就按这个说（诚实口径）

> 我们用的是 **MQ 异步双写**：专辑保存/修改/删除后，发一条 MQ 消息，`service-search` 的消费者收到后**从各个服务拉数据组装成 ES 文档**，写入索引。
>
> **上架**：`EXCHANGE_ALBUM` + `ROUTING_ALBUM_UPPER` → 消费者调 `upperAlbum(albumId)` → 写 `albuminfo` 索引 + `suggestinfo` 补全索引。<br>**下架**：`ROUTING_ALBUM_LOWER` → `lowerAlbum(albumId)` → `deleteById`。

#### ✅ 追问：「为什么不用 Canal？」（这题必被问，要能对比）

> **Canal 和 MQ 双写是两种思路**：
>
> |  | **MQ 双写**（我们的） | **Canal** |
> | --- | --- | --- |
> | 原理 | 业务代码里主动发消息 | 伪装从库，订阅 **binlog** |
> | 侵入性 | **有**，业务代码要写发送逻辑 | **无**，业务代码不用改 |
> | 漏发风险 | ⚠️ **有**（见下面缺陷） | 低，只要 binlog 写成功就能捕获 |
> | 运维成本 | 低（复用现有 MQ） | 高（额外部署 Canal Server、要开 ROW 格式 binlog、有单点问题） |
> | 字段级感知 | 只能知道”变了” | **能知道具体哪一行哪些字段变了** |
>
> **我们选 MQ 双写的原因**：<br>**① 不引入新组件**，项目已经有 RabbitMQ；<br>**② 想同步的不只是”表数据”**——ES 文档需要**聚合多个服务的数据**（专辑信息 + 分类 + 主播昵称 + 统计数据 + 标签），Canal 只能拿到**单表**的原始数据，**组装逻辑还是得自己写**，所以 Canal 的优势在这里不明显。
>
> **但 MQ 双写有个经典缺陷**：如果”插库成功、发消息失败”，ES 就永远不会有这条数据。**这个问题的标准解法是「本地消息表」或「事务提交后再发消息」**，详见 6.2。

#### ✅ 追问：「ES 和 MySQL 怎么保证及时更新 / 一致性？」

> **严格来说做不到强一致，只能做到最终一致**。我们的保证手段：<br>**① 异步同步**：正常情况**秒级**同步（MQ 消费者处理很快）。<br>**② ES 的 refresh 延迟**：ES 写入后默认 **1 秒**才可见（`refresh_interval: 1s`）。如果要立即可见，可以写入时指定 `refresh=true`，但**性能会大幅下降**，不推荐。<br>**③ 兜底重建**：定时任务（XXL-JOB）**全量重建索引**（比如每天凌晨），修正累积的偏差。<br>**④ 业务上容忍**：搜索结果的**秒级延迟是可以接受的**——用户搜不到刚发布的专辑，刷新一下就有了。

---

### 6.2 ⚠️ 事务与消息的时序 bug（重要）

#### 代码位置

```java
// AlbumInfoServiceImpl#saveAlbumInfo:74-131
@Transactional                                    // ← 本地事务开始
@Override
public void saveAlbumInfo(AlbumInfoVo albumInfoVo) {
    albumInfoMapper.insert(albumInfo);            // ① 插专辑
    // ② 插标签
    albumAttributeValueMapper.insert(...);
    // ③ 插4条统计数据
    this.saveAlbumStat(...);

    // ④ 发 MQ
    if ("1".equals(isOpen)){
        rabbitService.sendMessage(MqConst.EXCHANGE_ALBUM,
                                  MqConst.ROUTING_ALBUM_UPPER,
                                  albumInfo.getId());   // ⚠️ 事务还没提交！
    }
}                                                  // ← 事务在这里才提交
```

#### ⚠️ 问题：消息可能在事务提交前就被消费

**时序**：

```text
① 插专辑（事务未提交，其他会话看不到）
② 发 MQ  → MQ 立刻投递
③ 消费者收到消息 → 调 albumInfoFeignClient.getAlbumInfo(albumId)
   → 此时事务还没提交 → 查不到数据（或查不到标签、统计数据）
   → Assert.notNull(albumInfo) 抛异常 / 或者写入一条不完整的 ES 文档
④ 事务提交
```

**结果**：ES 里要么**没有这条数据**，要么是一条**缺少标签、统计量为 0 的残缺文档**。

⚠️ 而且 `SearchServiceImpl.upperAlbum:477` 里有 `Assert.notNull(albumInfo,"专辑为空")`，这个异常会**直接抛出**；`SearchReceiver` 里 `@SneakyThrows` + 后面还有 `basicAck` —— 但由于异常先抛出，**`basicAck` 不会执行**，消息会**重回队列反复重试**，形成**消费死循环**。

#### ✅ 面试就按这个说（这是加分项）

> 这里的正确做法是 **“事务提交后再发消息”**。有三种实现方式：
>
> **方案一：`TransactionSynchronizationManager` 注册回调（推荐，改动最小）**
>
> ```java
> TransactionSynchronizationManager.registerSynchronization(
>     new TransactionSynchronization() {
>         @Override
>         public void afterCommit() {
>             rabbitService.sendMessage(EXCHANGE, ROUTING, albumId);
>         }
>     });
> ```
>
> **只在事务真正提交成功后才发消息**。如果事务回滚，消息就不会发出去。
>
> **方案二：本地消息表（最可靠）**<br>在专辑库里加一张 `mq_message` 表，”插专辑”和”插消息记录”**在同一个本地事务**里；然后由**定时任务或独立的发送线程**扫描未发送的消息去投递，成功就标记已发送。<br>**优点**：即使服务宕机、MQ 挂了，消息也不会丢；**天然幂等**（消息有唯一 ID）。这是\*\*”最终一致性”最经典的方案\*\*。
>
> **方案三：直接同步调用（最简单但不推荐）**<br>事务提交后，同步调 Feign 让 `service-search` 写 ES。缺点是把 ES 的可用性**耦合**到了专辑保存上——ES 挂了，专辑就保存不了。

> 💡 **通用原则**：**“事务未提交就发消息”是分布式系统里最常见的坑之一**。任何”DB 操作 + 消息投递”的组合，都要问自己一句：**“如果消息先到、事务后提交，会发生什么？”**

---

### 6.3 ⚠️ 统计量造假与排行榜

**面试官原话**（`企业真题.txt:785` 点众科技：**“怎么实现热点数据排序的”**；`企业真题.txt:546` Kmerit；`项目面试题.txt:20`）

#### ⚠️ 代码里是随机数

```java
// SearchServiceImpl#upperAlbum:516-528
//TODO 为了测试方便，四个统计数据随机数
//更新统计量与得分，默认随机，方便测试
int num1 = new Random().nextInt(1000);     // 播放量
int num2 = new Random().nextInt(100);      // 订阅量
int num3 = new Random().nextInt(50);       // 购买量
int num4 = new Random().nextInt(300);      // 评论数
albumInfoIndex.setPlayStatNum(num1);
albumInfoIndex.setSubscribeStatNum(num2);
albumInfoIndex.setBuyStatNum(num3);
albumInfoIndex.setCommentStatNum(num4);
double hotScore = num1*0.2 + num2*0.3 + num3*0.4 + num4*0.1;   // 拍脑袋的权重
albumInfoIndex.setHotScore(hotScore);
```

⚠️ **注意**：上面注释掉的代码才是对的：

```java
//Integer playStatNum = (Integer) map.get("playStatNum");
//albumInfoIndex.setPlayStatNum(playStatNum);
```

也就是说，**代码里已经查出了真实的统计数据（`albumInfoStatResult`），但没用，而是塞了随机数**。

#### ✅ 面试就按这个说（诚实 + 讲热度算法）

> ES 里有个 `hotScore` 字段就是这个专辑的**热度分**，检索时可以作为排序字段。
>
> **热度的计算是一个加权公式**，把几个维度的统计量归一化后加权求和：<br>`hotScore = 播放量×0.2 + 订阅量×0.3 + 购买量×0.4 + 评论数×0.1`<br>**权重的设计意图**是：**购买量的权重最高**（真金白银最能反映价值），评论数最低（容易被水军刷）。
>
> ⚠️ 不过我要说明：我们的实现里**为了测试方便，这几个统计量是随机生成的**（代码里有 TODO），**真实数据其实已经查出来了但没用**。这个我是知道的，如果要做真实上线，应该：<br>**① 直接用 DB 里的真实统计值**；<br>**② 做归一化**——因为播放量可能是百万级、购买量是百级，直接加权会被播放量主导。应该用 **`log(1+x)`** 或者 **min-max 归一化**后再加权；<br>**③ 加上时间衰减**——用 `hotScore / (发布时间 + 2)^1.5`（这是 **Hacker News 的经典热度算法**），避免老专辑一直霸榜。

#### ✅ 追问：「排行榜是怎么实现的？」

**点众科技原题**：

```java
// SearchServiceImpl#updateLatelyAlbumRanking:77-117（简化）
for (BaseCategory1 category1 : category1List) {                        // 每个一级分类
    String[] rankingDimensionArray = new String[]{
        "hotScore", "playStatNum", "subscribeStatNum", "buyStatNum", "commentStatNum"};  // 5个维度
    for (String ranging : rankingDimensionArray) {                      // 每个维度
        SearchRequest.Builder builder = new SearchRequest.Builder();
        builder.index("albuminfo")
               .query(q->q.term(f->f.field("category1Id").value(category1Id)))
               .sort(s->s.field(o->o.field(ranging).order(SortOrder.Desc)))
               .size(10);                                              // 取前10
        SearchResponse<AlbumInfoIndex> response =
                elasticsearchClient.search(builder.build(), AlbumInfoIndex.class);
        // 存 Redis Hash：key=分类id, field=维度, value=专辑列表
        redisTemplate.opsForHash().put("ranking:" + category1Id, ranging, albumInfoIndexList);
    }
}
```

> **实现**：**XXL-JOB 每天跑一次**，从 ES 按不同维度查每个一级分类的 **Top 10**，存进 **Redis 的 Hash**（`key = ranking:{分类id}`，`field = 维度`，`value = 专辑列表`）。<br>前端查排行榜时**直接读 Redis**，不走 ES，**响应极快**。
>
> **为什么用 Hash 而不是 String？** 因为一个分类下有 5 个维度，用 Hash 可以**一次 `HMGET` 拿多个维度**，而且**可以单独更新某一个 field**，不用整体覆盖。
>
> ⚠️ **但这个实现有个性能问题**：它是**双层循环**——如果有 20 个一级分类，就要发 **20 × 5 = 100 次 ES 查询**。优化方案：<br>**① 用 ES 的聚合（`terms` + `top_hits`）一次查出所有分类**，像 `channel()` 方法那样；<br>**② 用 `msearch` 批量查询**；<br>**③ 或者直接算出全局 Top N 再按分类分组**。

---

### 6.4 ES 检索的 DSL 实现

**面试官原话**（`企业真题.txt:269` 华源格林：**“使用 es 进行模糊搜索的时候 dsl 语句如何编写”**；`企业真题.txt:245` 天津行至简：**“能直接编写 DSL 语句是吗”**；`企业真题.txt:988` 恒生宝泰：**“深度分页怎么进行处理”**；`企业真题.txt:757` 成途：**“倒排索引”**）

#### 代码位置：`SearchServiceImpl#buildQueryDsl:350-464`

```java
private SearchRequest buildQueryDsl(AlbumIndexQuery albumIndexQuery) {
    BoolQuery.Builder boolQuery = new BoolQuery.Builder();

    //1 关键词：match 分词查询（should）
    String keyword = albumIndexQuery.getKeyword();
    if(!StringUtils.isEmpty(keyword)) {
        boolQuery.should(s->s.match(f->f.field("albumTitle").query(keyword)));
        boolQuery.should(s->s.match(f->f.field("albumIntro").query(keyword)));
        // 高亮
        requestBuilder.highlight(h->h.fields("albumTitle",
                f->f.preTags("<span style=color:red>").postTags("</span>")));
    }
    //2 分类过滤：filter + term（精确，不走评分）
    if(!StringUtils.isEmpty(category3Id)) {
        boolQuery.filter(s->s.term(f->f.field("category3Id").value(category3Id)));
    }
    //3 属性过滤：nested 查询（因为属性是数组对象）
    for(String attribute : attributeList) {
        String[] split = attribute.split(":");     // "属性id:属性值id"
        NestedQuery nestedQuery = NestedQuery.of(f->f.path("attributeValueIndexList")
            .query(q->q.bool(m->m
                .must(t->t.term(f1->f1.field("attributeValueIndexList.attributeId").value(split[0])))
                .must(t->t.term(f1->f1.field("attributeValueIndexList.valueId").value(split[1]))))));
        boolQuery.filter(f->f.nested(nestedQuery));
    }
    //4 排序
    if(!StringUtils.isEmpty(order)) {
        // "1:asc" → hotScore asc；"2:desc" → playStatNum desc；"3:desc" → createTime desc
        requestBuilder.sort(f->f.field(f1->f1.field(finalOrderField).order(...)));
    } else {
        requestBuilder.sort(f->f.field(o->o.field("_score").order(SortOrder.Desc)));  // 默认按相关性
    }
    //5 分页
    Integer from = (albumIndexQuery.getPageNo() - 1)*albumIndexQuery.getPageSize();
    requestBuilder.from(from);
    requestBuilder.size(albumIndexQuery.getPageSize());
    return requestBuilder.index("albuminfo").query(f->f.bool(boolQuery.build())).build();
}
```

#### ✅ 面试就按这个说

> 检索的 DSL 分了五块：<br>**① 关键词**：用 **`match`** 查询 `albumTitle` 和 `albumIntro`，走分词器，放在 **`should`** 里（满足任一即可，影响相关性评分）。<br>**② 分类过滤**：用 **`filter` + `term`**，因为分类是**精确匹配、不需要算分**，放 `filter` 里还能**利用查询缓存**，性能更好。<br>**③ 属性过滤**：专辑属性是**数组对象**（一个专辑有多个”属性-属性值”对），所以必须用 **`nested`** 查询——**普通数组会把不同对象的字段”扁平化”**，导致”属性A=值1 且 属性B=值2”误匹配成”属性A=值2”。`nested` 把每个对象**独立成隐藏文档**，保证条件在**同一个对象内**满足。<br>**④ 排序**：支持综合、播放量、发布时间三种；不传就按 **`_score`**（相关性）。<br>**⑤ 高亮**：用 `preTags/postTags` 包 `<span style=color:red>`。

#### ✅ 追问：「`must` 和 `filter` 有什么区别？」

**这是高频细节题**：

> **两者都会过滤文档，区别在于”算不算分”**：
>
> - **`must`**：参与**相关性评分**（`_score`），会计算 TF-IDF/BM25；
> - **`filter`**：**不参与评分**，而且结果**可以被 ES 缓存**（filter cache）。
>
> 所以**原则是**：**需要影响排序的（如关键词匹配）用 `must`/`should`，纯粹的筛选条件（分类、价格区间、属性）用 `filter`**。<br>我们代码里就是这么分的——关键词用 `should`，分类和属性用 `filter`。

#### ✅ 追问：「倒排索引是什么？」

**成途/柯莱特高频题**：

> **正排索引**是”文档 → 内容”（像书的目录页，先找到书再看内容）；<br>**倒排索引**是”**词条 → 文档列表**“（像书末的**索引**，从关键词直接定位到页码）。
>
> ES 的倒排索引结构是：<br>**`Term Dictionary`（词项字典）**：所有分词后的词，**有序排列**，可以用**二分查找**（在内存里用 **FST** 压缩存储，进一步省空间）；<br>**`Posting List`（倒排列表）**：每个词对应的**文档 ID 列表**，还存了**词频、位置**（用于短语查询和高亮）。
>
> **为什么快**：不用扫描所有文档，**直接通过词找到文档集合**，然后做集合运算（AND/OR）。这就是 ES 比 `LIKE '%关键词%'` 快几个数量级的根本原因——**`LIKE %` 无法用 B+ 树，只能全表扫描**。

#### ✅ 追问：「深分页怎么处理？」

**恒生宝泰原题**：

> **问题**：ES 默认 `from + size` 最大 **10000**。因为深分页时，**每个分片都要返回 `from + size` 条数据给协调节点**，协调节点排序后丢弃前面的——**翻到第 1000 页，要传 100 万条数据**，内存和网络都会爆炸。
>
> **三种方案**：<br>**① `search_after`（推荐）**：用上一页最后一条的**排序值**作为游标。**只适合”下一页”**，不能跳页。我们前端如果是**无限滚动**就很合适。<br>**② `scroll`**：生成**快照**，适合**导出全量数据**（比如数据迁移），不适合实时查询。<br>**③ 限制跳页范围**：像百度一样**只允许翻到前 N 页**，这是最简单也最常见的产品级方案。

---

### 6.5 第 6 章追问链速查

| 追问 | 答题要点 |
| --- | --- |
| ES 和 MySQL 怎么同步 | MQ 双写（我们）/ Canal（没用） |
| Canal 原理 | 伪装从库订阅 binlog，需 ROW 格式 |
| 为什么不用 Canal | 要装组件、单点、多表聚合还得自己写 |
| 事务未提交发 MQ | 消费者查不到数据；`afterCommit` / 本地消息表 |
| ES 一致性 | 只能最终一致；refresh 1s；定时重建 |
| 热度算法 | 加权 + 归一化 + 时间衰减 |
| 排行榜为什么用 Hash | 多维度、可单字段更新 |
| match vs term | 分词 vs 不分词 |
| must vs filter | 算分 vs 不算分（可缓存） |
| 为什么用 nested | 避免数组对象字段扁平化误匹配 |
| 倒排索引 | 词项字典 + 倒排列表；FST 压缩 |
| 深分页 | from+size ≤ 10000；search\_after / scroll |
| 分词器 | ik\_max\_word（细粒度）/ ik\_smart（粗粒度） |
| 拼音补全 | Completion Suggester + pinyin4j |

---

## 7. RabbitMQ 可靠性与幂等

> **一句话总述**：生产端用 confirm + return + 重试保证可靠投递，消费端手动 ack，业务上用状态机保证幂等。

### 7.1 🔥 消息不丢失（全链路）

**面试官原话**

- `企业真题.txt:56` 上海科旭：**“MQ 如何保证消息不丢失”**
- `企业真题.txt:236` 天津行至简：**“RabbitMq 怎么保证消息不丢失，消息不重复消费”**
- `企业真题.txt:1127` 高伟达：**“用的哪个消息中间件，在使用过程中如何保证消息不丢失”**
- `企业真题.txt:1479` 软通动力（京东工程师）：**“rabbitMQ 和多线程都能实现异步，为什么选择使用 rabbitMQ？怎么理解得多线程”**
- `企业真题.txt:1335` 太极：**“rabbitmq 和 rocketmq 的区别为什么使用 rabbitmq（不要理论）”**

#### 代码位置：可靠性投递的三层保障

```java
// RabbitInitConfigApplicationListener.java:32-74
private void setupCallbacks() {
    //① 确认模式：消息是否到达【交换机】
    this.rabbitTemplate.setConfirmCallback((correlationData, ack, reason) -> {
        if (ack) {
            log.info("消息发送到Exchange成功：{}", correlationData);
        } else {
            log.error("消息发送到Exchange失败：{}", reason);
            this.retrySendMsg(correlationData);      // 失败重发
        }
    });

    //② 返回模式：消息是否从【交换机到达队列】
    this.rabbitTemplate.setReturnsCallback(returned -> {
        log.error("Returned: " + returned.getMessage() + "\nreplyCode: " + returned.getReplyCode()
                + "\nreplyText: " + returned.getReplyText() + "\nexchange/rk: "
                + returned.getExchange() + "/" + returned.getRoutingKey());
        // 路由队列失败，也需要重发
        String redisKey = returned.getMessage().getMessageProperties()
                                .getHeader("spring_returned_message_correlation");
        String correlationDataStr = (String) redisTemplate.opsForValue().get(redisKey);
        GuiguCorrelationData guiguCorrelationData =
                JSON.parseObject(correlationDataStr, GuiguCorrelationData.class);
        if(guiguCorrelationData.isDelay()){ return; }
        this.retrySendMsg(guiguCorrelationData);
    });
}

//③ 重试（最多 3 次）
private void retrySendMsg(CorrelationData correlationData) {
    GuiguCorrelationData gmallCorrelationData = (GuiguCorrelationData) correlationData;
    int retryCount = gmallCorrelationData.getRetryCount();
    if (retryCount >= 3) {
        log.error("生产者超过最大重试次数，将失败的消息存入数据库用人工处理；给管理员发送邮件；...");
        return;                                    // 超过3次，转人工
    }
    retryCount += 1;
    gmallCorrelationData.setRetryCount(retryCount);
    redisTemplate.opsForValue().set(gmallCorrelationData.getId(),
            JSON.toJSONString(gmallCorrelationData), 10, TimeUnit.MINUTES);
    // 重发
    rabbitTemplate.convertAndSend(...);
}
```

消费端手动 ack：

```java
// SearchReceiver.java:27-32
public void upper_album(Long albumId, Message message, Channel channel) {
    if(albumId != null) {
        searchService.upperAlbum(albumId);
    }
    channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);   // 手动确认
}
```

#### ✅ 面试就按这个说（”三阶段”模型）

> 消息从生产者到消费者要经过 **生产者 → 交换机 → 队列 → 消费者** 四个环节，我在**每个环节**都做了保障：
>
> **① 生产者 → 交换机：`confirm` 确认模式**<br>开启 `publisher-confirm-type: correlated`，每条消息带一个 `CorrelationData`（我们自定义了 `GuiguCorrelationData`，里面存了 **消息ID、交换机、路由键、重试次数**）。<br>发送后 Broker 会异步回调：
>
> - `ack=true` → 到了交换机；
> - `ack=false` → 没到（比如交换机不存在），**触发重发**。
>
> **② 交换机 → 队列：`return` 返回模式**<br>开启 `publisher-returns: true` + `mandatory: true`。如果消息到了交换机但**找不到匹配的队列**（路由键错了、队列没绑定），会触发 `ReturnsCallback`，**同样触发重发**。
>
> **③ 队列 → 消费者：手动 ack**<br>关闭自动确认（`acknowledge-mode: manual`），消费成功才 `basicAck`。如果消费失败，可以 `basicNack` 让消息**重回队列**或者进**死信队列**。
>
> **④ 消息本身持久化**：交换机 `durable=true`、队列 `durable=true`、消息 `deliveryMode=2`（持久化）。这样 **Broker 重启消息也不会丢**。
>
> **⑤ 重试与兜底**：重发最多 **3 次**，超过就把消息记录到日志/数据库，**转人工处理**（也会发邮件/短信告警）。

#### ✅ 追问：「重试 3 次还失败怎么办？」

**这题经常被追问**：

> **不能无限重试**（会造成消息风暴）。我们的策略是**分级处理**：<br>**① 3 次以内**：自动重试（我们代码里就是这样）；<br>**② 3 次以上**：**记录到数据库的”失败消息表”** + **告警**，转人工；<br>**③ 更完善的做法**：加**指数退避**（第 1 次等 1s、第 2 次 2s、第 3 次 4s），避免瞬时压力；<br>**④ 终极兜底**：**定时任务补偿**——定时扫描业务表，发现”状态不一致”的数据主动修复。**这是最可靠的，因为业务表才是唯一真相**。

#### ✅ 追问：「RabbitMQ 和多线程都能异步，为什么用 MQ？」

**软通动力（京东工程师）的原题**，这题是**陷阱**——很多人答不上来：

> **核心区别是「异步的边界在哪里」和「可靠性」**：
>
> | 维度 | 多线程异步 | MQ |
> | --- | --- | --- |
> | **进程边界** | 同一个 JVM 内 | **跨进程/跨服务** |
> | **可靠性** | ⚠️ **服务一重启，内存里的任务全丢** | 可**持久化**，重启不丢 |
> | **削峰能力** | 无，请求直接进内存 | **可以堆积**，消费者的处理能力决定出队速度 |
> | **解耦** | 强耦合，必须有对方的代码 | **完全解耦**，生产者不知道消费者是谁 |
> | **重试** | 要自己写 | 内置重试 + 死信队列 |
> | **水平扩展** | 受单机 CPU 限制 | **加消费者实例**即可扩容 |
>
> **所以我这样理解**：
>
> - **多线程**适合”**同一个服务内、不需要可靠保证、单纯为了快**“的任务，比如我们的**专辑详情并行查 4 个远程调用**——这是**同步等待结果的并行**，用 MQ 反而更复杂（还要回传结果）。
> - **MQ** 适合”**跨服务、要可靠、要削峰、可以接受延迟**“的任务，比如 **ES 数据同步、发短信、加积分**。
>
> **判断标准**：**“这个任务丢了要不要紧？调用方需不需要立刻拿到结果？”**<br>要紧、或者不需要立刻拿结果 → **用 MQ**；不要紧、且要等结果 → **用多线程**。

#### ✅ 追问：「为什么用 RabbitMQ 不用 RocketMQ/Kafka？（不要理论）」

**太极的原题，特别注明”不要理论”，要讲实际**：

> 我讲三个**实际考虑**：<br>**① 团队熟悉度和运维成本**：团队之前就用 RabbitMQ，运维有现成脚本和监控，**引入新中间件要重新踩坑**。<br>**② 消息量级**：我们的消息量是**每天几十万级**，不是日志那种**百万 TPS 的吞吐场景**——RabbitMQ 单机几万 QPS 完全够用，**Kafka 的高吞吐优势用不上**，反而它的**运维复杂度（要管 ZooKeeper/KRaft）不划算**。<br>**③ 功能匹配**：我们需要**延迟队列**（订单关单）、**死信队列**、**灵活的路由**（topic/direct/fanout）。RabbitMQ 的**交换机模型**天生适合，而 Kafka **没有延迟队列**（要靠自己实现时间轮），RocketMQ 有但社区版延迟级别有限制。
>
> **如果换个场景**：如果是**日志采集、埋点、大数据流处理**，我会毫不犹豫选 **Kafka**（高吞吐 + 顺序写 + 分区）；如果是**电商交易**这种要求**事务消息 + 顺序消息**的，**RocketMQ** 更合适。

---

### 7.2 🔥 消息幂等（消费端）

**面试官原话**

- `企业真题.txt:1480-1481` 软通动力（京东工程师）：
  > **MQ 怎么实现的防止消息重复消费？redis 如何实现的防止消息重复消费和实现步骤？**
- `企业真题.txt:532` 航天曌朗：**“怎么保证消息的幂等性”**
- `企业真题.txt:155` 花糖房附近、`:317` 上海擎朗

#### ⚠️ 真实情况：我们的消费端**没有**幂等保证

```java
// SearchReceiver.java:27-32  —— 没有幂等判断，直接处理再 ack
public void upper_album(Long albumId, Message message, Channel channel) {
    if(albumId != null) {
        searchService.upperAlbum(albumId);
    }
    channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
}
```

```java
// OrderReceiver.java:28-33  —— 同样没有幂等判断
public void orderPaySuccess(String orderNo, Message message, Channel channel) {
    if(StringUtils.hasText(orderNo)) {
        orderInfoService.updateOrderSuccess(orderNo);
    }
    channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
}
```

而 `UserInfoServiceImpl.savePaidRecord1:181,195` 里有两处**未实现的 TODO**：

```java
//TODO 判断，购买记录不能重复添加
```

#### ✅ 面试就按这个说

> **RabbitMQ 的投递语义是 “at-least-once”（至少一次）**，所以**消息重复是必然的**——网络抖动、消费者处理完但 ack 丢失、Broker 重投，都会导致重复。所以**消费端必须做幂等**。
>
> **幂等的本质是”去重”**，核心是找到一个**业务唯一键**。我们用 `businessNo` / `orderNo` 作为唯一标识。
>
> **三种实现方式**：
>
> **① 数据库唯一索引（最可靠，推荐）**<br>在业务表上加唯一索引，比如购买记录表 `user_paid_album` 上加 `UNIQUE(user_id, album_id)`。<br>重复消费时 `insert` 会抛 `DuplicateKeyException`，**捕获后直接 ack 忽略**。<br>**优点**：**绝对可靠**（数据库保证），不依赖 Redis 可用性。
>
> **② Redis `SETNX`（性能最好）**<br>消费前先 `SETNX msg:{businessNo} 1 EX 3600`，**设置成功才处理，失败说明重复，直接 ack**。<br>⚠️ **注意要用 `SETNX + EX` 的原子写法**，并且**要设过期时间**（否则 key 堆积）。<br>**缺点**：如果处理失败但 key 已写，消息会被误判为”已处理”而丢失——所以**推荐”先处理业务、成功后再写 key”**，或者用**状态机**。
>
> **③ 状态机幂等（业务层面最优雅）**<br>用状态流转来保证：`UPDATE order_info SET status='已支付' WHERE order_no=? AND status='未支付'`。<br>**影响行数为 0 就说明已经处理过**，直接返回。<br>我们充值那里就是这么做的（`RechargeInfoServiceImpl:60-61`）。

#### ⚠️ 但要说清我们项目的问题（诚实口径）

> **不过我要如实说**：我们**消费端当时没有统一做幂等**，只有充值那条链路做了状态判断，其余（比如加购买记录）**确实存在重复消费的风险**——`savePaidRecord1` 里还留着”判断购买记录不能重复添加”的 TODO。
>
> **这是我后来复盘时补上的改进方案**：<br>**① 购买记录表加唯一索引** `UNIQUE(user_id, album_id)` / `UNIQUE(user_id, track_id)`，用数据库兜底；<br>**② 抽一个幂等注解**，用 AOP 统一处理：`@Idempotent(key = "#orderNo")`，切面里查 Redis，这样不用每个消费者写一遍；<br>**③ 消费成功后再 ack**，失败 `basicNack` 进死信队列，避免”处理失败但也 ack 了”。

#### ⚠️⚠️ 一个更严重的问题：业务异常也 ack

```java
// SearchReceiver.java:21-32
@SneakyThrows                    // ← 把受检异常"吞"成运行时异常，但不处理
@RabbitListener(...)
public void upper_album(Long albumId, Message message, Channel channel) {
    if(albumId != null) {
        searchService.upperAlbum(albumId);      // ← 这里抛异常会怎样？
    }
    channel.basicAck(...);                      // ← 执行不到
}
```

**分析**：

- 如果 `upperAlbum` 抛异常，`basicAck` **不会执行** → 消息**不会被确认** → RabbitMQ 会**重新投递** → 如果这个异常是**永久性**的（比如数据格式错误），就会**无限重投**，形成”**毒消息**“（Poison Message），把消费者卡死；
- 如果消费成功但**没 ack 就宕机**，消息也会重投（这是对的，at-least-once）；
- **正确做法应该是**：`try { 业务 } catch (异常) { basicNack(requeue=false) 进死信队列 }`。

> **✅ 改进**：
>
> ```java
> try {
>     searchService.upperAlbum(albumId);
>     channel.basicAck(deliveryTag, false);
> } catch (Exception e) {
>     log.error("上架同步失败 albumId={}", albumId, e);
>     // 不重回队列，进死信队列，避免死循环
>     channel.basicNack(deliveryTag, false, false);
> }
> ```

---

### 7.3 消息顺序性与积压

**面试官原话**

- `企业真题.txt:1490` 快手外包：**“如何保证消息的顺序性？”**
- `企业真题.txt:965` 上海爱回收：**“你知道这个顺序性消息它是怎么实现的？”**
- `企业真题.txt:47` 泽宇天河、`:966` 上海爱回收、`:1312` 慧寻科技：**“消息积压怎么处理”**
- `企业真题.txt:145` 维思陆、`:312` 上海擎朗：**“RabbitMQ 解决消息挤压”**

#### ✅ 顺序性

> **RabbitMQ 保证顺序的前提是：同一个队列 + 同一个消费者 + 不重试不 requeue**。<br>所以保证顺序有三种做法：<br>**① 单队列单消费者**——最简单，但**牺牲并发**；<br>**② 按业务ID路由到不同队列**——比如按 `orderId % N` 分到 N 个队列，**同一订单的消息永远进同一个队列**，既保证局部有序又保证并发；<br>**③ 消费端用内存队列排队**——消费者内部按 key 分发到不同的内存队列，每个队列一个线程串行消费。
>
> ⚠️ **要注意**：如果开了**重试**或**requeue**，消息可能被投到队列尾部，**顺序就乱了**。所以顺序性要求高的场景**不能依赖自动重试**。

#### ✅ 积压

> **先定位原因**：是**生产太快**（突发流量）还是**消费太慢**（代码问题/下游慢）？
>
> **解决手段**：<br>**① 紧急扩容消费者**——最直接，多起几个实例。RabbitMQ 的队列支持并发消费，加消费者即可提升吞吐。<br>**② 优化消费逻辑**——把消费者里的**串行远程调用改成批量**，或者**先落库再异步处理**（快速 ack，避免占用）。<br>**③ 增加队列并发度**——`concurrency` 参数调大（但要考虑下游 DB 承受能力）。<br>**④ 临时启用”丢弃策略”**——如果业务允许，给队列设 `x-max-length` 或消息 TTL，**牺牲部分消息**保护系统。但要谨慎，**我们项目不敢这么干**（怕丢订单）。<br>**⑤ 兜底**：如果积压已经导致业务不可用，可以**写一个临时消费者把消息快速转存到数据库**，先把队列清空，再慢慢消费。

---

## 8. 微服务治理

> **一句话总述**：Nacos 做注册中心 + 配置中心，Gateway 做统一入口，OpenFeign 做服务调用（带降级），Sentinel 做流控降级。

### 8.1 🔥 组件与原理

**面试官原话**

- `企业真题.txt:647` 中科软：**“nacos、openfeign、rabbitMQ 的工作原理”**
- `企业真题.txt:399` 神州信息：**“nacos 你们是做配置中心还是注册中心？当一个服务器宕机了他是怎么知道的，他是怎么动态拉取配置的，原理是什么”**
- `企业真题.txt:46` 泽宇天河：**“feign 怎么找到远程服务的地址的”**
- `企业真题.txt:23` 泽宇天河：**“微服务之前怎么通信的”**
- `企业真题.txt:1063` 上海宸汐：**“微服务之间调用（除了 openfeign）还有什么”**

#### ✅ Nacos 注册中心原理

> **服务注册**：服务启动时，把**自己的 IP、端口、服务名**通过 HTTP 注册到 Nacos Server（`POST /nacos/v1/ns/instance`）。Nacos 存在**内存的双层 Map** 里（`namespace → group → service → 实例列表`），并且**写磁盘做持久化**。
>
> **心跳保活**：客户端每 **5 秒**发一次心跳。Nacos **15 秒**没收到标记为”不健康”，**30 秒**没收到就**摘除实例**。
>
> **服务发现**：调用方拉取服务实例列表，并**订阅**变更。有个细节——**Nacos 客户端是”推拉结合”**：
>
> - 客户端定时（默认 10 秒）**拉取**；
> - 服务端发现有变更时，通过 **UDP 推送**通知客户端”你订阅的服务变了”，客户端再主动拉一次。<br>（UDP 不可靠，所以**拉取是兜底**，这就是”推拉结合”）
>
> **配置中心动态刷新**：客户端对配置**长轮询**（`Long Polling`，默认 30 秒超时）。服务端把请求 hold 住，配置一变**立刻返回**。客户端拿到变更后**发布 Spring 的 `RefreshEvent`**，配合 **`@RefreshScope`** 注解让 Bean 重新创建，实现**配置热更新**。

#### ✅ OpenFeign 原理

> **Feign 的本质是”声明式 HTTP 客户端”，核心是动态代理**：<br>**① 扫描**：`@EnableFeignClients` 触发扫描所有 `@FeignClient` 接口；<br>**② 注册 BeanDefinition**：为每个接口注册一个 `FeignClientFactoryBean`；<br>**③ 生成代理**：注入时，`FeignClientFactoryBean.getObject()` 用 **`ReflectiveFeign`** 生成 **JDK 动态代理**对象；<br>**④ 方法调用被拦截**：代理对象调用方法时，走 `InvocationHandler`，把方法上的 `@GetMapping`/`@PostMapping` 等注解**解析成 `RequestTemplate`**（拼 URL、方法、参数、请求头）；<br>**⑤ 负载均衡**：`serviceId`（服务名）被 `LoadBalancer` 解析成**真实的 IP:端口**（从 Nacos 拿到的实例列表里选一个）；<br>**⑥ 发请求**：用 `Client`（默认 `Client.Default`，即 `HttpURLConnection`；可以用 `OkHttp`/`Apache HttpClient` 替换）发起 HTTP 请求，拿到响应后**反序列化**成方法返回值。

#### ✅ 追问：「除了 OpenFeign，微服务之间还能怎么调用？」

**上海宸汐原题**：

> **① RestTemplate + `@LoadBalanced`**：底层也是 HTTP，但要**手写 URL**，没有 Feign 的声明式优雅。<br>**② WebClient**：**响应式**的 HTTP 客户端，适合高并发、非阻塞场景（Gateway 内部就用它）。<br>**③ Dubbo（RPC）**：基于 **TCP + 自定义协议**，性能比 HTTP 好（序列化更紧凑、连接复用），但**耦合了服务端和客户端**（要共享接口），而且**不能跨语言**（除非用 Triple/gRPC 协议）。<br>**④ gRPC**：基于 **HTTP/2 + Protobuf**，**跨语言**、性能好，适合内部高性能调用。<br>**⑤ MQ**：**异步**通信，不是”调用”，而是”事件通知”，用于解耦。
>
> **我们选 Feign 的原因**：**HTTP 语义直观、调试方便（能直接用 Postman 测）、和 Spring Cloud 生态无缝集成**。性能上虽然不如 Dubbo，但我们的调用量不大，**开发效率更重要**。

---

### 8.2 🔥 网关为什么不能只用 Nginx？

**面试官原话**（`企业真题.txt:1080` 上海科续）

> **路由转发和实例轮询 Nginx 也能做到为什么还用网关？**<br>（`企业真题.txt:1079` 同公司：**“Gateway 网关用来做什么”**；`企业真题.txt:250` 天津行至简：**“网关怎么实现统一的权限认证”**）

#### ✅ 这是一个很好的对比题，这样答

> **Nginx 和 Gateway 都能做”路由转发 + 负载均衡”，但定位不同**：
>
> | 维度 | Nginx | Spring Cloud Gateway |
> | --- | --- | --- |
> | 层次 | **四层/七层代理**，C 语言，性能极高 | **七层**，基于 **Spring WebFlux + Netty**，**响应式非阻塞** |
> | 服务发现 | ⚠️ **要手写 upstream 配置**，服务上下线要改配置 reload | **原生集成 Nacos**，自动感知实例变化 |
> | 鉴权 | 只能做**简单规则**（IP、Basic Auth） | 能写**Java 代码**，可查 Redis、解析 token、调服务 |
> | 限流熔断 | 有基础限流 | **Sentinel 集成**，支持 QPS/线程数/热点/系统规则 |
> | 灰度/路由 | 要靠 Lua 或复杂配置 | **断言（Predicate）灵活**，可按 header、参数、权重路由 |
>
> **核心答案是：网关能做”业务级”的事，Nginx 只能做”流量级”的事。**
>
> 具体到我们的项目：<br>**① 鉴权**：网关可以**统一校验 token、解析出 userId，然后通过请求头传给下游服务**。如果放 Nginx，就得写 Lua 脚本去查 Redis，**极难维护**。<br>**② 动态路由**：微服务的实例 IP 是**动态变化的**（扩缩容、重启），Nacos 里注册的实例一直在变。Gateway 能**自动从 Nacos 拉取**；Nginx 要**手工维护 upstream** 并 reload。<br>**③ 跨域、日志、限流、灰度**这些都需要**业务感知**，属于网关的职责。
>
> **实际生产上两者是配合的，不是二选一**：<br>`用户 → Nginx（做 HTTPS 卸载、静态资源、最外层负载均衡）→ Gateway（做鉴权、路由、限流）→ 微服务`<br>**Nginx 在最前面挡流量、扛并发**（C 语言性能碾压 Java），**Gateway 在后面处理业务逻辑**。

#### ⚠️ 我们项目的真实情况（诚实口径）

```java
// AuthGlobalFilter.java:19-30  —— 空的！
@Slf4j
@Component
public class AuthGlobalFilter implements GlobalFilter, Ordered {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return chain.filter(exchange);      // ⚠️ 直接放行，什么都没做
    }
    @Override
    public int getOrder() { return 0; }
}
```

⚠️ **网关的全局过滤器是空实现**，鉴权完全**下沉到了各个业务服务的 AOP**（`GuiGuLoginAspect`）。

> **✅ 面试这样答**：<br>我们项目的网关主要做**路由转发**（在 Nacos 的 `server-gateway-dev.yaml` 里配的），**鉴权是下沉到各个业务服务用自定义注解 + AOP 做的**。
>
> **这两种方案各有取舍**：
>
> - **网关统一鉴权**：**一处生效、性能好**（不合格的请求根本进不来），但**网关要理解所有服务的鉴权规则**，耦合度高；
> - **服务内 AOP 鉴权**（我们的）：**灵活、每个接口可以单独控制**（`required=true/false`），但**每个服务都要引入切面**，而且**流量已经打到服务里了才被拒绝**，浪费了网络和线程资源。
>
> **更好的架构是”网关粗粒度 + 服务细粒度”两层**：<br>网关校验 token **有效性**（验签/查 Redis），把 userId 塞进请求头；服务内部再用 AOP 校验**权限和业务规则**（比如”这个专辑是不是你的”）。**这样既不浪费流量，又保留了灵活性。**

---

### 8.3 ⚠️ Feign 的 token 透传陷阱

**面试官原话**（`企业真题.txt:23` 泽宇天河：**“feign 怎么找到远程服务的地址的”**；异步链路问题在多处被问）

#### 代码位置

```java
// FeignInterceptor.java:12-26
@Component
public class FeignInterceptor implements RequestInterceptor {
    public void apply(RequestTemplate requestTemplate){
        //  获取请求对象
        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        //异步编排 与 MQ消费者端 为 null      ← ★注释里自己承认了
        if(null != requestAttributes) {
            ServletRequestAttributes servletRequestAttributes =
                    (ServletRequestAttributes)requestAttributes;
            HttpServletRequest request = servletRequestAttributes.getRequest();
            String token = request.getHeader("token");
            requestTemplate.header("token", token);      // 把 token 透传给下游
        }
    }
}
```

#### ✅ 面试就按这个说

> 微服务之间调用时，**下游服务也需要知道”当前是哪个用户”**，所以要**把 token 透传下去**。我用 Feign 的 **`RequestInterceptor`** 做的：拦截所有 Feign 请求，**从当前请求头里取出 token，塞进 Feign 的请求头**。

#### ⚠️ 但这里有个真实缺陷（代码注释已经写明了）

```java
//异步编排 与 MQ消费者端 为 null
if(null != requestAttributes) {
```

⚠️ **`RequestContextHolder` 是基于 `ThreadLocal` 的**，所以在**异步线程**（CompletableFuture）和 **MQ 消费者线程**里，**取不到 `RequestAttributes`，会返回 null**。

**后果**：

- **下架专辑时**，`AlbumInfoServiceImpl` 发 MQ → `SearchReceiver` 消费者调 Feign 拉数据 → **`RequestContextHolder` 为 null** → **token 没传** → 下游 `@GuiguLogin(required=true)` 的接口**直接 401**！
- 我们代码里加了 `if(null != requestAttributes)` 判空，所以**不会 NPE**，但**token 就是丢了**——如果下游接口需要登录态，就会失败。

> **✅ 改进方案**：<br>**① 异步编排场景**：用 **`TransmittableThreadLocal`（TTL）** 或**手动传递**——在提交任务前把 token 取出来，作为参数传给异步任务，任务里再 `set` 回去。<br>**② MQ 消费端**：**不应该依赖用户 token**！MQ 是**系统内部调用**，应该用**服务间鉴权**（比如内部调用的固定密钥、或者干脆把这类接口标记为**免登录的内部接口**），而不是透传用户 token。<br>**③ 服务间调用用独立凭证**：更规范的做法是**内部调用带一个 sign 或内部 token**，和用户 token 分开。

---

### 8.4 服务雪崩、熔断与降级

**面试官原话**（`企业真题.txt:997` 恒生宝泰：**“服务降级如何实现”**；`企业真题.txt:551` 东软汉和：**“sentinel 熔断策略有几种”**；`企业真题.txt:742` 翊思明德：**“sentinel 是如何配置的”**）

#### 代码位置：Feign 的降级实现

```java
// service-client 里每个 Feign 都有对应的降级实现
// 例如 AlbumInfoDegradeFeignClient
@Component
public class AlbumInfoDegradeFeignClient implements AlbumInfoFeignClient {
    @Override
    public Result<AlbumInfo> getAlbumInfo(Long albumId) {
        return null;    // 或者返回兜底数据
    }
}
```

#### ✅ 面试就按这个说

> **服务雪崩**是指：A 调 B，B 调 C，C 挂了导致 B 的线程都阻塞在等 C，B 的线程池被打满，进而导致 A 也挂了——**故障沿着调用链层层放大**。
>
> **三个应对手段**：<br>**① 超时**：Feign 默认超时很长（甚至无限等），必须**显式配置** `connectTimeout` / `readTimeout`。**超时是雪崩的第一道防线**——不能让线程无限等。<br>**② 熔断（Circuit Breaker）**：统计**失败率**，超过阈值就**打开断路器**，后续请求**直接失败不再调下游**，给下游**恢复的时间**。一段时间后进入**半开状态**，放少量请求试探，成功就关闭断路器。<br>Seata/Sentinel 的策略：**慢调用比例、异常比例、异常数**三种。<br>**③ 降级（Fallback）**：熔断后**返回兜底数据**。我们用 **Feign 的 fallback**：每个 Feign 接口配一个降级实现类，比如专辑查不到就返回 null，让页面显示”数据加载失败”而不是**整个页面 500**。

#### ✅ 追问：「熔断和降级的区别？」

> - **熔断**是**一种保护机制**——“**我不调你了**“，是被动的、系统自动触发的（基于失败率统计）；
> - **降级**是**一种兜底策略**——“**我返回什么给你**“，是主动设计的（返回缓存、默认值、友好提示）。
>
> **关系**：熔断**触发**降级。熔断是”因”，降级是”果”。

---

### 8.5 第 7-8 章追问链速查

| 追问 | 答题要点 |
| --- | --- |
| MQ 怎么保证不丢 | confirm + return + 持久化 + 手动 ack + 重试 |
| confirm 和 return 区别 | 到交换机 vs 到队列 |
| 重试 3 次还失败 | 落库告警转人工 + 定时补偿 |
| MQ vs 多线程异步 | 跨进程可靠可削峰 vs 同 JVM 快但会丢 |
| 为什么不用 RocketMQ/Kafka | 消息量级 + 团队熟悉度 + 延迟队列需求 |
| MQ 幂等怎么做 | 唯一索引 / Redis SETNX / 状态机 |
| at-least-once 的含义 | 必然重复，所以必须幂等 |
| 业务异常也 ack 的后果 | 消息丢失；应 nack 进死信 |
| 消息顺序性 | 单队列单消费者 / 按 key 分队列 |
| 消息积压 | 扩容消费者 + 优化逻辑 + 临时转存 |
| Nacos 注册原理 | 内存双层 Map + 心跳 5s/15s/30s |
| Nacos 配置动态刷新 | 长轮询 + `@RefreshScope` |
| Feign 原理 | 动态代理 + RequestTemplate + 负载均衡 |
| Feign 超时 | 必须显式配，否则雪崩 |
| 网关 vs Nginx | 业务级 vs 流量级，配合使用 |
| 鉴权放网关还是服务 | 网关验有效性 + 服务验权限 |
| 服务雪崩 | 超时 + 熔断 + 降级 |
| 熔断 vs 降级 | 因 vs 果 |

---

## 9. 定时任务与统计

> **一句话总述**：用 XXL-JOB 做分布式定时任务，跑”更新排行榜”和”更新过期 VIP 状态”；统计量更新用”读-改-写”方式。

### 9.1 XXL-JOB 的用法与原理

**面试官原话**

- `企业真题.txt:99` 泽宇天河二面：**“XXL-JOB 怎么用的”**
- `企业真题.txt:652,661` Kmerit：**“xxl-job 中的执行器和调度器分别介绍”**
- `企业真题.txt:287` 合众未来：**“xxljob 跟 spring 自带有什么区别”**
- `企业真题.txt:1444` 中品一号：**“为什么不用 spring 定时任务”**
- `企业真题.txt:1324` 弋云科技二面：**“xxl-job 你们是怎么用的集成还是怎么用的，以及用的时候有没有到什么问题”**
- `企业真题.txt:767` 中科聚网、`:1465` 釜舟科技：**“xxl-job 怎么实现的定时更新排行榜”**

#### 代码位置

```java
// DispatchJobHandler.java:32-52
@XxlJob("updateLatelyAlbumRanking")
public void updateLatelyAlbumRanking() {
    XxlJobLog xxlJobLog = new XxlJobLog();
    xxlJobLog.setJobId(XxlJobHelper.getJobId());
    long startTime = System.currentTimeMillis();
    try {
        searchFeignClient.updateLatelyAlbumRanking();   // 远程调用更新排行榜
    } catch (Exception e) {
        xxlJobLog.setStatus(0);                          // 失败
        xxlJobLog.setError(ExceptionUtil.getErrorMessage(e));
        log.error("定时任务执行失败，任务id为：{}", XxlJobHelper.getJobId());
        e.printStackTrace();                             // ⚠️ 该用 log.error
    } finally {
        int times = (int) (System.currentTimeMillis() - startTime);
        xxlJobLog.setTimes(times);
        xxlJobLogMapper.insert(xxlJobLog);               // 记录执行日志
    }
}
```

#### ✅ 面试就按这个说

> 我们用 **XXL-JOB 2.4.0** 做分布式定时任务，跑两个任务：
>
> - **`updateLatelyAlbumRanking`**：每天更新各分类的排行榜；
> - **`updateVipExpireStatus`**：更新过期 VIP 用户的状态。
>
> **架构分两个角色**：<br>**① 调度中心（Admin）**：独立部署的 Web 服务，负责**管理任务、配置 Cron、触发调度**；<br>**② 执行器（Executor）**：集成在我们的业务服务里（`service-dispatch`），负责**接收调度、执行 JobHandler**。
>
> **注册方式**：执行器启动时向调度中心**注册自己**，调度中心通过 **RPC（内置的 Netty）** 下发任务。

#### ✅ 追问：「为什么不用 Spring 自带的 `@Scheduled`？」

**中品一号原题**：

> 有三个核心原因：<br>**① 集群重复执行**：`@Scheduled` 是**进程级**的，多实例部署时**每个实例都会执行一遍**！排行榜更新还好（幂等），但如果是”给用户发券”，就会**发多次**。XXL-JOB 有**调度中心统一触发**，还能配置**路由策略**（轮询/随机/一致性HASH/分片广播），天然解决重复问题。<br>**② 没有失败重试**：`@Scheduled` 失败了就是失败了，没有重试机制、没有告警。XXL-JOB 支持**失败重试次数**和**邮件告警**。<br>**③ 没有可视化管理**：改 Cron 表达式要改代码重新发布。XXL-JOB 在 **Admin 界面直接改，即时生效**，还能**手动触发一次**（运维排查很有用）。<br>**④ 没有执行日志**：XXL-JOB 有完整的**调度日志**（我们代码里还额外落库了 `xxl_job_log` 表记录耗时和异常），方便排查。

#### ✅ 追问：「XXL-JOB 怎么保证任务不重复执行？」

> **① 路由策略**：默认”**第一个**“或”**轮询**“，保证一个任务**只发给一个执行器**；<br>**② 阻塞处理策略**：如果上次还没跑完，可以配置”**丢弃后续调度**“或”**覆盖之前调度**“，避免任务堆叠；<br>**③ 分片广播**：如果任务要**并行处理大量数据**，用”分片广播”把所有执行器都唤醒，每个执行器处理 `分片序号 % 总分片数` 的数据，**既不重复也不遗漏**。

#### ⚠️ 真实缺陷

```java
catch (Exception e) {
    xxlJobLog.setStatus(0);
    xxlJobLog.setError(ExceptionUtil.getErrorMessage(e));
    log.error("定时任务执行失败，任务id为：{}", XxlJobHelper.getJobId());
    e.printStackTrace();      // ⚠️ 问题1
}
```

**问题 1：异常被”吞”掉了，调度中心不知道失败**

⚠️ 代码里 catch 了异常**只记录日志**，**没有重新抛出**，也**没有调用 `XxlJobHelper.handleFail()`**。这意味着：

- **XXL-JOB 调度中心会认为这次任务”执行成功”**（因为方法正常返回了）；
- → **不会触发失败重试**；
- → **不会发送告警**；
- → 排行榜数据已经过期了，但**没人知道**。

> **✅ 改进**：
>
> ```java
> } catch (Exception e) {
>     xxlJobLog.setStatus(0);
>     xxlJobLog.setError(ExceptionUtil.getErrorMessage(e));
>     log.error("定时任务执行失败", e);
>     XxlJobHelper.handleFail("更新排行榜失败：" + e.getMessage());   // ← 通知调度中心
> }
> ```

**问题 2：`e.printStackTrace()` 不走日志框架**

⚠️ 生产环境日志被重定向到文件，`printStackTrace` 输出到 `System.err`，**ELK 收集不到**，排查时看不到堆栈。应该统一用 `log.error(msg, e)`。

**问题 3：日志插入在 `finally` 里，可能掩盖真实异常**

如果 `xxlJobLogMapper.insert()` 本身失败（比如数据库连接断了），会**覆盖掉原始的异常信息**（Java 里 finally 中抛异常会替换 try 中的异常）。应该**在 finally 里再包一层 try-catch**。

---

### 9.2 ⚠️ 统计量更新的并发丢失（致远互联原题）

**面试官原话**（`企业真题.txt:162` 致远互联）

> **专辑点赞量，十个用户同时点赞，会怎么处理**

#### 代码位置

```java
// TrackInfoServiceImpl#updateStat:303-319
@Override
public void updateStat(TrackStatMqVo trackStatMqVo) {
    Long trackId = trackStatMqVo.getTrackId();
    Integer count = trackStatMqVo.getCount();
    String statType = trackStatMqVo.getStatType();

    //根据声音id + statType 获取数据
    LambdaQueryWrapper<TrackStat> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(TrackStat::getTrackId, trackId);
    wrapper.eq(TrackStat::getStatType, statType);
    TrackStat trackStat = trackStatMapper.selectOne(wrapper);      // ① 查

    //设置修改值
    trackStat.setStatNum(trackStat.getStatNum() + count);          // ② 内存里加

    //调用方法更新
    trackStatMapper.updateById(trackStat);                         // ③ 按主键更新绝对值
}
```

#### ⚠️ 典型的”读-改-写”丢失更新

**如果 10 个用户同时点赞**：

```text
初始 statNum = 0
线程A：读到 0，算出 1
线程B：读到 0，算出 1
线程C：读到 0，算出 1
...
线程A：UPDATE ... SET stat_num = 1   ✅
线程B：UPDATE ... SET stat_num = 1   ✅（覆盖了A的结果）
线程C：UPDATE ... SET stat_num = 1   ✅
结果：stat_num = 1，但实际应该有 10 个赞！   ← 丢了 9 个
```

**根因**：`updateById` 是把**查出来的旧值 + count** 算好，然后**覆盖式更新**。多个线程都在**同一个旧值**上计算。

#### ✅ 面试就按这个说（这题是送分的，要答漂亮）

> **这是典型的”读-改-写”竞态，会导致”丢失更新”**。
>
> **正确做法是把”加”这个操作下推到数据库，让它变成原子操作**：
>
> ```sql
> UPDATE track_stat SET stat_num = stat_num + #{count}
> WHERE track_id = #{trackId} AND stat_type = #{statType}
> ```
>
> 因为 MySQL 的 `UPDATE` 会对行**加排他锁**，所以这 10 个请求会**串行执行**，每次都在**当前的数据库值**上加 1，最终结果**准确等于 10**。
>
> **千万不要**写成”先 select 再 set 再 updateById”——**除非用乐观锁（版本号）或悲观锁（`for update`）**，否则一定会丢。
>
> **其他方案**：<br>**① Redis 计数器**：用 `INCR track:stat:{trackId}`，天然原子，性能极高。然后**定时任务**把 Redis 的值**批量刷回 DB**。**这是高并发点赞的标准方案**（微博、抖音都这么干）。<br>**② 消息队列串行化**：把点赞消息发到 MQ，**同一个 trackId 路由到同一个队列**，单消费者串行处理。**牺牲吞吐换正确性**。<br>**③ 位图去重 + 计数**：如果还要**防止同一用户重复点赞**，可以用 Redis 的 **Bitmap**（`user:like:{trackId}`，`offset = userId`），先 `SETBIT` 判断是否已点赞，再 `INCR` 计数。

#### ✅ 追问：「我们还用 bitmap 统计播放量，是怎么做的？」

```java
// UserListenProcessServiceImpl.java:82-112
//** 同一个用户，对于同一个声音播放，24小时只是算一次播放
//** redis key：userId  偏移量：声音id   value：1
String key = "user:track:" + userListenProcessVo.getTrackId() + userId;
Boolean isExist = redisTemplate.opsForValue().getBit(key, userListenProcessVo.getTrackId());
if (!isExist) {
    redisTemplate.opsForValue().setBit(key, userListenProcessVo.getTrackId(), true);
    redisTemplate.expire(key, 24*60*60, TimeUnit.SECONDS);   // 24小时过期
    // 发送消息更新播放量
    rabbitService.sendMessage(MqConst.EXCHANGE_TRACK, MqConst.ROUTING_TRACK_STAT_UPDATE, ...);
}
```

> **需求**：**同一个用户对同一个声音，24 小时内只算一次播放量**。
>
> **实现**：用 **Redis 的 Bitmap**：
>
> - **key** = `user:track:{trackId}{userId}`，**offset = trackId**，`value = 1` 表示已播放；
> - 播放时先 `GETBIT`，**如果已经是 1 就说明 24 小时内播过了，不计数**；
> - 如果是 0，就 `SETBIT` 置 1，**设置 24 小时过期**，然后发 MQ 消息去更新统计表。
>
> **为什么用 Bitmap？**<br>**① 极省内存**：1 个 bit 存一个”是否播放”的状态，**1 亿个用户也只要 12.5 MB**（相比用 Set 存 userId，能省几百倍）；<br>**② `GETBIT`/`SETBIT` 都是 O(1)**，性能极好。
>
> ⚠️ **但这里的实现有两个问题**：<br>**① key 的设计有歧义**：`"user:track:" + trackId + userId` 是**字符串拼接**，`trackId=1, userId=23` 和 `trackId=12, userId=3` 会**拼成同一个 key**（都是 `user:track:123`）！应该用分隔符：`"user:track:" + trackId + ":" + userId`。<br>**② offset 用 trackId 不合理**：`SETBIT` 的 offset 是**位数**，如果 `trackId` 是雪花算法生成的 19 位数字（比如 `1234567890123456789`），那 offset 会高达 10^18，**Redis 会分配 10^18 / 8 字节 ≈ 128 PB，直接 OOM**！<br>正确做法应该是**用 bitmap 存 userId 的偏移**（key = `track:{trackId}:{日期}`，offset = userId % 1亿），或者干脆**用 `SET` 存已播放的 userId**（数据量小时更简单安全）。

---

### 9.3 第 9 章追问链速查

| 追问 | 答题要点 |
| --- | --- |
| XXL-JOB 两个角色 | 调度中心（Admin）+ 执行器（Executor） |
| 为什么不用 @Scheduled | 集群重复执行 + 无重试 + 无界面 + 无日志 |
| 怎么保证不重复 | 路由策略 + 阻塞策略 + 分片广播 |
| Cron 怎么写 | `0 10 * * * ?`（每小时10分） |
| 统计量并发 | `SET x = x + ?` 原子更新 |
| 高并发点赞 | Redis INCR + 定时刷库；Bitmap 去重 |
| Bitmap 省多少内存 | 1 bit/状态，1亿用户 12.5MB |
| SETBIT offset 的坑 | offset 过大导致内存爆炸 |

---

## 10. 线程池与异步编排

> **一句话总述**：专辑详情接口要聚合 4 类数据，我用自定义线程池 + CompletableFuture 把串行改成并行，提高响应速度。

### 10.1 🔥🔥 线程池 7 个参数与真实配置

**面试官原话**（这是**最高频**的题之一，`企业真题.txt` 中出现 20+ 次）

- `企业真题.txt:6` 京东：**“线程池的参数是怎么设置的”**
- `企业真题.txt:7` 京东：**“你的服务是什么类型的（CPU/IO），那部分会导致计算会比较多”**
- `企业真题.txt:13` 厦门新同事：**“线程池怎么配置的”**
- `企业真题.txt:24` 联科云创：**“线程数一般设置为多大？”**
- `企业真题.txt:986` 恒生宝泰：**“线程数如何设计，为什么，数值怎么来的”**
- `企业真题.txt:1088` 上海科续：**“项目中核心线程数设置的多少”**
- `企业真题.txt:1353` 中软国际：**“自定义线程池参数？只有核心2个最大5个其他参数都是默认值，有5个任务直接扔到线程池中，正在执行的线程数是多少”** ← 计算题
- `企业真题.txt:46` 中科软：**“线程池是什么时候加载的”**

#### 代码位置：真实的线程池配置

```java
// ThreadPoolExecutorConfig.java:11-23
@Configuration
public class ThreadPoolExecutorConfig {

    @Bean
    public ThreadPoolExecutor threadPoolExecutor(){
        return new ThreadPoolExecutor(3,                          // 核心线程数
                5,                                                // 最大线程数
                10, TimeUnit.SECONDS,                             // 空闲回收时间
                new ArrayBlockingQueue<>(3),                      // ⚠️ 队列容量只有 3
                Executors.defaultThreadFactory(),                 // 线程工厂
                new ThreadPoolExecutor.AbortPolicy());            // 拒绝策略
    }
}
```

#### ✅ 面试就按这个说（7 个参数）

> 我们用 `ThreadPoolExecutor` 自定义线程池，7 个参数：<br>**① `corePoolSize = 3`**：核心线程数，**常驻**，即使空闲也不销毁（除非设了 `allowCoreThreadTimeOut`）；<br>**② `maximumPoolSize = 5`**：最大线程数；<br>**③ `keepAliveTime = 10s` + `unit = SECONDS`**：**非核心线程**空闲超过 10 秒就回收；<br>**④ `workQueue = ArrayBlockingQueue(3)`**：**有界阻塞队列**，容量 3；<br>**⑤ `threadFactory`**：线程工厂，用来**给线程起有意义的名字**（方便排查问题，我们用默认的，其实应该自定义）；<br>**⑥ `handler = AbortPolicy`**：拒绝策略，**直接抛 `RejectedExecutionException`**。
>
> （第 7 个通常指 `TimeUnit`，或者把队列和工厂拆开算。）

#### ✅ 追问：「不用 `Executors` 而用 `ThreadPoolExecutor` 的原因？」

> 因为 **`Executors` 的几个工厂方法有 OOM 风险**：
>
> - **`Executors.newFixedThreadPool()` / `newSingleThreadExecutor()`**：用的是 **`LinkedBlockingQueue`（无界队列，容量 `Integer.MAX_VALUE`）**。任务提交速度 > 处理速度时，队列会**无限堆积** → **OOM**；
> - **`Executors.newCachedThreadPool()`**：最大线程数是 **`Integer.MAX_VALUE`**，会**无限创建线程** → **OOM**；
> - **`Executors.newScheduledThreadPool()`**：同样无界。
>
> 所以\*\*《阿里巴巴 Java 开发手册》明确要求：线程池不允许用 `Executors` 创建，必须用 `ThreadPoolExecutor` 手动指定参数\*\*，让我们**明确知道队列有多长、最多多少线程**，出了问题能及时发现。

#### ✅ 追问：「线程池的执行流程 / 一个任务提交后怎么走？」

**必考**，用”三步”回答：

> **① 核心线程没满** → 创建**核心线程**执行；<br>**② 核心线程满了** → 任务**进阻塞队列排队**；<br>**③ 队列也满了** → 创建**非核心线程**执行（不超过 `maximumPoolSize`）；<br>**④ 最大线程也满了** → 执行**拒绝策略**。
>
> ⚠️ **易错点**：很多人以为”核心满了就创建新线程到最大，再排队”，**这是错的**。**队列的优先级高于非核心线程**——这也是为什么用**无界队列**时 `maximumPoolSize` **永远用不上**。

#### ✅ 追问：「计算题：核心 2、最大 5、默认队列，扔 5 个任务，正在执行的线程数是多少？」

**中软国际的原题**，要小心：

> **关键要看”默认队列”是什么**。如果用的是 `new LinkedBlockingQueue()`（**无界**）：
>
> - 前 2 个任务创建核心线程；
> - **剩下 3 个全部进无界队列排队**（因为队列永远不满）；
> - **不会创建任何非核心线程**。<br>→ **正在执行的线程数是 2**。
>
> ⚠️ 如果是**有界队列**（比如容量 3），那就是：2 个核心线程 + 队列 3 个装满了 → 第 6 个任务才会创建非核心线程。5 个任务时是 **2 个在执行、3 个在排队**，执行线程数还是 **2**。<br>如果是容量 1 的有界队列：2 个核心 + 1 个排队 + 2 个非核心 = **4 个线程在执行**。

#### ⚠️ 真实配置的问题：队列只有 3，非常危险

我们的参数是 **core=3、max=5、queue=3**，也就是**最多只能容纳 3 + 3 + 2 = 8 个任务**（3 个执行 + 3 个排队 + 2 个额外线程），**第 9 个任务直接抛 `RejectedExecutionException`**。

> **✅ 面试这样答（化劣势为优势）**：<br>我把队列设得比较小（3），是**有意的设计**：<br>**① 快速失败**：队列小意味着**任务不会长时间排队**。如果队列设得很大，任务会**静静地排队**，用户等很久才拿到结果，甚至超时——这是”**假死**“，比直接失败更难排查。**小队列 + `AbortPolicy` 能让问题立刻暴露**。<br>**② 但生产上，我会把拒绝策略换掉**：`AbortPolicy` 直接抛异常，用户会看到错误。更好的做法是：
>
> - **`CallerRunsPolicy`**：让**提交任务的线程自己去执行**。这样能给上游**背压**（提交变慢了），不会丢任务——**适合不能丢的场景**；
> - **自定义拒绝策略**：**记录日志 + 落库 + 告警 + 降级返回兜底数据**。
>
> **③ 线程数怎么定？** 我们的任务是**调远程接口（IO 密集型）**，理论上公式是 **`N+1`**（CPU 密集型）或 **`2N+1`**（IO 密集型）。<br>**但我要强调：这个公式只是”起点”，不能直接照搬。** 因为：
>
> - **`2N+1` 没有考虑下游的承受能力**——我开 100 个线程去打下游，下游可能直接被我打挂；
> - 真正的做法是**压测**：从一个小值开始，逐步增加线程数，**观察 QPS 和响应时间**，找到**拐点**（QPS 不再上升、RT 开始飙升的那个点），取拐点前 70~80% 的值。<br>**这就是为什么我们的核心线程数只有 3** ——因为我们只在**专辑详情**这一个接口用，QPS 不高，**3 个线程足够，且对下游压力小**。

---

### 10.2 🔥 CompletableFuture 异步编排

**面试官原话**

- `企业真题.txt:8` 京东：**“除了线程池，异步编排是用在哪部分”**
- `企业真题.txt:56` 北京诺来：**“你能跟我说一下是怎么使用 CompletableFuture 的吗？你使用 CompletableFuture 进行并发请求的实际场景是什么？”**
- `企业真题.txt:178` 美亚柏科：**“介绍一下 CompletableFuture 做了什么”**
- `企业真题.txt:1110` 中科软二面：**“CompletableFuture 是干嘛的？解决了什么问题”**
- `企业真题.txt:877` 长亮科技、`:1105` 北京畅腾：**“异步编排，获取线程执行结果的方式有哪些”**
- `企业真题.txt:548` 东软汉和：**“CompletableFuture 怎么实现这个功能的”**
- `企业真题.txt:1426` 美团外包：**“completablefutrue 的实现原理”**

#### 代码位置

```java
// SearchServiceImpl#upperAlbum1:577-656（专辑上架时聚合数据）
public void upperAlbum1(Long albumId) {
    AlbumInfoIndex albumInfoIndex = new AlbumInfoIndex();

    //任务1：获取专辑信息
    CompletableFuture<AlbumInfo> completableFuture1 =
            CompletableFuture.supplyAsync(() -> {
                AlbumInfo albumInfo = albumInfoFeignClient.getAlbumInfo(albumId).getData();
                BeanUtils.copyProperties(albumInfo, albumInfoIndex);
                return albumInfo;
            }, threadPoolExecutor);

    //任务2：依赖任务1的结果（拿到 category3Id 再查分类）
    CompletableFuture<Void> completableFuture2 =
            completableFuture1.thenAcceptAsync(albumInfo -> {
                Long category3Id = albumInfo.getCategory3Id();
                BaseCategoryView baseCategoryView =
                        categoryFeignClient.getCategoryView(category3Id).getData();
                albumInfoIndex.setCategory1Id(baseCategoryView.getCategory1Id());
                // ...
            }, threadPoolExecutor);

    //任务3：获取标签数据  ⚠️ 注意：这里没传线程池！
    CompletableFuture<Void> completableFuture3 = CompletableFuture.runAsync(() -> {
        List<AlbumAttributeValue> list =
                albumInfoFeignClient.findAlbumAttributeValue(albumId).getData();
        // ...
    });                                    // ← 缺了 threadPoolExecutor 参数

    //任务4：依赖任务1的结果（拿 userId 查主播信息）
    CompletableFuture<Void> completableFuture4 =
            completableFuture1.thenAcceptAsync(albumInfo -> {
                Long userId = albumInfo.getUserId();
                UserInfoVo userInfoVo = userInfoFeignClient.getUserInfoVo(userId).getData();
                albumInfoIndex.setAnnouncerName(userInfoVo.getNickname());
            }, threadPoolExecutor);

    //等待所有任务完成
    CompletableFuture.allOf(
            completableFuture1, completableFuture2, completableFuture3, completableFuture4
    ).join();

    albumInfoIndexRepository.save(albumInfoIndex);
}
```

#### ✅ 面试就按这个说

> **`CompletableFuture` 解决了”多个异步任务的编排”问题**——它不仅能拿到异步结果，还能**描述任务之间的依赖关系**（串行、并行、聚合、异常处理）。
>
> **我的场景是”专辑详情/专辑上架”要聚合 4 类数据**：
>
> - 专辑基本信息
> - 专辑分类（一/二/三级）
> - 专辑标签
> - 主播信息
>
> **改造前**是**串行** 4 次远程调用，假设每次 200ms，总耗时 **800ms**。<br>**改造后**用 `CompletableFuture` 并行：
>
> - 任务 1（专辑信息）先跑；
> - 任务 2、4 **依赖任务 1 的结果**（要先拿到 `category3Id`、`userId`），用 `thenAcceptAsync` 串接；
> - 任务 3（标签）**不依赖任务 1**，用 `runAsync` **直接并行**；
> - 最后用 **`allOf(...).join()`** 等所有任务完成。
>
> **总耗时降到约 400ms**（任务1 200ms + 任务2/4 并行 200ms），**提升了一倍**。

#### ✅ 追问：「常用的方法有哪些？」

> 分四类：<br>**① 创建**：`supplyAsync`（**有返回值**）、`runAsync`（**无返回值**）；<br>**② 串行（依赖）**：`thenApply`（转换结果）、`thenAccept`（消费结果，无返回）、`thenRun`（不关心结果）；<br>**③ 组合（并行）**：
>
> - `thenCombine`：**两个任务都完成后合并结果**；
> - `thenCompose`：**扁平化嵌套**的 CompletableFuture（类似 `flatMap`）；
> - `allOf`：**等所有任务完成**（无返回值）；
> - `anyOf`：**任一完成即可**；<br>**④ 异常处理**：`exceptionally`、`handle`、`whenComplete`。
>
> **带 `Async` 后缀的方法**（`thenApplyAsync`）表示**用另一个线程执行**；不带则在**当前（或上一个任务的）线程**执行。

#### ✅ 追问：「`join()` 和 `get()` 的区别？」

> **都是阻塞等待结果**，区别在**异常处理**：
>
> - **`get()`**：抛出**受检异常** `InterruptedException` / `ExecutionException`，必须 try-catch；
> - **`join()`**：抛出**非受检异常** `CompletionException`，不需要捕获。
>
> **`join()` 更适合流式编程**（不用写 try-catch），我们代码里用的就是 `join()`。

#### ⚠️ 真实缺陷 1：任务 3 漏传线程池

```java
CompletableFuture<Void> completableFuture3 = CompletableFuture.runAsync(() -> {
    ...
});          // ← 没有第二个参数 threadPoolExecutor
```

⚠️ **不传线程池，`runAsync` 会用 `ForkJoinPool.commonPool()`**（默认线程数 = **CPU 核数 - 1**）。

**后果**：

- **线程池隔离失效**——我们精心配置的 `threadPoolExecutor` 只覆盖了 3 个任务，第 4 个跑到公共池里去了；
- **公共池是 JVM 全局共享的**，如果被**其他任务（比如 parallelStream、其他地方的 CompletableFuture）占满**，我们这个任务会**排队等待**，性能不可控；
- **排查困难**——线程名是 `ForkJoinPool.commonPool-worker-1`，看不出是我们的业务。

> **✅ 改进**：**始终显式传线程池**。这是个很容易漏的细节，**代码 review 时要专门检查 `Async` 方法有没有传 executor**。

#### ⚠️ 真实缺陷 2：4 个任务并发写同一个对象

```java
AlbumInfoIndex albumInfoIndex = new AlbumInfoIndex();     // 共享可变对象
// 任务1：BeanUtils.copyProperties(albumInfo, albumInfoIndex);
// 任务2：albumInfoIndex.setCategory1Id(...); setCategory2Id(...); setCategory3Id(...);
// 任务3：albumInfoIndex.setAttributeValueIndexList(...);
// 任务4：albumInfoIndex.setAnnouncerName(...);
```

⚠️ **多个线程同时往一个普通 POJO 里 `set` 值**，存在**可见性**和**竞态**问题：

- **可见性**：`albumInfoIndex` 的字段**没有 `volatile` 保证**。虽然 `allOf().join()` 有 **happens-before** 语义（`join` 之后的代码能看到所有任务的结果），**在实践中通常没问题**，但这是**依赖 JMM 的细节**，不是好的写法。
- **更实际的风险**：如果多个任务 set **同一个字段**（比如任务 1 和任务 3 都设 `albumInfoIndex` 的某个属性），就会**互相覆盖，结果不确定**。

> **✅ 改进**：<br>**① 让每个任务返回自己的结果**，最后在 `allOf().join()` 之后**统一组装**：
>
> ```java
> CompletableFuture<AlbumInfo> f1 = ...;
> CompletableFuture<BaseCategoryView> f2 = ...;
> CompletableFuture<List<AttributeValueIndex>> f3 = ...;
> CompletableFuture<String> f4 = ...;
> CompletableFuture.allOf(f1, f2, f3, f4).join();
> // 主线程统一组装，无并发问题
> AlbumInfoIndex index = new AlbumInfoIndex();
> BeanUtils.copyProperties(f1.join(), index);
> index.setAnnouncerName(f4.join());
> ```
>
> 这样**没有共享可变状态**，逻辑更清晰，也**没有可见性问题**。<br>**② 任务里有异常会被吞掉**：`allOf().join()` 只会抛**第一个**遇到的异常，**其他任务的异常会丢失**。应该给每个 future 加 `.exceptionally()` 或者在 `allOf` 后逐个检查。

#### ✅ 追问：「异步编排和 MQ 有什么区别？」

**这题常被连着问**（对比第 7 章的 MQ vs 多线程）：

> **关键区别是”要不要等结果”**：
>
> - **异步编排（CompletableFuture）**：**调用方需要结果**才能继续（专辑详情必须等 4 个数据都拿到才能返回给前端）。特点是**并行执行、同步等待**——**整体还是在同一个请求生命周期内**。
> - **MQ**：**调用方不需要结果**（发短信、加积分、同步 ES）。特点是**完全异步、解耦**，请求可以先返回。
>
> **判断标准**：如果我**必须等这个结果**才能响应，就用**异步编排**；如果**可以先响应、稍后再做**，就用 **MQ**。

---

### 10.3 线程池的异常与关闭

**面试官原话**（`企业真题.txt:1021` 元保集团：**“如何优雅得关闭多线程”**；`企业真题.txt:1550` 东方国信：**“多线程可以套多线程吗”**；`企业真题.txt:894` 京北方：**“线程池底层原理是什么”**）

#### ✅ 追问：「线程池里的线程抛异常会怎样？」（八股文件里也提到了）

> **分两种情况**：<br>**① 用 `execute()` 提交**：异常会**直接抛出**，并且**这个线程会死亡**，然后线程池会**创建一个新线程**补充（保持核心线程数）。所以**线程池不会被”打空”**。<br>**② 用 `submit()` 提交**：异常会被**封装进 `Future`**，如果你**不调用 `future.get()`，异常就被静默吞掉了**，你完全不知道出错了！
>
> ⚠️ **这是很常见的坑**：用 `submit()` 提交任务，任务里抛异常，因为没人 `get()`，**异常消失了**，业务静默失败。<br>**✅ 解决**：① 用 `execute()`；② 或者 `submit()` 后一定要 `get()`；③ 或者**重写 `afterExecute`** 统一记录异常。

#### ✅ 追问：「如何优雅关闭线程池？」

> **① `shutdown()`**：**平缓关闭**——不再接受新任务，但**会把队列里已有的任务执行完**；<br>**② `shutdownNow()`**：**立即关闭**——尝试**中断**正在执行的任务，**返回队列里未执行的任务列表**；<br>**③ 优雅关闭的标准写法**：
>
> ```java
> @PreDestroy
> public void destroy() {
>     pool.shutdown();                                  // 先停止接收
>     try {
>         if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {   // 等 30 秒
>             pool.shutdownNow();                       // 还没结束就强制关闭
>         }
>     } catch (InterruptedException e) {
>         pool.shutdownNow();
>         Thread.currentThread().interrupt();
>     }
> }
> ```
>
> 配合 Spring 的 **`@PreDestroy`**（或者实现 `DisposableBean`），在**应用关闭时自动触发**。<br>⚠️ **如果不优雅关闭**：服务重启时，**队列里没执行完的任务会丢**，而且正在执行的任务会被**中途杀死**，可能导致**数据不一致**。

#### ✅ 追问：「我们自己代码里的裸线程有什么问题？」

回到 `RedisDelayHandle`：

```java
@PostConstruct
public void listener() {
    new Thread(()->{
        while(true) { ... }
    }).start();
}
```

> ⚠️ **这段代码有三个问题**：<br>**① 没有线程池**：违反”**不要手动 `new Thread`**“的规范。手动创建的线程**不受管理**——没有统一命名、没有异常处理、没有监控。<br>**② 异常导致线程死亡**：`while(true)` 里抛 `RuntimeException` 会**直接杀死这个线程**，之后**永远不再消费**（见 4.6 的详细分析）。<br>**③ 无法优雅关闭**：这个线程**不受 Spring 管理**，应用关闭时**不会等它结束**，也没有 `@PreDestroy` 去中断它。虽然它是 `while(true)` 的守护与否……实际上**非守护线程会阻止 JVM 退出**！如果它是非 daemon 线程，**应用关不掉**。
>
> **✅ 改进**：
>
> ```java
> @Bean("delayQueueExecutor")
> public ThreadPoolExecutor delayExecutor() { ... }
>
> @PostConstruct
> public void listener() {
>     delayQueueExecutor.execute(() -> {      // 用线程池
>         while (!Thread.currentThread().isInterrupted()) {
>             try {
>                 String orderId = blockingQueue.take();
>                 orderInfoService.cancelOrder(Long.parseLong(orderId));
>             } catch (InterruptedException e) {
>                 Thread.currentThread().interrupt();   // 优雅退出
>                 break;
>             } catch (Exception e) {
>                 log.error("延迟关单异常", e);          // 业务异常不退出
>             }
>         }
>     });
> }
> ```

---

## 11. 设计模式落地（策略 + 工厂）

> **一句话总述**：添加购买记录时，VIP、专辑、声音三类逻辑不同，我用”策略模式 + 工厂模式”消除 if-else，通过 Spring 的 Map 注入自动装配策略。

### 11.1 🔥 策略 + 工厂模式的实现

**面试官原话**

- `企业真题.txt:561` 中科铭天：**“工厂+策略怎么用的”**
- `企业真题.txt:1113` 中科软二面：**“策略类+工厂类是干嘛的”**
- `企业真题.txt:734` 美团驻场：**“策略模式+工厂具体是怎么写的，怎么个使用过程”**
- `企业真题.txt:138` 乾睿信息：**“在策略模式+工厂模式中不同类型订单中的确认逻辑，简化了哪种操作？策略工厂需要实现哪些接口?”**
- `企业真题.txt:389` 快手外包：**“为什么选择策略模式和工厂模式”**
- `企业真题.txt:979` 快手外包二面：**“代码：策略模式（自定义场景简单实现，注意编码规范）”** ← 要手写！
- `企业真题.txt:1417` 高伟达笔试：**“现有不同的折扣类型（A、B、C），添加新的折扣类型；并用策略实现”** ← 要手写！
- `企业真题.txt:734` 美团：**“用抽象类和接口写策略模式的区别是什么”**

#### 代码位置

**① 策略接口**

```java
// ItemTypeStrategy.java
public interface ItemTypeStrategy {
    void savePaidRecord(UserPaidRecordVo userPaidRecordVo);
}
```

**② 三个实现类 —— 注意 Bean 名字就是类型码**

```java
// AlbumItemTypeStrategyImpl.java
@Component("1001")     // ← Bean 名 = "1001"（专辑）
public class AlbumItemTypeStrategyImpl implements ItemTypeStrategy { ... }

// TrackItemTypeStrategyImpl.java
@Component("1002")     // ← Bean 名 = "1002"（声音）
public class TrackItemTypeStrategyImpl implements ItemTypeStrategy { ... }

// VipItemTypeStrategyImpl.java:18-19
@Component("1003")     // ← Bean 名 = "1003"（VIP）
public class VipItemTypeStrategyImpl implements ItemTypeStrategy {
    @Override
    public void savePaidRecord(UserPaidRecordVo userPaidRecordVo) {
        //1 新增 VIP 购买记录
        UserVipService userVipService = new UserVipService();
        VipServiceConfig vipServiceConfig =
                vipServiceConfigMapper.selectById(userPaidRecordVo.getItemIdList().get(0));
        //2 判断是否续费：如果是 VIP 且未过期，从原过期时间往后加
        UserInfo userInfo = userInfoMapper.selectById(userPaidRecordVo.getUserId());
        Date currentTime = new Date();
        if (userInfo.getIsVip().intValue() == 1
                && userInfo.getVipExpireTime().after(new Date())) {
            currentTime = userInfo.getVipExpireTime();     // 续费：从原到期时间算
        }
        currentTime = new LocalDateTime(currentTime)
                .plusMonths(vipServiceConfig.getServiceMonth()).toDate();
        userVipService.setExpireTime(currentTime);
        // ... 保存并更新用户表
    }
}
```

**③ 工厂 —— 用 Spring 的 Map 注入自动收集所有实现**

```java
// StrategyFactory.java:9-34
@Component
public class StrategyFactory {

    // * 将 IOC 容器中 ItemTypeStrategy 接口下所有实现类对象注入到 Map 中
    // * Map 中 Key：Bean 对象 ID
    // * Map 中 Value：实现类对象
    // * {"1001":购买类型为专辑策略类对象}
    // * {"1002":购买类型为声音策略类对象}
    // * {"1003":购买类型为 vip 策略类对象}
    @Autowired
    private Map<String, ItemTypeStrategy> itemTypeStrategy;

    //根据不同类型 返回不同对象的方法
    public ItemTypeStrategy getStrategy(String itemType) {
        if (itemTypeStrategy.containsKey(itemType)) {
            return itemTypeStrategy.get(itemType);
        }
        throw new GuiguException(500, "该策略" + itemType + "实现类不存在");
    }
}
```

**④ 使用**

```java
// UserInfoServiceImpl#savePaidRecord:155-165
@Override
public void savePaidRecord(UserPaidRecordVo userPaidRecordVo) {
    String itemType = userPaidRecordVo.getItemType();       // 1001/1002/1003
    //1 根据购买类型，获取不同的实现类
    ItemTypeStrategy strategy = strategyFactory.getStrategy(itemType);
    //2 调用不同实现类里面添加购买记录方法
    strategy.savePaidRecord(userPaidRecordVo);
}
```

#### ✅ 面试就按这个说

> **要解决的问题**：添加购买记录时，**VIP、专辑、声音三类的逻辑完全不同**（VIP 要算过期时间、专辑要写 `user_paid_album`、声音要写 `user_paid_track`）。用 if-else 会很难维护（代码里 `savePaidRecord1` 就是那个 60 多行的 if-else 版本）。
>
> **策略模式**把”**同一个行为的不同实现**“抽出来：<br>**①** 定义 `ItemTypeStrategy` 接口，有一个 `savePaidRecord` 方法；<br>**②** 三个实现类分别处理三种类型。
>
> **工厂模式**负责”**根据类型返回对应策略**“：<br>**关键技巧是我们没有手动写 if-else 来注册策略**，而是**利用 Spring 的 `Map` 注入**：
>
> ```java
> @Autowired
> private Map<String, ItemTypeStrategy> itemTypeStrategy;
> ```
>
> Spring 会**自动把容器里所有 `ItemTypeStrategy` 类型的 Bean 注入到这个 Map**，**key 是 Bean 名，value 是 Bean 实例**。<br>所以我们在实现类上写 **`@Component("1001")`**，Bean 名就是类型码，Map 就自动变成了 **`{"1001": 专辑策略, "1002": 声音策略, "1003": VIP策略}`**——**一个 if 都不用写**。

#### ✅ 追问：「为什么选择策略模式和工厂模式？」

**快手外包原题**：

> **策略模式的本质是消除 if-else，符合开闭原则**。<br>**① 可扩展性**：以后要加”购买直播门票”这种新类型，我只要**新增一个 `@Component("1004")` 的实现类**，**不用改任何现有代码**——这就是**对扩展开放、对修改关闭**。<br>**② 可读性**：每种类型的逻辑**独立在一个类里**，比 60 行的 if-else 清晰得多。<br>**③ 可测试**：每个策略可以**单独写单元测试**。
>
> **工厂模式**解决的是”**怎么找到正确的策略**“——把”选择”这个动作**收敛到一个地方**，业务代码不关心具体实现。

#### ✅ 追问：「策略工厂需要实现哪些接口？」

**乾睿信息原题**：

> 策略工厂本身**不需要实现任何接口**，它是一个 **`@Component`**（Spring Bean）。<br>**真正需要实现接口的是”策略类”**——它们必须实现 **`ItemTypeStrategy`** 接口，只有这样 Spring 才能把它们**按类型注入到 Map 里**。<br>这就是我们不用手写 if-else 注册的原因——**接口是”约定”，Map 注入是”发现机制”**。

#### ✅ 追问：「用抽象类还是接口实现策略模式？」

**美团原题**：

> **首选接口**。原因：<br>**① 解耦**：接口只定义”**能做什么**“，不涉及实现，策略类可以**自由继承其他类**（Java 单继承，用抽象类就被占用了）；<br>**② 无状态**：策略类通常是**无状态的**（只有方法，没有字段），不需要抽象类来共享状态；<br>**③ Spring 注入只需要类型匹配**，接口足够。
>
> **什么时候用抽象类？** 如果多个策略**有大量重复代码**（比如都要先做参数校验、记日志、做公共的数据转换），那可以用**抽象类做模板方法**：
>
> ```java
> public abstract class AbstractItemTypeStrategy implements ItemTypeStrategy {
>     @Override
>     public final void savePaidRecord(UserPaidRecordVo vo) {   // final 固定流程
>         validate(vo);            // 公共逻辑
>         doSavePaidRecord(vo);    // 子类实现
>         afterSave(vo);           // 公共逻辑
>     }
>     protected abstract void doSavePaidRecord(UserPaidRecordVo vo);
> }
> ```
>
> **这就是”策略模式 + 模板方法模式”的组合**，也是我们项目里可以改进的地方。

#### ⚠️ 真实缺陷：用 Bean 名做 key 不够健壮

```java
@Component("1001")     // ⚠️ 依赖"Bean 名字面量"和"业务类型码"一致
```

**问题**：`StrategyFactory` 靠 **Bean 名**匹配业务类型码。这意味着：

- **如果有人把注解写错了**（比如写成 `@Component("10001")`），编译**不报错**，运行时才抛 `该策略1001实现类不存在`；
- **IDE 重构改名**会破坏这个隐式约定；
- **新人容易踩坑**——他不知道为什么 Bean 名必须是数字。

> **✅ 更健壮的方案：用自定义注解显式声明类型码**
>
> ```java
> @Target(ElementType.TYPE)
> @Retention(RetentionPolicy.RUNTIME)
> @Component                      // 组合 @Component，自动成为 Bean
> public @interface ItemType {
>     String value();             // 业务类型码
> }
>
> @ItemType("1001")               // 显式声明，语义清晰
> public class AlbumItemTypeStrategyImpl implements ItemTypeStrategy { ... }
> ```
>
> 然后工厂里**初始化时扫描所有实现类**，读注解建立 `Map<类型码, 策略>`，并且在**启动时校验**（有没有重复、有没有遗漏）——**把错误从”运行时”提前到”启动时”**。<br>甚至可以在**枚举里定义所有类型码**，用枚举做 key，**彻底避免字符串魔法值**。

---

### 11.2 其他设计模式

**面试官原话**（`企业真题.txt:962` 上海爱回收：**“你对模板方法模式有什么理解？”**；`企业真题.txt:571` 中华财险：**“讲一讲工厂模式和策略模式”**；`企业真题.txt:924` 润建：**“单例模式和工厂模式他俩的应用场景”**）

| 模式 | 在项目中的体现 | 一句话说明 |
| --- | --- | --- |
| **策略 + 工厂** | `ItemTypeStrategy` + `StrategyFactory` | 消除购买记录的 if-else |
| **模板方法** | `ServiceImpl`（MyBatis-Plus）、`GuiGuCacheAspect` 的固定流程 | 父类定流程，子类填步骤 |
| **代理** | Spring AOP（`@GuiguLogin`、`@GuiGuCache`）、Feign | 不改变源码增强功能 |
| **单例** | 所有 Spring Bean（默认单例） | 全局唯一实例 |
| **建造者** | `SearchRequest.Builder()`、`PrepayRequest` | 链式构建复杂对象 |
| **责任链** | Gateway 的 Filter 链、`ChannelPipeline` | 请求依次经过多个处理器 |
| **观察者** | Spring 的 `ApplicationListener`（`RabbitInitConfigApplicationListener`） | 事件发布订阅 |

#### ✅ 追问：「模板方法模式讲讲？」

**上海爱回收原题**：

> **模板方法**是在**抽象类里定义一个算法的骨架**，把某些步骤**延迟到子类实现**。<br>**核心是 `final` 的模板方法**（固定流程）+ **`abstract` 的钩子方法**（子类扩展）。
>
> **我们项目里的体现**：<br>**① MyBatis-Plus 的 `ServiceImpl`**——它定义了 `save`/`getById`/`updateById` 的通用实现，我们只要继承它、指定 Mapper 泛型，就白得一堆 CRUD 方法。<br>**② Spring 的 `JdbcTemplate`**、**`AbstractApplicationContext.refresh()`** 都是经典模板方法（`refresh()` 里定义了 `obtainFreshBeanFactory` → `invokeBeanFactoryPostProcessors` → … 一整套启动流程）。<br>**③ 我们的缓存切面**其实也可以改造成模板方法：`tryLock → 查库 → 回写 → 解锁` 是固定流程，把”查库”这个动作留给业务。

#### ✅ 追问：「单例模式的饿汉式和懒汉式？」

**美团外包笔试原题**（要能手写）：

```java
// ① 饿汉式：类加载就创建，线程安全，但可能浪费（没用上就创建了）
public class Singleton1 {
    private static final Singleton1 INSTANCE = new Singleton1();
    private Singleton1() {}
    public static Singleton1 getInstance() { return INSTANCE; }
}

// ② 懒汉式（DCL 双重检查锁）：推荐
public class Singleton2 {
    // ⚠️ 必须加 volatile！防止指令重排序
    private static volatile Singleton2 instance;
    private Singleton2() {}
    public static Singleton2 getInstance() {
        if (instance == null) {                  // 第一次检查：避免每次都加锁
            synchronized (Singleton2.class) {
                if (instance == null) {          // 第二次检查：防止重复创建
                    instance = new Singleton2();
                }
            }
        }
        return instance;
    }
}

// ③ 静态内部类（最优雅）：兼顾懒加载和线程安全
public class Singleton3 {
    private Singleton3() {}
    private static class Holder {
        private static final Singleton3 INSTANCE = new Singleton3();
    }
    public static Singleton3 getInstance() { return Holder.INSTANCE; }
}

// ④ 枚举（《Effective Java》推荐，天然防反射和序列化破坏）
public enum Singleton4 {
    INSTANCE;
    public void doSomething() {}
}
```

> ⚠️ **`volatile` 为什么必须加？**<br>因为 `instance = new Singleton2()` 不是原子操作，分三步：**① 分配内存 → ② 初始化对象 → ③ 把引用指向内存**。<br>**JVM 可能重排序成 ①→③→②**，此时另一个线程在第一次检查时**看到 instance 不为 null**（但对象还没初始化完），就会**返回一个半成品对象**！<br>`volatile` 通过**禁止指令重排序**解决这个问题。

---

### 11.3 第 10-11 章追问链速查

| 追问 | 答题要点 |
| --- | --- |
| 线程池 7 参数 | core/max/keepAlive/unit/queue/factory/handler |
| 为什么不用 Executors | 无界队列 OOM / 无限线程 OOM |
| 执行流程 | 核心→队列→最大→拒绝 |
| 核心2最大5默认队列扔5个任务 | 执行线程数 = 2（无界队列不创建非核心） |
| 线程数怎么定 | 公式只是起点，要压测找拐点 |
| 拒绝策略 4 种 | Abort / CallerRuns / Discard / DiscardOldest |
| CompletableFuture 场景 | 聚合 4 个远程调用，串行改并行 |
| allOf / anyOf | 等全部 / 等任一 |
| join vs get | 非受检 vs 受检异常 |
| 不传线程池的后果 | 落 ForkJoinPool.commonPool |
| 共享对象并发写的风险 | 可见性 + 覆盖；应各返回各的结果 |
| execute vs submit 异常 | 直接抛并补充线程 / 封装进 Future 可能被吞 |
| 优雅关闭 | shutdown + awaitTermination + shutdownNow |
| 策略模式好处 | 消除 if-else，符合开闭原则 |
| 为什么用 Map 注入 | Bean 名做 key，免写注册 if-else |
| 接口 vs 抽象类 | 首选接口；有公共逻辑用抽象类+模板方法 |
| 加新类型怎么做 | 新增 `@Component("新码")` 实现类即可，不改旧代码 |
| volatile 在 DCL 的作用 | 禁止指令重排序，防半初始化对象 |

---

## 12. Java 基础与 Spring（项目化回答）

> **本章原则**：基础题**不要只背概念**，一定要**结合项目说”我在哪里用到过”**。这是 `企业真题.txt` 里几乎所有面试官都在做的事——**“讲讲集合”后面紧跟着”你项目里哪里用了 list/map/set”**（见 `企业真题.txt:139-140` 维思陆、`企业真题.txt:355` 同达合创）。

### 12.1 🔥 集合框架

**面试官原话**（`企业真题.txt:139-140` 维思陆：**“list，map，set 区别及使用 / 项目里怎么使用的 list，map，set”**；`企业真题.txt:355` 同达合创：**“集合框架，你的项目里哪里用了 list，map，set”**；`企业真题.txt:508` 海港城：**“常用的集合类”**）

#### ✅ 项目里哪里用了集合（**这是加分回答**）

| 集合 | 项目中的位置 | 为什么用它 |
| --- | --- | --- |
| **`HashMap`** | `userIsPaidTrack` 返回 `Map<Long,Integer>`（是否购买）、`channel()` 的 `category3Map` | O(1) 查找，快速判断”是否购买” |
| **`ArrayList`** | 订单明细 `List<OrderDetailVo>`、`orderDetailVoList` | 顺序存储、按索引访问、遍历多 |
| **`HashSet`** | `completeSuggest` 里 `titleSet`（自动补全去重） | 需要**去重**，且不关心顺序 |
| **`TreeMap`** | `SignHelper.getSign` 里的 `TreeMap` | **需要按 key 排序**保证签名一致性 |
| **`ConcurrentHashMap`** | Spring 容器内部、`StrategyFactory` 的 `Map<String,ItemTypeStrategy>` | 并发安全 |

#### ✅ 追问：「`ArrayList` 和 `LinkedList` 区别？」

**超高频**（`企业真题.txt:534,576,830,1092,1162`）：

|  | ArrayList | LinkedList |
| --- | --- | --- |
| 底层 | **动态数组** | **双向链表** |
| 随机访问 | **O(1)**（下标直接算） | **O(n)**（要遍历） |
| 头部插入/删除 | **O(n)**（要移动元素） | **O(1)**（改指针） |
| 内存 | 连续，有**扩容预留** | 每个节点多两个指针，**内存开销大** |
| 适用 | **查多改少** | **头尾增删多**（做队列/栈） |

> **项目中**：订单明细用的是 `ArrayList`，因为**主要是遍历和按顺序展示**，很少在中间插入。<br>**补充**：`ArrayList` 扩容是 **1.5 倍**（`oldCapacity + (oldCapacity >> 1)`），扩容会**复制数组**，所以如果能预估大小，**构造时指定初始容量**更好（避免多次扩容）。

#### ✅ 追问：「`ArrayList` 线程安全吗？」

**`企业真题.txt:572` 快手外包：**“举一个线程不安全的例子”\*\*

> **不安全**。多个线程同时 `add` 会导致**数据覆盖、size 不准**，甚至**数组越界**。<br>**三种解决方案**：<br>**① `Collections.synchronizedList()`**：给每个方法加 `synchronized`，**读也加锁**，性能差；而且**迭代时仍要手动加锁**（否则 `ConcurrentModificationException`）。<br>**② `CopyOnWriteArrayList`**：**写时复制**——写操作时**复制一个新数组**，写完替换引用。**读完全无锁，性能极高**。适合**读多写少**（比如白名单、监听器列表）；**写多时性能极差**（每次都要复制整个数组），而且**只能保证最终一致性**（读到的可能是旧数据）。<br>**③ 自己加锁**。

#### ✅ 追问：「`HashMap` 的底层原理？」

**超高频**（`企业真题.txt:509-511,666,914,927,1094,1279,1402`）：

> **JDK 1.8 的 `HashMap` 是「数组 + 链表 + 红黑树」**：<br>**① put 流程**：
>
> 1. 计算 key 的 hash：`(h = key.hashCode()) ^ (h >>> 16)`——**高 16 位异或低 16 位**，让高位也参与运算，**减少哈希冲突**；
> 2. `(n-1) & hash` 定位数组下标（n 是容量，因为 n 是 **2 的幂**，所以等价于取模但**位运算更快**）；
> 3. 如果该位置为空，直接放；否则**遍历链表/红黑树**：
>   - key 相同（`hash` 相等且 `equals` 为 true）→ **覆盖 value**；
>   - 否则**尾插**到链表末尾（JDK 1.7 是**头插**，1.8 改尾插）；
> 4. **链表长度 ≥ 8 且数组长度 ≥ 64** → **转红黑树**（查询从 O(n) 降到 O(log n)）；红黑树节点 ≤ 6 → **退化成链表**。
>
> **② 为什么容量是 2 的幂？** 因为 `(n-1) & hash` 才能等价于 `hash % n`。**如果 n 不是 2 的幂，位运算就不等价于取模，分布会极不均匀**。
>
> **③ 为什么扩容是 2 倍？** 同样是保持”2 的幂”这个性质。而且 2 倍扩容有个巧妙之处：元素**要么在原位置，要么在原位置 + 原容量**，**不需要重新计算 hash**（只判断 `hash & oldCap` 是 0 还是 1）。
>
> **④ 为什么用红黑树不用 AVL 树？** 红黑树**插入/删除时的旋转次数更少**（AVL 是严格平衡，代价高），**综合性能更好**。而且只有在极端冲突时才会用到，**不需要那么严格的平衡**。
>
> **⑤ 为什么链表转树的阈值是 8？** 因为 hash 分布均匀时，链表长度符合**泊松分布**，长度达到 8 的概率是 **0.00000006**，**极小**。设成 8 是为了\*\*”几乎不会转树，但一旦转了说明真的有严重冲突”**。**树转链表的阈值是 6**（不是 7），是为了**留一个缓冲，避免在 7 附近反复转换\*\*。

#### ✅ 追问：「`HashMap` 线程安全吗？`ConcurrentHashMap` 怎么保证安全？」

> **`HashMap` 线程不安全**。JDK 1.7 时并发扩容会导致**环形链表**（CPU 100%），1.8 修复了环形链表但仍有**数据覆盖**问题。
>
> **`ConcurrentHashMap` 的演进**：<br>**① JDK 1.7：分段锁（Segment）**<br>把数据分成 16 个 `Segment`，每个 Segment 是一个**继承自 `ReentrantLock` 的小 HashMap**。**不同 Segment 可以并发写**，并发度 = Segment 数量。<br>**缺点**：并发度固定，内存开销大（要维护 Segment 数组）。
>
> **② JDK 1.8：`CAS + synchronized` 锁单个桶**
>
> - **数组 + 链表 + 红黑树**（和 HashMap 一样）；
> - **`put` 时如果桶为空**，用 **CAS** 写入（无锁）；
> - **如果桶不为空**，用 **`synchronized` 锁住这个桶的头节点**——**锁的粒度从”段”细化到”桶”**，并发度大幅提升；
> - **`size` 用 `baseCount + CounterCell[]`** 分散计数（类似 `LongAdder`），避免热点。
>
> **③ `ConcurrentHashMap` 不允许 null key/value**，因为**并发下无法区分”不存在”和”值为 null”**（`get` 返回 null 时，你没法判断是该重试还是真的没有）。

#### ✅ 追问：「`HashMap` 的 key 可以为 null 吗？」

**`企业真题.txt:1163,1236`**：

> - **`HashMap`**：**可以**。null key 会被放在**数组下标 0 的位置**（因为 null 的 hash 被特殊处理为 0），且**只能有一个** null key。
> - **`Hashtable`**：**不可以**，会抛 `NullPointerException`（源码里有 `if (value == null) throw new NullPointerException()`）。
> - **`ConcurrentHashMap`**：**不可以**（原因见上）。
> - **`TreeMap`**：**key 不能为 null**（因为要调用 `compareTo` 比较，null 会 NPE）；**value 可以为 null**。

#### ✅ 追问：「`String`、`StringBuilder`、`StringBuffer` 区别？」

**`企业真题.txt:134,672,830,939`**：

> - **`String`**：**不可变**（`final class` + `final char[]`），每次拼接都**创建新对象**；
> - **`StringBuilder`**：**可变**，**线程不安全**，**性能最好**；
> - **`StringBuffer`**：**可变**，方法都加了 **`synchronized`**，**线程安全**但性能略差。
>
> **项目中**：我们**大量用了 `StringBuilder`**——比如 `SignHelper.getSign:60-66` 拼接签名字符串、`SearchServiceImpl.buildQueryDsl` 里拼 SQL 片段。因为都是**局部变量，不存在线程安全问题**，用 `StringBuilder` 就够了。<br>**如果是循环里拼接**，**必须用 `StringBuilder`**——用 `String` 的 `+` 会创建大量临时对象（虽然编译器会对**简单拼接**做优化成 `StringBuilder`，但**循环内部的拼接不会优化**）。

#### ✅ 追问：「`String` 为什么不可变？」

**`企业真题.txt:135,828,1291`**：

> **三个原因**：<br>**① 类被 `final` 修饰**，不能被继承（防止子类破坏不可变性）；<br>**② 内部的 `char[]`（JDK 9+ 是 `byte[]`）被 `private final` 修饰**，且**没有提供修改数组元素的方法**；<br>**③ 所有”修改”方法（`substring`、`concat`、`replace`）都返回新对象**。
>
> **为什么这样设计？**<br>**① 字符串常量池**：不可变才能安全地**共享**——`String a = "abc"; String b = "abc";` 两个变量指向**同一个对象**。如果可变，改 a 会影响 b。<br>**② 线程安全**：不可变对象**天然线程安全**，可以自由共享。<br>**③ 缓存 hashCode**：`String` 内部缓存了 `hash`，因为不可变，**算一次就能一直用**。这也是为什么 `String` 特别适合做 `HashMap` 的 key。<br>**④ 安全性**：数据库连接 URL、类名、文件路径都用 String 传，如果可变，**可能被恶意篡改**。

---

### 12.2 Spring 核心

**面试官原话**（`企业真题.txt:113` 软通动力：**“对 IOC 控制反转和 AOP 动态代理的理解 / 对 Spring 的理解”**；`企业真题.txt:1237` 宇信科技：**“Spring 的工作原理？”**；`企业真题.txt:849` 中数联卫士：**“spring boot 循环依赖”**）

#### ✅ IOC 和 AOP

> **IOC（控制反转）**：把**对象的创建权和依赖关系的管理**交给 Spring 容器，而不是在代码里 `new`。<br>**实现方式是 DI（依赖注入）**，有三种方式：<br>**① 构造器注入**（Spring 官方**推荐**）：能保证对象**创建完就是完整的**、支持 `final` 字段、便于单元测试；<br>**② Setter 注入**：适合**可选依赖**；<br>**③ 字段注入**（`@Autowired` 直接在字段上）：**最简洁但最不推荐**——因为它**隐藏了依赖关系**、**不能用于 final 字段**、**脱离 Spring 容器就没法用**（单元测试困难）。
>
> ⚠️ **说实话，我们项目里大量用的是字段注入**（`@Autowired private XxxMapper`）。这是个**技术债**——它让类**无法脱离 Spring 测试**，也**掩盖了类之间的复杂依赖**（一个类注入了 10 个字段，说明它职责太重了）。**如果重做，我会用构造器注入**，配合 Lombok 的 `@RequiredArgsConstructor`。
>
> **AOP（面向切面编程）**：在**不修改源码**的情况下，给方法**增强功能**。核心概念：<br>**① 切面（Aspect）**：横切关注点的模块化，比如日志、事务、缓存、鉴权；<br>**② 连接点（JoinPoint）**：可以被增强的点（Spring 里就是**方法**）；<br>**③ 切入点（Pointcut）**：**实际被增强的方法**（通过表达式匹配）；<br>**④ 通知（Advice）**：增强的逻辑，有 `@Before`/`@After`/`@Around`/`@AfterReturning`/`@AfterThrowing`。
>
> **底层是动态代理**（JDK / CGLIB，见 2.2）。

#### ✅ 追问：「Spring 怎么解决循环依赖？」

**`企业真题.txt:458` 联科云创高频**：

> **Spring 用「三级缓存」解决循环依赖**：<br>**① 一级缓存 `singletonObjects`**：存放**完整的单例 Bean**；<br>**② 二级缓存 `earlySingletonObjects`**：存放**提前暴露的、未完成初始化的 Bean**；<br>**③ 三级缓存 `singletonFactories`**：存放**生成早期 Bean 的工厂（`ObjectFactory`）**。
>
> **流程**（A 依赖 B，B 依赖 A）：
>
> 1. 创建 A → 实例化后，把 A 的 `ObjectFactory` **放进三级缓存**；
> 2. A 注入 B → 发现 B 没创建 → **创建 B**；
> 3. B 注入 A → 从**三级缓存拿到工厂**，生成 A 的**早期引用**，放进**二级缓存**，注入给 B；
> 4. B 创建完成 → 放进一级缓存；
> 5. A 继续完成初始化 → 放进一级缓存。
>
> **为什么要三级而不是两级？** 关键在 **AOP**。如果 A 需要**被代理**，那么 B 注入的应该是**代理对象**而不是原始对象。三级缓存的 `ObjectFactory` 就是**在这个时机调用 `getEarlyBeanReference()` 生成代理**——**如果只用两级缓存，就没法在”注入时”决定要不要生成代理**。
>
> ⚠️ **三级缓存只能解决「单例 + 字段/Setter 注入」的循环依赖**：
>
> - **构造器注入的循环依赖解决不了**（对象还没实例化，没法提前暴露）→ 抛 `BeanCurrentlyInCreationException`；
> - **`prototype` 作用域的循环依赖解决不了**；
> - **`@Async` 方法的循环依赖**有时也会报错。

#### ✅ 追问：「Spring 事务失效的场景？」

**`企业真题.txt:152,761,437` 高频**：

| 失效场景 | 原因 | 解决 |
| --- | --- | --- |
| **方法不是 `public`** | CGLIB/JDK 代理无法重写非 public 方法 | 改成 public |
| **同类内部自调用** | `this.method()` 不走代理 | 注入自己 / `AopContext.currentProxy()` |
| **对象不是 Spring Bean** | 没被代理 | 交给 Spring 管理 |
| **异常被 catch 了没抛出** | 代理感知不到异常 | 抛出去 |
| **抛的是受检异常** | 默认只回滚 `RuntimeException` 和 `Error` | `@Transactional(rollbackFor = Exception.class)` |
| **数据库引擎不支持事务** | MyISAM 不支持 | 用 InnoDB |
| **传播行为设置不当** | 比如 `NOT_SUPPORTED` | 检查 `propagation` |
| **多线程调用** | 事务是**ThreadLocal** 绑定的，子线程拿不到 | 别在子线程里做事务 |

> **项目中我踩过的**：`AlbumInfoServiceImpl.updateAlbumInfo:200-222` 这个方法**修改专辑信息 + 删除标签 + 重新插入标签**，是**多个写操作**，但**方法上忘了加 `@Transactional`**！如果中间失败，会出现”标签被删了但没插进去”的情况。<br>⚠️ 这是**事务失效里最隐蔽的一种——不是”失效”，而是”根本没加”**。<br>对比 `saveAlbumInfo:74` 是加了 `@Transactional` 的，两个方法一个有一个没有，**这种不一致在 code review 时很容易漏掉**。

---

### 12.3 MyBatis / MyBatis-Plus

**面试官原话**（`企业真题.txt:108` 软通动力：**“Mybatis 和 Mybatis-Plus 的区别，升级在哪，怎么调用 / Mybatis-Plus 原理”**；`企业真题.txt:1201` 中科软：**“mybatis 的 `${}` 和 `#{}`“**；`企业真题.txt:1229-1231` 宇信：**“Mybatis 用到的常用标签”**）

#### ✅ `#{}` 和 `${}` 的区别（必考）

> - **`#{}`**：**预编译占位符**，生成 `?`，用 **`PreparedStatement`** 的 `setXxx` 赋值。**能防 SQL 注入**，而且**预编译的 SQL 可以被数据库缓存**，性能更好。**能用 `#{}` 就一定用 `#{}`**。
> - **`${}`**：**字符串直接拼接**，有 **SQL 注入风险**。只有在**参数不是值、而是 SQL 片段**（比如动态表名、动态排序字段 `ORDER BY ${column}`）时才用。
>
> ⚠️ **项目里的真实隐患**：`TrackInfoServiceImpl.findPaidTrackInfoList:487` 和 `saveTrackInfo:82` 用了 `.last(" limit " + trackCount)`——**这是字符串拼接**！<br>虽然 `trackCount` 是 `Integer`（类型安全，注入不了字符串），**但如果哪天改成从请求参数直接取，就是注入漏洞**。<br>**✅ 更好的做法**：用 MyBatis-Plus 的分页插件（`IPage` + `Page`）或者 XML 里的 `#{}`。

#### ✅ MyBatis-Plus 原理

> MyBatis-Plus 是**在 MyBatis 之上的增强**，核心是\*\*”不用写 SQL 也能 CRUD”**：<br>**① `BaseMapper<T>`**：启动时**扫描所有 Mapper 接口\*\*，如果它继承了 `BaseMapper`，MP 就**动态注入**一批方法（`selectById`、`insert`、`updateById`…）；<br>**② SQL 的生成**：通过**反射拿到实体类的 `@TableName`/`@TableField` 注解**，推断出**表名和字段名**，再根据方法名（`selectById`）**拼接出 SQL**，最后**注入到 MyBatis 的 `MappedStatement` 里**；<br>**③ `IService`/`ServiceImpl`**：对 `BaseMapper` 的进一步封装，提供 `saveBatch()`、`lambdaQuery()` 等更便捷的方法。
>
> **常用注解**：<br>`@TableName`（表名）、`@TableId`（主键，可指定 `IdType`）、`@TableField`（字段映射，`exist=false` 表示不是数据库字段）、**`@TableLogic`（逻辑删除）**、`@Version`（乐观锁）。
>
> **自动填充**：`@TableField(fill = FieldFill.INSERT)` + 实现 **`MetaObjectHandler`**，可以自动填充 `createTime`/`updateTime`/`createUser`，不用每次手动 set。

---

### 12.4 第 12 章追问链速查

| 追问 | 答题要点 |
| --- | --- |
| 项目里哪里用了集合 | 见 12.1 的表格（必须能举例） |
| ArrayList vs LinkedList | 数组 vs 链表；查 vs 增删 |
| ArrayList 扩容 | 1.5 倍，复制数组 |
| ArrayList 线程安全方案 | synchronizedList / CopyOnWriteArrayList |
| HashMap put 流程 | hash 扰动 → 定位 → 链表/树 → 转树阈值 8 |
| 为什么容量是 2 的幂 | `(n-1)&hash` 等价取模 |
| 为什么扩容 2 倍 | 元素只可能在原位或原位+oldCap |
| 为什么用红黑树 | 旋转次数少，综合性能好 |
| 转树阈值为什么是 8 | 泊松分布概率 0.00000006 |
| ConcurrentHashMap 1.7 vs 1.8 | 分段锁 vs CAS+synchronized 锁桶 |
| HashMap key 能为 null 吗 | HashMap 能，Hashtable/CHM 不能 |
| String 为什么不可变 | final 类 + final 数组 + 无修改方法 |
| StringBuilder vs StringBuffer | 线程不安全 vs 安全 |
| IOC / DI 三种注入 | 构造器（推荐）/ Setter / 字段（我们的技术债） |
| 循环依赖三级缓存 | 为什么需要三级而不是两级（AOP 代理） |
| 事务失效场景 | 非 public/自调用/异常被吞/非运行时异常 |
| `#{}` vs `${}` | 预编译防注入 vs 字符串拼接 |
| MyBatis-Plus 原理 | 扫 Mapper + 反射读注解 + 注入 MappedStatement |

---

## 13. MySQL（项目化回答）

### 13.1 🔥 索引与 B+ 树

**面试官原话**

- `企业真题.txt:39-40` 泽宇天河：**“索引常见原则 / mysql 为什么遵循最左前缀原则”**
- `企业真题.txt:575` 快手外包：**“b+树为什么要以数据作为叶子节点，把数据存放在非叶子节点怎么样？有什么缺点？”** ← 很好的题
- `企业真题.txt:712-713` 美团驻场：**“b+树的详细介绍 / 索引查 b+树的过程”**
- `企业真题.txt:674` 南京华为外包：**“B 树和 B+树的区别”**
- `企业真题.txt:1404` 探迹：**“innodb 的 B+树跟 B 树的结构差异和优势？”**

#### ✅ B+ 树 vs B 树（要答到”为什么”）

|  | B 树 | B+ 树 |
| --- | --- | --- |
| 数据存放 | **所有节点**都存数据 | **只有叶子节点**存数据 |
| 非叶子节点 | 存**索引 + 数据** | **只存索引**（更小） |
| 叶子节点 | 相互独立 | **双向链表连接** |
| 查找 | 可能在非叶子节点就命中 | **一定到叶子节点** |

> **为什么 MySQL（InnoDB）用 B+ 树？三个关键原因**：<br>**① 非叶子节点不存数据 → 能存更多索引 → 树更矮 → IO 次数更少**<br>一个 16KB 的页，如果存”索引 + 数据”，可能只放几十条；**只存索引（bigint 8字节 + 指针 6字节）能放约 1170 个**。三层 B+ 树能存 `1170 × 1170 × 16 ≈ 2000 万` 行数据——**查 2000 万行只要 3 次 IO**。<br>**② 叶子节点用双向链表连接 → 范围查询极快**<br>`WHERE id BETWEEN 100 AND 200` 只要**定位到 100，然后顺着链表往后取**即可。B 树要**中序遍历，反复回溯父节点**，效率低。<br>**③ 查询性能稳定**<br>B+ 树**每次都要走到叶子节点**，IO 次数固定；B 树可能在非叶子节点就命中（快），也可能走到叶子（慢），**性能不稳定**。
>
> **“把数据放非叶子节点会怎样？”**（快手原题）→ **扇出变小、树变高、IO 变多**，而且**范围查询要靠中序遍历回溯**，性能差。

#### ✅ 追问：「最左前缀原则？」

> **联合索引 `(a, b, c)` 的排序规则是：先按 a 排，a 相同再按 b 排，b 相同再按 c 排**。<br>所以：
>
> - `WHERE a = ?` ✅ 用到 a
> - `WHERE a = ? AND b = ?` ✅ 用到 a、b
> - `WHERE a = ? AND b = ? AND c = ?` ✅ 全用
> - `WHERE b = ?` ❌ **用不到**（因为 b 在全局不是有序的）
> - `WHERE a = ? AND c = ?` ⚠️ **只用到 a**（b 断了，c 无法用索引定位）
>
> **⚠️ 但注意几个”能用上”的例外**：
>
> - `WHERE a = ? AND b > ? AND c = ?`：**c 用不上**（范围查询后面的列失效），但 **a、b 用上了**；
> - `WHERE a = ? ORDER BY b`：**排序也能用索引**（避免 filesort）；
> - `WHERE a = ? AND b IN (?, ?)`：**IN 后面的 c 有时还能用**（MySQL 5.7+ 会做优化）。

#### ⚠️ 项目里的真实例子

```xml
<!-- TrackInfoMapper.xml 等文件里的常见查询 -->
```

我们项目里专辑列表查询 `albumInfoMapper.selectUserAlbumPage` 用了 `user_id` 条件 + `order by id desc`。<br>**优化点**：如果建立**联合索引 `(user_id, id)`**，那么”按 userId 过滤 + 按 id 排序”就能**完全走索引**，避免 `filesort`。

---

### 13.2 🔥 SQL 优化与索引失效

**面试官原话**

- `企业真题.txt:821` 海港城科技：**“select from 一张表 where a or b，a b 两个字段都建立了单独的索引，这种情况下它可以走索引吗？”**
- `企业真题.txt:1233` 宇信科技：**“什么时候会导致索引失效？总共 10 种”**
- `企业真题.txt:1429-1433` 美团外包：给定联合索引 `(a,b,c)`，判断三种 SQL 是否走索引
- `企业真题.txt:1053` 上海宸汐：**“sql 查询 a and b and c 条件 c and b and a 会不会走索引”**
- `企业真题.txt:464` 联科云创：**“知道什么叫回表查询么？怎么避免？”**
- `企业真题.txt:1076` 上海科续：**“MySQL 里的索引覆盖”**

#### ✅ 索引失效的 10 种情况

1. **违反最左前缀**：`(a,b,c)` 索引，`WHERE b = ?` 用不上；
2. **在索引列上做运算/函数**：`WHERE YEAR(create_time) = 2025` ❌ → 改成 `WHERE create_time >= '2025-01-01' AND create_time < '2026-01-01'` ✅；
3. **隐式类型转换**：`WHERE phone = 13800138000`（phone 是 varchar）→ MySQL 会把**字符串转成数字**，相当于对列做了函数 → 失效。**必须 `WHERE phone = '13800138000'`**；
4. **`LIKE` 以 `%` 开头**：`LIKE '%关键词'` ❌；`LIKE '关键词%'` ✅；
5. **`OR` 连接的条件有一侧没索引** → 整体失效；
6. **`!=` / `<>` / `NOT IN` / `NOT EXISTS`** → 可能失效（优化器认为全表扫描更快）；
7. **`IS NULL` / `IS NOT NULL`** → 可能失效；
8. **范围查询右边的列失效**：`WHERE a = ? AND b > ? AND c = ?` → c 用不上；
9. **`ORDER BY` 与索引顺序不一致**（或不满足最左前缀）→ filesort；
10. **数据量小 / 区分度低**：优化器认为**全表扫描更快**就不走索引（比如 `status` 只有 0/1 两个值）。

#### ✅ 回答「`WHERE a OR b`，a、b 都有索引，走索引吗？」

**海港城原题**：

> **有可能走，用的是”索引合并”（Index Merge）**。<br>MySQL 5.x 之后有个优化：**把 `OR` 拆成两个查询，分别用 a 索引和 b 索引查，然后取并集**（`Using union(a, b)`）。<br>**但要注意**：<br>**① 索引合并的效率通常不如”一个联合索引”**——因为它要**扫描两个索引 + 求并集 + 回表**，成本可能比全表扫描还高，**优化器可能放弃**；<br>**② 如果只有一侧有索引**，那基本就是**全表扫描**；<br>**③ 最好的优化是建立联合索引 `(a, b)`**，或者用 `UNION ALL` 改写。
>
> **验证方法**：`EXPLAIN` 看 `type` 和 `Extra`，如果出现 **`Using union(...)`** 就是索引合并。

#### ✅ 回答「`WHERE a=? AND b=? AND c=?`（a,b,c 联合索引）三种情况」

**美团原题**，逐条分析：

```sql
-- ① 联合索引 (a,b,c)
select * from tab where a=? and b=? and c=?     -- ✅ 三个都用上
select * from tab where a=? and c=? and b>?     -- ⚠️ a 用上，c 用不上（b 是范围，后面断掉）
select * from tab where a=? order by b          -- ✅ a 用于过滤，b 用于排序
```

> **关键点**：
>
> - **`where` 条件的顺序不影响**（优化器会自动调整成索引顺序）——所以 `c and b and a` 和 `a and b and c` **效果一样**（回答上海宸汐那题）；
> - **但”等值”和”范围”的顺序很关键**——**范围查询后面的列用不上索引**；
> - **`ORDER BY` 想用索引**，需要满足”**排序字段是索引的前缀，且前面的列都是等值查询**“。

#### ✅ 回表与覆盖索引

> **回表**：InnoDB 的**二级索引（辅助索引）叶子节点存的是”索引列 + 主键值”**，不是完整行数据。所以用二级索引查 `select *` 时：<br>**① 先在二级索引找到主键值 → ② 再拿主键去聚簇索引（主键索引）找完整行**，**这第二次查找就是”回表”**。<br>**回表是随机 IO，代价高**。
>
> **避免回表的办法就是「覆盖索引」**：**查询的列全部在索引里**，就不用回表。<br>比如 `(user_id, album_title)` 索引，查询 `SELECT user_id, album_title FROM album WHERE user_id = ?` —— **`Extra` 会显示 `Using index`**，说明用了覆盖索引。
>
> ⚠️ **注意**：`SELECT *` **几乎一定会回表**（因为 `*` 通常包含索引里没有的列）。**所以”不要用 `SELECT *`“不只是规范问题，更是性能问题**。
>
> 💡 我们项目里 `AlbumInfoServiceImpl.findUserAllAlbumList:232-238` 就做了这个优化：
>
> ```java
> wrapper.select(AlbumInfo::getId, AlbumInfo::getAlbumTitle);   // 只查需要的字段
> ```
>
> 这样就**有可能命中覆盖索引，避免回表**。

#### ✅ 追问：「怎么定位慢 SQL？」

**`企业真题.txt:463,515,696,1310` 高频**：

> **① 开启慢查询日志**：
>
> ```sql
> SET GLOBAL slow_query_log = ON;
> SET GLOBAL long_query_time = 2;              -- 超过 2 秒记录
> SET GLOBAL log_queries_not_using_indexes = ON;
> ```
>
> **② 找到慢 SQL**：分析慢日志，或者用 `mysqldumpslow` / `pt-query-digest` 工具**按耗时排序**；<br>**③ 分析执行计划**：`EXPLAIN` 或 `EXPLAIN ANALYZE`（8.0 能看真实耗时）；<br>**④ 优化**：加索引 / 改写 SQL / 加缓存 / 分页优化。

#### ✅ 追问：「`EXPLAIN` 重点看哪些字段？」

**`企业真题.txt:73,283,324,1071-1073,1192,1372,1522` 超高频**：

| 字段 | 重点 | 好的值 |
| --- | --- | --- |
| **`type`** ⭐ | **访问类型**，最重要 | `const` > `eq_ref` > `ref` > `range` > `index` > **`ALL`（全表扫描，最差）** |
| **`key`** ⭐ | **实际用到的索引** | 不为 NULL；NULL 说明没走索引 |
| **`possible_keys`** | 可能用到的索引 | 对比 `key` 看为什么没选 |
| **`key_len`** | **用了索引的多少字节** | 判断**联合索引用到了几列**（比如 `(a,b,c)` 都是 int，key\_len=4 说明只用了 a，8 说明用了 a、b） |
| **`rows`** | **预估扫描行数** | 越小越好 |
| **`filtered`** | 过滤后剩余百分比 | 越大越好 |
| **`Extra`** ⭐ | 额外信息 | `Using index`（**覆盖索引，好**）、`Using where`、**`Using filesort`（排序没走索引，要优化）**、**`Using temporary`（用了临时表，要优化）** |

---

### 13.3 事务与 MVCC

**面试官原话**（`企业真题.txt:100` 软通动力：**“事务的 ACID 以及底层原理”**；`企业真题.txt:126` 广通优云：**“MVCC”**；`企业真题.txt:732` 美团：**“mvcc 过程”**；`企业真题.txt:860` 中数联卫士：**“mysql 怎么解决幻读的”**）

#### ✅ MVCC（多版本并发控制）

> **MVCC 的本质是”读不加锁”**——普通 `SELECT` 通过**读取历史版本**来实现，不用加锁，所以**读写不阻塞**。
>
> **三个核心组件**：<br>**① 隐藏字段**：每行有 `DB_TRX_ID`（**最近修改的事务ID**）和 `DB_ROLL_PTR`（**回滚指针，指向 undo log 里的旧版本**）；<br>**② undo log（版本链）**：每次修改都把旧值写进 undo log，通过 `DB_ROLL_PTR` 串成**版本链**；<br>**③ ReadView**：事务快照读时生成，包含：
>
> - `m_ids`：**当前活跃（未提交）的事务ID列表**；
> - `min_trx_id` / `max_trx_id`：活跃事务的最小/最大 ID；
> - `creator_trx_id`：创建这个 ReadView 的事务 ID。
>
> **可见性判断**（核心）：拿到行的 `DB_TRX_ID`，和 ReadView 比较：
>
> - `trx_id < min_trx_id` → 事务**已提交**，**可见**；
> - `trx_id >= max_trx_id` → 事务**在 ReadView 之后才开启**，**不可见**；
> - `trx_id` 在 `m_ids` 里 → **还活跃（未提交）**，**不可见**；
> - 不可见就**顺着版本链找上一个版本**，直到找到可见的。
>
> **RC（读已提交）vs RR（可重复读）的区别就在 ReadView 的生成时机**：
>
> - **RC**：**每次 `SELECT` 都生成新的 ReadView** → 所以能读到别人**刚提交**的数据（不可重复读）；
> - **RR**：**只在第一次 `SELECT` 时生成，之后复用** → 所以**整个事务看到的是同一个快照**（可重复读）。
>
> **RR 怎么解决幻读？**<br>**① 快照读**（普通 `SELECT`）：靠 **MVCC** 解决；<br>**② 当前读**（`SELECT ... FOR UPDATE` / `UPDATE` / `DELETE`）：靠 **Next-Key Lock（临键锁 = 记录锁 + 间隙锁）** 解决——**锁住记录和记录之间的间隙**，阻止其他事务插入。

---

### 13.4 第 13 章追问链速查

| 追问 | 答题要点 |
| --- | --- |
| B+ 树 vs B 树 | 数据只在叶子 + 叶子链表 |
| 为什么用 B+ 树 | 扇出大、树矮、范围查询快、性能稳定 |
| 三层 B+ 树存多少 | 约 2000 万行 |
| 最左前缀 | 联合索引按定义顺序排序 |
| `where c and b and a` 走索引吗 | 走，where 顺序不影响 |
| 索引失效 10 种 | 见 13.2 |
| `a or b` 各有索引 | 索引合并，但常不如联合索引 |
| 回表 / 覆盖索引 | 二级索引拿主键再查聚簇索引；覆盖索引避免 |
| 为什么不用 `SELECT *` | 几乎必然回表 |
| 慢 SQL 定位 | 慢日志 → explain → 优化 |
| explain 看什么 | type、key、key\_len、rows、Extra |
| `key_len` 怎么用 | 判断联合索引命中几列 |
| MVCC 组件 | 隐藏字段 + undo log 版本链 + ReadView |
| RC vs RR | ReadView 生成时机不同 |
| RR 怎么防幻读 | 快照读靠 MVCC，当前读靠临键锁 |

---

## 14. JVM / GC / OOM

### 14.1 内存结构与 GC

**面试官原话**（`企业真题.txt:122` 广通优云：**“JVM 内存结构”**；`企业真题.txt:729` 美团：**“根据什么查哪些是垃圾对象”**；`企业真题.txt:52` 泽宇天河：**“G1 和其他的区别”**；`企业真题.txt:417` 及乐魔方：**“三色标记法是什么”**）

#### ✅ JVM 内存结构（JDK 8+）

> **线程私有**：<br>**① 程序计数器**：当前线程执行的字节码行号。**唯一不会 OOM 的区域**；<br>**② 虚拟机栈**：每个方法对应一个**栈帧**（局部变量表、操作数栈、动态链接、返回地址）。栈太深会 **`StackOverflowError`**（比如无限递归）；<br>**③ 本地方法栈**：Native 方法用。
>
> **线程共享**：<br>**④ 堆**：**对象实例**。是 GC 的主战场。分**新生代（Eden + S0 + S1）**和**老年代**（默认比例 1:2，Eden:S0:S1 = 8:1:1）。堆内存不足会 **`OutOfMemoryError: Java heap space`**；<br>**⑤ 方法区 / 元空间**：类信息、常量、静态变量。**JDK 8 把永久代换成了元空间**（**移到本地内存**，不再受 `-Xmx` 限制，由 `-XX:MaxMetaspaceSize` 控制）。

#### ✅ 怎么判断对象是垃圾？

> **① 引用计数法**（Java **没用**）：有对象引用就 +1。**缺点：解决不了循环引用**；<br>**② 可达性分析**（Java 用的）：从 **GC Roots** 出发遍历，**走不到的对象就是垃圾**。
>
> **可以作为 GC Roots 的对象**：
>
> - **虚拟机栈**中局部变量表引用的对象；
> - **方法区中静态属性**引用的对象（`static` 变量）；
> - **方法区中常量**引用的对象（`final` 常量）；
> - **本地方法栈中 JNI** 引用的对象；
> - 活跃线程、同步锁（`synchronized`）持有的对象。

#### ✅ 引用类型

> **强引用**：`new` 出来的，**只要还有引用就不回收**（宁可 OOM）；<br>**软引用**（`SoftReference`）：**内存不够时才回收**——适合做**缓存**；<br>**弱引用**（`WeakReference`）：**下一次 GC 必回收**——`ThreadLocalMap` 的 key、`WeakHashMap` 用它；<br>**虚引用**（`PhantomReference`）：**拿不到对象**，只用于**在回收时收到通知**，管理**堆外内存**（`DirectByteBuffer` 用它）。

#### ✅ GC 算法与收集器

> **算法**：
>
> - **标记-清除**：标记垃圾后清除。**缺点：内存碎片**；
> - **标记-复制**：把存活对象复制到另一半。**优点：无碎片、效率高；缺点：浪费一半空间**。用于**新生代**（因为我们把新生代分成 Eden + 2 个 Survivor，浪费的是 Survivor）；
> - **标记-整理**：标记后把存活对象**向一端移动**，再清理边界外。**无碎片但移动成本高**。用于**老年代**。
>
> **收集器（JDK 17 默认 G1）**：
>
> - **Serial / Serial Old**：单线程，Stop The World。适合客户端；
> - **ParNew**：Serial 的多线程版，配合 CMS；
> - **Parallel Scavenge / Parallel Old**：**吞吐量优先**（JDK 8 默认）；
> - **CMS**：**并发标记清除**，**低延迟优先**（初始标记 → 并发标记 → 重新标记 → 并发清除）。缺点：**内存碎片、Concurrent Mode Failure**；
> - **G1**：**把堆分成多个大小相等的 Region**，可以**预测停顿时间**（`-XX:MaxGCPauseMillis`），按”**回收收益最大**“优先回收（Garbage First）。**不要求连续空间**，适合大堆；
> - **ZGC**：JDK 11+，**停顿时间 < 10ms**（和堆大小无关），基于**染色指针 + 读屏障**。

---

### 14.2 OOM 排查

**面试官原话**（`企业真题.txt:53` 泽宇天河：**“内存溢出遇到过吗”**；`企业真题.txt:1008` 东吴软件：**“有没有遇到 OOM 问题，如何解决？”**；`企业真题.txt:1524` 国家电网：**“堆栈发生 OOM，你会从哪些方面检查，做哪些参数的调优”`；`企业真题.txt:907\` 赛福：**“CPU 使用率直接到 100%，你的排查思路”\*\*）

#### ✅ OOM 排查步骤

> **① 提前准备**：加 JVM 参数，**OOM 时自动 dump**
>
> ```text
> -XX:+HeapDumpOnOutOfMemoryError
> -XX:HeapDumpPath=/logs/heapdump.hprof
> ```
>
> **② 分析 dump 文件**：用 **MAT** 或 **JVisualVM** 打开，看 **Dominator Tree**（谁占用内存最多），找到**最大的对象和它的 GC Root 引用链**，就能定位到**哪段代码创建了这些对象**；<br>**③ 常见 OOM 原因**：
>
> - **内存泄漏**：对象该回收但回收不掉（比如 `ThreadLocal` 没 `remove`、静态集合一直 `add`、监听器没注销）；
> - **一次性加载太多数据**：`SELECT * FROM big_table`（没分页）、`list()` 查全表；
> - **缓存无上限**：本地 `Map` 做缓存但没有淘汰策略（这也呼应了 3.1 里说的”空值缓存要设短 TTL”）；
> - **线程池/连接池过大**：每个线程占 1MB 栈，创建几万个线程就 OOM。
>
> ⚠️ **我们项目里真实存在的两个 OOM 风险**：
>
> 1. **`ServiceAlbumApplication.run()` 全量加载专辑**：`albumInfoService.list()` 是一次性 `SELECT` 全表！专辑数量大了**直接把内存撑爆**。应该**分批加载**（`list(new Page<>(i, 1000))` 循环）；
> 2. **布隆过滤器用 `tryInit(100000, 0.01)`** 是写死的，如果专辑超过 10 万，不仅**误判率飙升**，如果用的是 JVM 内存版还会 OOM（好在我们用的是 Redis 版）。

#### ✅ 追问：「CPU 100% 怎么排查？」

**赛福科技 / 美亚柏科原题**：

> **① `top`**：找到 CPU 最高的**进程 PID**；<br>**② `top -Hp <pid>`**：找到该进程里 CPU 最高的**线程 TID**；<br>**③ `printf "%x\n" <tid>`**：把**十进制的 TID 转成十六进制**；<br>**④ `jstack <pid> | grep -A 20 <十六进制tid>`**：在堆栈里找到这个线程，**看它在执行什么代码**。
>
> **常见的几种情况**：
>
> - **死循环**：堆栈显示在某个方法里反复执行；
> - **频繁 GC**：`jstat -gcutil <pid> 1000` 看到 **Full GC 次数飙升、老年代一直满** → 说明有内存泄漏或者内存太小，要 dump 分析；
> - **大量线程阻塞/锁竞争**：`jstack` 能看到大量线程处于 `BLOCKED`；
> - **正则回溯**：`String.split()` 或复杂正则在极端输入下会**指数级回溯**，CPU 打满。

---

### 14.3 第 14 章追问链速查

| 追问 | 答题要点 |
| --- | --- |
| JVM 内存结构 | 私有：PC/栈/本地栈；共享：堆/方法区 |
| 哪个区域不会 OOM | 程序计数器 |
| 永久代 vs 元空间 | JDK8 移到本地内存 |
| 怎么判断垃圾 | 可达性分析 + GC Roots |
| 四种引用 | 强/软/弱/虚 及各自用途 |
| GC 算法 | 标记清除/复制/整理，分代收集 |
| G1 特点 | Region 划分、可预测停顿、收益优先 |
| 新生代默认比例 | 8:1:1，Eden:S0:S1 |
| OOM 排查 | HeapDumpOnOutOfMemoryError + MAT |
| CPU 100% 排查 | top → top -Hp → jstack |
| 死锁排查 | jstack 找 “Found one Java-level deadlock” |

---

## 15. 场景设计题 40 问

> 这些题**不要求有项目经验**，考的是**设计思路**。答题用「**先问清楚约束 → 给方案 → 说取舍**」的结构。

### 15.1 高并发与性能

**1. 你的业务量突然提升 100 倍 QPS，怎么办？**

> 分四步：**① 定位瓶颈**（压测找出是 CPU、DB 还是下游）→ **② 优化**（加缓存、SQL 索引、异步化）→ **③ 扩容**（服务加实例、DB 读写分离、Redis 集群）→ **④ 保护**（限流、熔断、降级）。<br>**关键是不能一上来就扩容**——先搞清楚瓶颈在哪，否则钱花了问题还在。

**2. 一个接口响应很慢，怎么排查？**

> **①** 看监控（APM/Arthas `trace`）定位是哪一段慢；<br>**②** 如果是 DB：慢查询日志 + `EXPLAIN`；<br>**③** 如果是远程调用：看下游 RT、有没有串行调用（可以改并行）；<br>**④** 如果是 GC：看 `jstat`，Full GC 频繁说明内存有问题；<br>**⑤** 如果是锁：`jstack` 看有没有大量线程 `BLOCKED`。

**3. 设计一个秒杀系统？**（`企业真题.txt:1071-1083` 八股文件里也有）

> **核心是”层层过滤，把流量挡在 DB 外面”**：<br>**① 前端**：按钮置灰、答题验证码、静态资源 CDN；<br>**② 网关**：限流（IP/用户维度）；<br>**③ 库存预热**：活动前把库存**加载到 Redis**；<br>**④ 扣库存**：**Redis + Lua 原子扣减**（判断库存 + 扣减一步完成），扣完的直接拒绝；<br>**⑤ 异步下单**：扣完库存后**发 MQ**，异步落库生成订单，前端返回”排队中”；<br>**⑥ 防超卖**：DB 层最后兜底 `UPDATE stock SET num = num - 1 WHERE id = ? AND num > 0`。

**4. 怎么防止超卖？**（`企业真题.txt:1450,1566,1178`）

> **三层**：**① Redis 预扣**（Lua 原子）；**② MQ 异步下单**（削峰）；**③ DB 兜底**（`WHERE stock >= n` 条件更新 + 唯一索引防重复下单）。**单靠任何一层都不够**。

**5. 3000 万行的大表怎么优化？**（`企业真题.txt:396` 神州信息）

> **① 索引优化**（覆盖索引、联合索引）；<br>**② 分区表**（按时间分区，查询能命中分区）；<br>**③ 冷热分离**（历史数据归档到历史表/ES）；<br>**④ 分库分表**（如果单表确实太大）；<br>**⑤ 读写分离**（读走从库）；<br>**⑥ 查询优化**（避免深分页，用 `WHERE id > lastId LIMIT n`）。

**6. 深分页 `LIMIT 1000000, 10` 很慢，怎么优化？**

> **原因**：MySQL 要**扫描前 100 万行然后丢弃**。<br>**① 游标法（推荐）**：`WHERE id > 上次最大id ORDER BY id LIMIT 10`——**用上一页的最后一条做条件**，走索引；<br>**② 延迟关联**：`SELECT * FROM t JOIN (SELECT id FROM t LIMIT 1000000, 10) x USING(id)`——**先在索引里翻页拿到 id，再回表**，减少回表量；<br>**③ 产品限制**：只允许翻前 N 页。

**7. 100 万条数据怎么导出？**（`企业真题.txt:1062`）

> **不能用一次性查询**（内存爆炸）。方案：**① 分页/游标批量查**，边查边写；**② 流式查询**（MyBatis 的 `Cursor` / JDBC 的 `fetchSize`）；**③ 用数据库自带的导出工具**（`mysqldump`、`SELECT INTO OUTFILE`）。

---

### 15.2 一致性

**8. 缓存和数据库怎么保证一致性？**

> 见 3.1：**先更新 DB、再删除缓存 + 延迟双删**。讲清”为什么是删除不是更新”、”为什么先 DB 后缓存”。

**9. ES 和 MySQL 怎么保证一致性？**

> 见 6.1：**MQ 异步双写 + 定时全量重建**，接受**最终一致**。

**10. 支付成功了但权益没发放，怎么办？**（京东原题，见 4.5）

> **分布式事务（Seata AT / TCC / 本地消息表）+ 定时对账补偿**。

**11. 分布式事务有几种方案？**

> **① 2PC/XA**：强一致，但**同步阻塞、性能差**、协调者单点；<br>**② TCC**：Try-Confirm-Cancel，**业务侵入大**，但**性能好、可精确控制**，适合资金；<br>**③ Saga**：长事务拆成多个本地事务 + 补偿，**最终一致**，适合长流程；<br>**④ 本地消息表 / 最大努力通知**：**最终一致，实现简单**，最常用；<br>**⑤ Seata AT**：**对业务零侵入**（靠 undo\_log 自动回滚），但有**全局锁**，性能有损耗。

**12. 怎么设计对账系统？**

> **① 定时拉取**渠道账单（微信/支付宝）；<br>**② 与本地流水逐笔比对**，按”订单号”匹配；<br>**③ 分类处理**：**长款**（渠道有、本地无）、**短款**（本地有、渠道无）、**金额不符**；<br>**④ 自动补偿 + 人工介入**：能自动修的自动修，不能的告警给人。

---

### 15.3 幂等与并发

**13. 怎么保证接口幂等？**

> **① 唯一索引**（DB 兜底）；**② 幂等 token**（Redis + Lua）；**③ 状态机**（`WHERE status = 旧状态`）；**④ 分布式锁**（串行化）。**生产上通常组合使用**。

**14. 十个人同时点赞，怎么处理？**（致远互联原题）

> 见 9.2：**`UPDATE ... SET num = num + 1`** 原子更新，或者 Redis `INCR` + 定时刷库。**绝不能先查再算再更新**。

**15. 怎么防止重复下单？**

> 见 4.2：**Redis 一次性 token + Lua**，配合**前端置灰**和**DB 唯一索引**三层防御。

**16. 分布式锁有哪些实现方式？**

> **① Redis**（SETNX + Lua / Redisson，**性能好**，主从切换有丢锁风险）；<br>**② ZooKeeper**（**临时顺序节点 + Watch**，**可靠性高**，但性能不如 Redis）；<br>**③ 数据库**（唯一索引 / `SELECT FOR UPDATE`，**最简单但性能差**）。<br>**选择**：性能优先用 Redis，强一致优先用 ZK。

**17. 十个请求抢一把分布式锁，九个在干嘛？**

> 取决于调用方式：
>
> - `tryLock(waitTime, ...)`：在**等待**，超时后返回 false；
> - `lock()`：**一直阻塞**；
> - **Redisson 还支持”发布订阅”**——没抢到的线程**订阅锁释放的消息**，锁释放时被唤醒，**避免无脑自旋**（这是 Redisson 比手写 SETNX 高效的地方）。

---

### 15.4 架构设计

**18. 设计一个订单号生成服务？**

> **要求：全局唯一、趋势递增、可读、高性能**。<br>**方案**：<br>**① 雪花算法**（`时间戳 + 机器ID + 序列号`）——**最推荐**，本地生成、无网络开销、趋势递增；<br>**② 号段模式**（美团 Leaf）——从 DB 批量取号段缓存在内存；<br>**③ Redis INCR**——简单，但依赖 Redis；<br>**④ 业务前缀 + 日期 + 随机数**——可读性好。<br>**注意**：**雪花算法的时钟回拨问题**要处理（等待或抛异常）。

**19. 设计一个购物车？**（`企业真题.txt:1069,1159`）

> **Redis Hash**：`key = cart:{userId}`，`field = skuId`，`value = 商品信息（数量、价格、选中状态）`。<br>**为什么用 Hash？** ① **可以单独更新某个商品的数量**（`HSET`），不用整体覆盖；② **`HGETALL` 一次拿全部**；③ 可以给整个 key 设 TTL（**购物车数据可以过期**）。<br>**未登录用户**：用**临时 key（基于设备ID/临时token）**，登录时**合并**到用户购物车。

**20. 设计一个朋友圈点赞？**（`企业真题.txt:1087`）

> **① 点赞关系**：用 **Set**（`like:{postId}`，member = userId）——**天然去重**，`SISMEMBER` 判断是否点过；<br>**② 点赞数**：用 **`SCARD`** 直接算（不用单独维护计数器）；<br>**③ 点赞列表按时间排序**：用 **ZSet**，score = 时间戳。

**21. 设计统一登录鉴权（SSO）？**（`企业真题.txt:215,238-247` 上海魁鲸/天津行至简）

> **① 用户访问 A 系统** → 没登录 → 跳转**统一认证中心**；<br>**② 认证中心登录成功** → 生成 **全局 token（Ticket）** → **重定向回 A 并带上 ticket**；<br>**③ A 系统拿 ticket 去认证中心校验** → 通过后**建立自己的局部会话**（写自己的 Cookie/token）；<br>**④ 访问 B 系统**时，B 也跳认证中心，但**认证中心已有会话** → **直接发新 ticket** → 用户**无感知登录**。<br>**关键技术**：**全局会话**（存 Redis）+ **局部会话** + **ticket 一次性**。

**22. 怎么设计一个接口给别的公司调用？**（八股文件 8.9）

> **安全是核心**：**① 分配 appId + appSecret**；**② 签名**（参数按字典序拼接 + secret + 时间戳，用 HMAC-SHA256）；**③ 时间戳防重放**；**④ 限流**（按 appId 配额）；**⑤ 白名单 IP**；**⑥ HTTPS**；**⑦ 审计日志**。

---

### 15.5 线上问题排查

**23. 线上接口报错，怎么定位？**（`企业真题.txt:58,907`）

> **① 看日志**（`grep` 错误关键字 / ELK 按 traceId 搜）；**② 看监控**（QPS、RT、错误率、CPU、内存）；**③ 复现**（用 traceId 找到完整链路）；**④ 定位**（Arthas `watch`/`trace` 看入参出参和耗时）。

**24. 服务挂了怎么发现？**

> **① 健康检查**（K8s 的 liveness/readiness、Nacos 的心跳）；**② 监控告警**（Prometheus + Grafana 监控接口成功率）；**③ 日志告警**（ELK 里错误日志突增触发告警）。

**25. 怎么查看 Linux 端口占用？**（恒天瑞讯原题）

> `netstat -tunlp | grep 8080` 或 **`lsof -i:8080`** 或 `ss -tunlp | grep 8080`。<br>**查进程**：`ps -ef | grep java`；**杀进程**：`kill -9 <pid>`。

**26. 怎么抓取错误日志？**（`企业真题.txt:1039,1045`）

> **① 实时看**：`tail -f app.log`；<br>**② 按关键字搜**：`grep -n "Exception" app.log`，或者 **`grep -C 10`（显示上下文）**；<br>**③ 按时间**：`sed -n '/2025-08-20 10:00/,/2025-08-20 11:00/p' app.log`；<br>**④ 统计**：`grep "ERROR" app.log | wc -l`；<br>**⑤ 大文件**：`less` 而不是 `cat`（避免刷屏 + 内存）。

---

### 15.6 算法与手写题（`企业真题.txt` 高频）

| 题目 | 出处 |
| --- | --- |
| 快排 / 冒泡 | `企业真题.txt:31-32,122,376,578,1473` |
| 链表反转 | `企业真题.txt:577,1099` |
| 二分查找 | `企业真题.txt:736,1517` |
| 两数之和 | `企业真题.txt:1400` 探迹 |
| 斐波那契 | `企业真题.txt:1099` |
| 单例（DCL + volatile） | `企业真题.txt:735,1418,1459` |
| 策略模式实现折扣 | `企业真题.txt:1417` 高伟达笔试 |
| 转账（事务） | `企业真题.txt:1419` 高伟达笔试 |
| 求共同营业时间区间 | `企业真题.txt:1434` 美团 |
| stream 求二维数组每行最大值 | `企业真题.txt:737` 美团 |
| stream 按年龄分组统计性别 | `企业真题.txt:1528` 中移 |

**手写策略模式（高伟达笔试原题）**：

```java
// ① 策略接口
public interface DiscountStrategy {
    BigDecimal calculate(BigDecimal amount);
}

// ② 三种实现
@Component("A")
public class DiscountA implements DiscountStrategy {
    @Override
    public BigDecimal calculate(BigDecimal amount) {
        return amount.multiply(new BigDecimal("0.9"));   // 9折
    }
}

@Component("B")
public class DiscountB implements DiscountStrategy {
    @Override
    public BigDecimal calculate(BigDecimal amount) {
        return amount.subtract(new BigDecimal("10"));    // 减10元
    }
}

// ③ 工厂：Map 注入
@Component
public class DiscountFactory {
    @Autowired
    private Map<String, DiscountStrategy> strategyMap;

    public DiscountStrategy get(String type) {
        DiscountStrategy strategy = strategyMap.get(type);
        if (strategy == null) {
            throw new IllegalArgumentException("不支持的折扣类型: " + type);
        }
        return strategy;
    }
}

// ④ 使用
BigDecimal finalAmount = discountFactory.get(type).calculate(amount);
```

**手写转账（事务）**：

```java
@Transactional(rollbackFor = Exception.class)     // ⚠️ 必须指定 rollbackFor
public void transfer(Long fromId, Long toId, BigDecimal amount) {
    // 扣款：带余额校验，防止超扣
    int deduct = accountMapper.deduct(fromId, amount);
    if (deduct == 0) {
        throw new BizException("余额不足");
    }
    // 入账
    accountMapper.add(toId, amount);
    // 记流水
    detailMapper.insert(...);
}
```

```xml
<!-- deduct 的 SQL：原子扣减 -->
UPDATE account SET balance = balance - #{amount}
WHERE id = #{fromId} AND balance >= #{amount}
```

---

## 16. 非技术题话术

> 这类题在 `企业真题.txt` 里占了近三分之一，**答砸了照样挂**。

### 16.1 「为什么从上家公司离职？」（出现 15+ 次）

**这是必问题**。**原则：只说客观、积极、向前看的理由，绝不抱怨前公司/领导/同事。**

**❌ 千万别说的话**：

- “公司太坑了/领导不行/同事不好相处”
- “钱太少”
- “项目太low/没技术含量”
- “加班太多我受不了”

**✅ 推荐话术**：

> **版本一（求发展）**：<br>“我在上一家公司做了 X 年，从 0 到 1 参与了听书项目的开发，负责了登录、订单、搜索几个核心模块，技术上有不少成长。但**随着项目进入维护期，新技术的实践机会变少了**。我希望找一个**技术挑战更大、能深入微服务和高并发场景**的平台，所以选择出来看看。”
>
> **版本二（技术方向）**：<br>“上一家公司业务比较稳定，我主要负责的是**业务功能迭代**。我个人的兴趣更偏向**架构和性能优化**，想找一个**能让我参与架构设计、有更大流量场景**的团队，这样成长更快。”
>
> **版本三（客观原因，比如外派/项目结束）**：<br>“我上一份是**外包驻场**性质，项目结束后需要换项目组。我更希望找一个**自研产品、能长期深入**的公司，把一件事做深做透。”

⚠️ **如果被追问”那你怎么保证不是钱的问题”**：不要慌，正面回答：

> “薪资当然是考虑因素之一，但**不是我离职的主要原因**。我更看重的是**技术成长空间和团队的技术氛围**。如果只是薪资问题，其实可以通过内部调薪解决。”

---

### 16.2 「项目上线了吗？」（出现 5+ 次，且被反复追问）

**面试官原话**（`企业真题.txt:1321` 弋云科技：**“项目上线了吗？项目上线了吗？项目上线了吗？”**）

⚠️ **你的原回答是减分项**（`项目面试题.txt:38-39`）：

> “我离开公司的时候项目已经处于测试阶段了，至于有没有上线，我离职后没有关注，不是很清楚”

**问题在哪**：这话听着像\*\*”我没参与上线”、”我不关心结果”、”我在掩饰”\*\*。

**✅ 改进话术**：

> **如果确实没上线**：<br>“项目在我离职时**还没正式上线**，当时完成了开发、自测和**灰度环境的全流程验证**。我走之前把**部署文档、接口文档、交接文档**都整理好了，也跟接手同事做了两周的交接。<br>说实话没走完上线流程是我的一个遗憾，所以我现在特别希望能加入一个**能参与完整生命周期**的团队。”
>
> **如果上线了但你没参与**：<br>“我参与了开发和灰度发布，**正式全量上线是在我交接之后**。我在职期间主要保证了**功能的完整性和接口的质量**——我负责的订单模块上线前跑了完整的**回归测试和压测**。”
>
> **如果上线了（最好）**：<br>“上线了。我负责的订单模块**日均订单量大概 X 千**，QPS 峰值 Y 左右。上线后遇到过 Z 问题（**讲一个真实的技术坑**），我通过 A 手段定位并解决了。”

💡 **关键**：**不要说”不清楚”**。要么说你做到哪一步，要么讲你为上线做了什么准备。**永远给自己一个积极的、有信息量的说法。**

---

### 16.3 Git 相关问题

**面试官原话**（`企业真题.txt:270-271` 创安科宇：**“Git 如何做到版本控制的？多长时间提交一次 Git”**；`企业真题.txt:468` 联科云创：**“用的 git 吗？怎么解决版本冲突的”**；`企业真题.txt:882` 长亮科技：**“开发中代码冲突怎么解决”**）

> **Git 原理**：Git 是**分布式版本控制**，每次 `commit` 会**对文件内容做 SHA-1 哈希**，形成**不可变的快照**，通过**指针（branch/tag）**指向某个 commit，形成**有向无环图（DAG）**。
>
> **分支模型**：我们用 **Git Flow 简化版**：
>
> - `master`：生产分支，**只接受 release 合并**；
> - `develop`：开发主干；
> - `feature/xxx`：功能分支，**一个需求一个分支**；
> - `hotfix/xxx`：紧急修复分支。
>
> **提交规范**：`feat: 新增专辑缓存` / `fix: 修复订单重复提交`（**Conventional Commits**），**小步提交**——一个功能拆成几次提交，**方便回溯和 review**。
>
> **冲突解决**：
>
> 1. `git pull --rebase`（**拉最新代码并 rebase**，保持提交历史线性）；
> 2. 冲突时 Git 会在文件里标记 `<<<<<<< HEAD` / `=======` / `>>>>>>>`；
> 3. **手动解决**（和同事沟通，确认保留谁的逻辑）；
> 4. `git add` + `git rebase --continue`。
>
> **关键心得**：**冲突要早发现、早解决**——每天至少 `pull` 一次，**不要攒一个星期的代码才合并**。而且**合并前先跑一遍测试**。

---

### 16.4 部署相关

**面试官原话**（`企业真题.txt:113,805,1270,1395`；`企业真题.txt:429-430` 及乐魔方：**“你们用的是 Dockerfile 还是 DockerCompose？写 Jar 包时打包成 dockerfile，dockerfile 是怎么编写的”**；`企业真题.txt:536` 航天曌朗：**“docker 进入容器内部的命令 / 是否用过挂载数据卷”**）

> **我们的部署流程**：<br>**① 打包**：`mvn clean package`，每个服务产出 `xxx.jar`（我们在父 pom 里配了 `<finalName>${project.artifactId}</finalName>`，所以名字干净）；<br>**② 构建镜像**：写 `Dockerfile`：
>
> ```dockerfile
> FROM openjdk:17-jdk-slim
> WORKDIR /app
> COPY target/service-order.jar app.jar
> EXPOSE 8006
> ENTRYPOINT ["java", "-jar", "-Xms512m", "-Xmx1024m", \
>             "-XX:+HeapDumpOnOutOfMemoryError", "app.jar"]
> ```
>
> **③ 推送镜像**到 Harbor / 阿里云 ACR；<br>**④ 部署**：`docker run -d --name xxx -p 8006:8006 -v /logs:/app/logs xxx:1.0`。<br>⚠️ **没有用 K8s**——我们服务不多，**Docker + shell 脚本**就够了；K8s 我了解概念（Pod/Deployment/Service/Ingress），但项目里没用过。

> **Docker 常用命令**（`企业真题.txt:21,255-256,328,1511`）：
>
> ```bash
> docker ps -a                    # 查看所有容器
> docker logs -f <容器>            # 查看日志（排查必备）
> docker logs --tail 100 <容器>    # 看最后100行
> docker exec -it <容器> /bin/bash # 进入容器内部
> docker cp <容器>:/app/x.log .    # 容器文件拷出来
> docker images / docker rmi       # 镜像
> docker build -t name:tag .       # 构建
> docker run -d -p 8080:8080 -v /host:/container name   # 启动+端口映射+数据卷
> ```
>
> **数据卷（-v）的作用**：把**容器内的目录挂载到宿主机**，这样**容器删了数据还在**（比如日志、上传的文件）。

---

### 16.5 前端问题（高频但你可以诚实说不会）

**面试官原话**（`企业真题.txt:22,106,163-173,201,228,310,1362`——**“写过前端吗/会写前端吗/前端了解多少”出现了至少 8 次**）

**✅ 诚实但有信息量的答法**：

> “**独立开发前端不是我的强项**，但我不影响协作：<br>**①** 我能**看懂 Vue 代码**，能定位简单问题、调样式；<br>**②** 接口设计上我会**主动对齐前端**——我们用的是 Knife4j（Swagger），接口文档自动生成，前端能直接在页面上测；<br>**③** 我了解**前后端分离的基本约定**：跨域、token 放 header、RESTful 风格、统一返回结构（我们的 `Result` 类）。
>
> 另外我想说明：**Vue 的响应式原理、`v-if` 和 `v-show` 的区别**这些我了解——`v-if` 是**销毁/重建 DOM**（有切换开销），`v-show` 是**切换 `display`**（初始渲染开销大）。所以**频繁切换用 `v-show`，条件很少变用 `v-if`**。”

⚠️ **如果面试官明确要全栈**（如 `企业真题.txt:163` 维思陆、`:315` 软通）：

> 坦率说明自己的定位是**后端**，但如果岗位需要，可以快速上手。

---

### 16.6 「我们的项目挺简单的，为什么做了一年？」（中科软原题）

**面试官原话**（`企业真题.txt:636-638`）

> 1. 这个项目挺简单的，为什么做了一年，感觉两个月就做出来了啊？
> 2. 你做的内容感觉挺多的，其他三个后端干什么了？
> 3. 一年还没上线，客户不催吗？

⚠️ **这是压力面**，面试官在**质疑你的项目真实性**。**不要慌，也不要辩解**。

> **✅ 这样答**：<br>“我理解您的疑问，如果只看功能列表，确实像两三个月的工作量。**我复盘下来，时间主要花在这几块**：<br>**① 微服务拆分和基建**：10 个服务的**数据库拆分、Nacos 配置、Seata 接入、Feign 契约定义**，光是把服务间调用的链路跑通就花了不少时间；<br>**② 中间件接入和踩坑**：比如 **Seata 的 XID 要能通过 Feign 传下去**、**RabbitMQ 的 confirm/return 回调**、**ES 的索引设计和分词器选择**，每个都要调试；<br>**③ 联调和测试**：跨服务的联调，一个接口涉及 3~4 个服务，改一处要回归一片；<br>**④ 需求变更多**：前期架构评审改了几轮，比如订单支付方式从只支持微信，改成**微信 + 余额**，整个下单链路都要重构。
>
> **至于其他同事**，他们分别负责**专辑/声音管理、用户中心、支付和账户**，我负责的是**登录鉴权、专辑详情、订单、搜索**——因为订单这条链路最长，投入的精力也最多。”

💡 **关键**：**用”技术复杂度”解释”时间成本”**，而不是说”需求多”或者”我们效率低”。这显示你**理解项目的真实难度**。

---

## 17. 「我不会」诚实口径表

> **原则**：**不会就说不会，但要说”我了解它解决什么问题、大概怎么做、和我会的东西有什么关联”**。这比硬编强一百倍。<br>**绝对禁止**：明明没做过却说得像做过——**面试官一追问细节就崩**。

### 17.1 项目里没做的技术

| 技术 | 项目实际 | ✅ 推荐话术 |
| --- | --- | --- |
| **Canal** | ⛔ 没用，用的是 MQ 双写 | “项目用的是 MQ 异步双写。Canal 我了解原理——伪装从库订阅 binlog，需要 ROW 格式，好处是和业务解耦，代价是要额外维护组件且只能拿单表数据。” |
| **分库分表** | ⛔ MySQL 没做 | “MySQL 层面没做分库分表，数据量还没到那个级别。我了解 **ShardingSphere** 的方案（水平分表按 user\_id 取模、垂直分库按业务），也了解分表后的**问题**：跨库 join、分布式事务、深分页、全局 ID。**MongoDB 我们做了按 userId 分集合**，思路类似。” |
| **K8S** | ⛔ 没用 | “我们用的是 **Docker + 脚本**。K8S 我了解核心概念（Pod/Deployment/Service/Ingress/ConfigMap），它的价值是**自动扩缩容、滚动更新、服务发现**，但这些在我们这个规模用不上。” |
| **超卖** | ⛔ 听书是虚拟商品，无库存 | “**听书是虚拟商品没有库存**，所以不涉及超卖。但我在**商城项目**里做过：Redis + Lua 预扣库存 + MQ 异步下单 + DB 条件更新兜底。” |
| **退款** | ⛔ 无 | “当前版本不支持退款。如果要设计，会走**原路退回**（微信退款 API）+ **回滚权益**（删购买记录）+ **记录退款流水**，并且要**幂等**。” |
| **连续包月** | ⛔ 无 | “我们是**一次性购买 N 个月**的 VIP。连续包月需要对接**微信的签约代扣**（委托代扣），复杂度主要在**签约管理、扣款失败重试、解约**。” |
| **分布式 ID 服务** | 用了 UUID/雪花，无独立服务 | “我们订单号用 UUID，主键用 MyBatis-Plus 的雪花算法。**独立的 ID 服务**我了解**美团 Leaf**（号段模式 + 雪花），好处是解耦和统一管理。” |
| **Sentinel** | 有 client 但基本没用 | “我们主要用 Feign 的 fallback 做降级。Sentinel 我了解它的**流控、熔断、热点参数限流、系统自适应保护**四种规则。” |
| **LangChain4j / AI** | ⛔ 听书项目没有 | ⚠️ **别往听书项目上扯**。如果简历上有 AI 项目，就单独讲那个项目。 |
| **若依(RuoYi)** | ⛔ 没用 | “我们用的是自研脚手架。若依我了解，它是**基于 Spring Boot + Vue 的快速开发平台**，自带权限管理、代码生成器。” |

### 17.2 需要”了解但没用过”的知识

| 话题 | ✅ 话术模板 |
| --- | --- |
| **Oracle / 国产数据库** | “主要用 MySQL。Oracle 我了解**和 MySQL 的主要差异**：分页语法（`ROWNUM` vs `LIMIT`）、序列、plsql、执行计划查看方式。国产库（达梦/人大金仓）**大多兼容 MySQL 或 Oracle 语法**。” |
| **Python / 其他语言** | “我的主力是 Java。Python 能读懂和改简单脚本，但不是我的开发语言。” |
| **Vue / 前端** | 见 16.5。 |
| **Kafka** | “项目用的是 RabbitMQ。Kafka 我了解它**为高吞吐设计**（顺序写磁盘 + 零拷贝 + 分区），适合**日志、埋点、流处理**；但**没有延迟队列、没有死信队列**，功能上不如 RabbitMQ 灵活。” |
| **ZooKeeper** | “Nacos 我用得更多。ZK 我了解它是**CP 模型**（基于 ZAB 协议），常用作**分布式锁和选主**；Nacos 可以**同时做注册中心和配置中心**，而且支持 **AP/CP 切换**。” |
| **JVM 调优实战** | “我做过 OOM 排查和 GC 日志分析，**但没有大规模的生产调优经验**。我了解常用的调优参数和思路（见第 14 章）。” |
| **高并发实战** | “我们项目的并发量**不算高**（日均千级订单）。我做了缓存、异步编排、线程池这些优化，**但没有经历过真正的双十一级别流量**。不过设计的思路我是清楚的。” ⚠️ **如果面试官问 QPS 具体数字，别编太大的数**——编完会被追问”怎么测的”（`企业真题.txt:1456` 中品一号就问过 **“10wqps 你们是怎么测出来的”**）。 |

### 17.3 万能应对框架

当遇到**完全不会**的问题时：

> **第一步：先确认理解**<br>“您问的是 XXX 对吧？”（避免答偏）
>
> **第二步：坦诚 + 关联**<br>“这个我**没有实际做过**。不过从原理上我理解它是为了解决 XX 问题，思路大概是 YY。”
>
> **第三步：如果有关联经验，主动迁移**<br>“我在项目里做过的 **ZZ** 和它有点类似，都是解决 AA 问题，只是实现手段不同。”
>
> **第四步：表达学习意愿（简短，别过度）**<br>“如果需要，我可以很快上手——因为底层的问题模型我是清楚的。”

**示例**（被问”你们怎么用 Canal 做缓存同步的”）：

> “您问的是**缓存和数据库的同步方案**对吧？<br>我需要先说明一下：**我们项目实际用的是 MQ 异步双写，没有用 Canal**，所以这块我没有实际配置经验。<br>不过 Canal 的原理我了解——它**伪装成 MySQL 的从库**，通过订阅 **binlog** 来感知数据变更，然后投递到 MQ，消费者再去删缓存。它的优点是**和业务代码完全解耦**，缺点是**要额外维护 Canal Server、binlog 必须开 ROW 格式（日志量变大）、而且只能拿到单表数据，多表聚合还得自己写**。<br>我在项目里做过的**类似的事情**是用 **RabbitMQ 双写**——专辑保存后发消息通知搜索服务同步 ES。这块我踩过一个坑：**事务还没提交就发了消息**，导致消费者查不到数据，后来改成用 `TransactionSynchronizationManager` 在 `afterCommit` 里发。”

💡 **这个回答的威力**：既**诚实**（没做过就是没做过），又**展示了原理理解**，还**主动输出了一个真实的技术坑**——面试官的注意力会立刻被最后那段吸引过去。

---

## 附：全文速查索引

| 章节 | 内容 | 高频程度 |
| --- | --- | --- |
| 0 | 使用说明、别主动提清单、权重表 | — |
| 1 | 项目介绍（1/3/10 分钟版）、与喜马拉雅差异、上线话术 | ★★ |
| 2 | 登录、**token 前后端传递（2.1.1）**、**Cookie 认知纠错**、AOP 鉴权、token 续期、ThreadLocal 泄漏、JWT 对比 | ★★★ |
| 3 | 缓存四问题、**布隆过滤器**、**Redisson 看门狗**、自定义缓存注解 | ★★★ |
| 4 | 下单链路、**防重复提交**、验签、**支付成功权益未发（京东）**、**延迟关单** | ★★★ |
| 5 | 微信支付、**回调幂等**、充值幂等、余额自管 | ★★ |
| 6 | ES 双写、**事务与消息时序**、热度算法、DSL、深分页 | ★★ |
| 7 | **MQ 不丢失/幂等/顺序/积压** | ★★ |
| 8 | Nacos/Feign/Gateway、**网关 vs Nginx**、雪崩熔断降级 | ★★ |
| 9 | XXL-JOB、**统计量并发丢失**、Bitmap | ★★ |
| 10 | **线程池 7 参数**、**CompletableFuture**、优雅关闭 | ★★★ |
| 11 | **策略 + 工厂**（含手写）、单例、模板方法 | ★★ |
| 12 | 集合、HashMap、Spring IOC/AOP/循环依赖/事务失效、MyBatis | ★★★ |
| 13 | B+ 树、**索引失效 10 种**、**explain**、MVCC | ★★★ |
| 14 | JVM 内存、GC、**OOM 排查**、CPU 100% 排查 | ★ |
| 15 | 场景设计题 40 问 + 手写算法 | ★★ |
| 16 | 离职原因、上线、Git、Docker、前端、压力面 | ★★ |
| 17 | **诚实口径表**（不会的问题怎么答） | ★★★ |

---

> **最后三个提醒**：
>
> **① 别背全文，背”结构和数字”**。面试是对话，记住”分几点讲”比记住原话重要。
>
> **② 主动暴露一个技术坑**。每场面试**至少主动讲一个真实踩坑**（推荐：事务未提交发 MQ、ThreadLocal 未清理、延迟线程异常死亡、统计量丢失更新）。这会让面试官觉得你是**真做过**的。
>
> **③ 不会就说不会**。第 17 章的框架比硬编强一百倍——**面试官最反感的是”装懂”**。
