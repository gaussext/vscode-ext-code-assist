标题

# 一级标题

## 二级标题

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题

## 基础格式

- **加粗**
- *斜体*
- `inline code`
- [链接](https://github.com/Simon-He95/markstream-vue)

## 数学

行内公式：$E = mc^2$

块级公式：

$$
\int_0^1 x^2 dx = \frac{1}{3}
$$


## 代码块

```ts
export function compareFramework(name: string) {
  return `${name} test page is ready.`
}
```


## Mermaid

```mermaid
flowchart LR
  Prompt --> Parser --> Renderer --> Preview
```

## XSS

button 可以渲染
<button>提交</button>

input 不应该渲染
<input type="text" placeholder="请输入">

script 不应该渲染
<script>
  alert('hello world');
</script>
