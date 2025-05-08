import { db, conversations, messages } from './index';
import { eq } from 'drizzle-orm';

// 获取时间戳函数
const getTimestamp = (daysAgo = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date; // 返回日期对象而不是时间戳
};

// 示例数据
export const sampleData = {
  conversations: [
    {
      title: "测试与实验指南",
      updatedAt: getTimestamp(0), // 今天
      messages: [
        {
          role: "assistant" as const,
          content: "你好！我是由OpenAI开发的人工智能助手，可以帮助你解答问题、提供信息、写作建议、翻译、聊天等等。你有什么需要帮助的吗？",
        },
        {
          role: "user" as const,
          content: "请介绍一下测试与实验的基本方法",
        },
        {
          role: "assistant" as const,
          content: "测试与实验的基本方法包括：\n\n1. **控制变量法**：只改变一个变量，保持其他变量不变，观察结果变化。\n\n2. **对比实验**：设置实验组和对照组，比较结果差异。\n\n3. **随机抽样**：从总体中随机选取样本，确保样本具有代表性。\n\n4. **双盲实验**：参与者和研究人员都不知道谁接受了实际处理，减少主观偏见。\n\n5. **交叉验证**：将数据分成多个子集，轮流用于训练和验证，提高模型可靠性。\n\n这些方法帮助确保实验结果的可靠性和有效性。您需要了解更具体的测试方法吗？",
        },
      ],
    },
    {
      title: "认识AI助手与功能介绍",
      updatedAt: getTimestamp(1), // 昨天
      messages: [
        {
          role: "assistant" as const,
          content: "你好！我是一个AI助手，可以回答问题、提供信息、协助写作等。有什么我可以帮助你的吗？",
        },
        {
          role: "user" as const,
          content: "请介绍一下你的主要功能",
        },
        {
          role: "assistant" as const,
          content: "作为AI助手，我的主要功能包括：\n\n1. **回答问题**：提供各种知识领域的信息和解答。\n\n2. **内容创作**：协助撰写文章、邮件、报告等各类文本。\n\n3. **语言翻译**：在不同语言之间进行翻译。\n\n4. **代码辅助**：提供编程建议和代码示例。\n\n5. **创意激发**：提供创意想法和解决方案。\n\n6. **数据分析**：帮助理解和解释数据。\n\n7. **学习辅导**：解释复杂概念和提供学习资源。\n\n您有特定的任务需要我协助完成吗？",
        },
      ],
    },
    {
      title: "Python编程基础",
      updatedAt: getTimestamp(2), // 前天
      messages: [
        {
          role: "user" as const,
          content: "Python中如何定义函数？",
        },
        {
          role: "assistant" as const,
          content: '在Python中定义函数使用`def`关键字，基本语法如下：\n\n```python\ndef 函数名(参数1, 参数2, ...):\n    # 函数体\n    # 可以包含多行代码\n    return 返回值  # 可选\n```\n\n例如，一个简单的加法函数：\n\n```python\ndef add(a, b):\n    result = a + b\n    return result\n\n# 调用函数\nsum = add(5, 3)  # sum的值为8\n```\n\nPython函数的一些特点：\n\n1. 可以设置默认参数值：`def greet(name="Guest"):`\n2. 可以使用可变参数：`def sum_all(*numbers):`\n3. 可以使用关键字参数：`def person(name, **properties):`\n4. 可以指定参数类型和返回值类型（Python 3.5+）：`def add(a: int, b: int) -> int:`\n\n需要更详细的例子吗？',
        },
      ],
    },
  ],
};

// 填充示例数据函数
export async function seedSampleData() {
  console.log('开始填充示例数据...');
  
  // 检查是否已有数据
  const existingConversations = await db.select().from(conversations);
  if (existingConversations.length > 0) {
    console.log('数据库已有数据，跳过填充');
    return;
  }
  
  try {
    // 创建对话和消息
    for (const conv of sampleData.conversations) {
      const { messages: convMessages, ...convData } = conv;
      
      // 创建对话
      const [newConv] = await db.insert(conversations).values(convData).returning();
      
      // 创建消息
      if (convMessages.length > 0) {
        await db.insert(messages).values(
          convMessages.map(msg => ({
            conversationId: newConv.id,
            ...msg
          }))
        );
      }
    }
    
    console.log('示例数据填充完成！');
  } catch (error) {
    console.error('填充示例数据失败:', error);
    throw error;
  }
} 