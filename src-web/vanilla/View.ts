import { AIModel, Message, Model } from "../Model";
import { createMarkdownInfo, Utils } from "./Utils";

declare var hljs: any;
declare var marked: any;

const footer = '<a class="link-copy copy-html">复制 HTML</a><a class="link-copy copy-markdown">复制 Markdown</a>';

export class View {
    model: Model;

    $messages = document.getElementById("messages") || document.createElement("div");
    $selectModel = document.getElementById("model-select") as HTMLSelectElement;
    $selectHistory = document.getElementById("history-select") as HTMLSelectElement;

    $buttonCreate = document.getElementById("create-button") as HTMLButtonElement;
    $buttonDelete = document.getElementById("delete-button") as HTMLButtonElement;

    $input = document.getElementById("chat-input") as HTMLInputElement;
    $buttonChat = document.getElementById("chat-button") as HTMLButtonElement;
    constructor(model: Model) {
        this.model = model;
        // 1. 获取模型列表
        model.getModels();
        // 2. 获取历史对话
        model.getConversations();
        // 3. 获取对话消息
        this.getMesasges();
        this.renderModels();
        this.renderConversations();
        this.addEventListeners();
    }

    addEventListeners() {
        window.addEventListener("message", (e) => {
            const type = e.data.type;
            if (type === "tags-end") {
                this.onModels(e);
            } else if (type === "chat-pre") {
                this.onChatRequest();
            } else if (type === "chat-start") {
                this.onChatStart();
            } else if (type === "chat-data") {
                this.onChatData(e);
            } else if (type === "chat-end") {
                this.onChatEnd();
            } else if (type === "optimization") {
                this.onOptimization(e);
            } else if (type === "explanation") {
                this.onExplanation(e);
            }
        });

        // 选择模型
        this.$selectModel.addEventListener("change", (e) => {
            this.model.state.model = (e.target as any).value as string;
        });

        // 选择对话
        this.$selectHistory.addEventListener("change", (e) => {
            this.model.updateConversationId((e.target as any).value as string);
            this.getMesasges();
        });

        // 创建新对话
        this.$buttonCreate.addEventListener("click", () => {
            this.model.createConversation();
            this.renderConversations();
            this.model.messages = [];
            this.$messages.innerHTML = "";
        });

        // 删除当前会话
        this.$buttonDelete.addEventListener("click", () => {
            this.model.deleteConversation(this.model.conversationId);
            this.renderConversations();
            this.getMesasges();
        });

        // 发送消息
        this.$buttonChat.addEventListener("click", () => {
            if (this.model.state.isLoading) {
                this.model.stop();
                this.$buttonChat.innerHTML = "发送";
                this.enableInteraction();
                return;
            }
            this.sendMessage();
        });

        // 允许按 Enter 键发送消息
        this.$input.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                this.sendMessage();
            }
        });
    }


    // 获取到模型列表
    onModels(e: MessageEvent) {
        const data = e.data.text;
        const models = (data.models || []) as AIModel[];
        models.sort((a, b) => a.name.localeCompare(b.name));
        this.model.models = models;
        this.renderModels();
    }

    // 接受消息
    async onChatRequest() {
        this.model.state.content = `...`;
        this.model.state.isLoading = true;
        this.$buttonChat.innerHTML = "停止";
        this.$messages.appendChild(await Utils.createMessageForAI(this.model.state.content, ''));
        this.disableInteraction();
    }

    onChatStart() {
        this.model.state.content = "";
        
        this.updateMessageForAI(this.model.state.content);
    }

    onChatData(e: MessageEvent) {
        const json = e.data.text;
        const data = JSON.parse(json);
        const text = data.message.content;
        if (data.created_at) {
            if (this.model.state.startTime === 0) {
                this.model.state.startTime = new Date(data.created_at).getTime();
            }
            this.model.state.endTime = new Date(data.created_at).getTime();
        }

        this.model.state.content += text;
        this.model.state.tokens++;
        if (this.model.state.tokens % 2 === 0) {
            this.updateMessageForAI(this.model.state.content);
        }
    }

    onChatEnd() {
        this.model.state.isLoading = false;
        this.$buttonChat.innerHTML = "发送";
        const { content, model, tokens, startTime, endTime } = this.model.state;
        const duration = (endTime - startTime) / 1000;
        this.model.addAIMessage(content, {
            model: model,
            tokens: tokens,
            duration: duration,
            startTime: startTime,
            endTime: endTime,
        });
        this.endMessageForAI(this.model.state.content, createMarkdownInfo(this.model.state));
        this.enableInteraction();
        hljs.highlightAll();
    }

    // 优化代码
    onOptimization(e: MessageEvent) {
        const text = e.data.text;
        if (!text) {
            return false;
        }
        this.$input.value = `优化一下这段代码\`\`\`${text}\`\`\``;
        this.$buttonChat.click();
    }

    // 解释代码
    onExplanation(e: MessageEvent) {
        const text = e.data.text;
        if (!text) {
            return false;
        }
        this.$input.value = `解释一下这段代码 \`\`\`${text}\`\`\``;
        this.$buttonChat.click();
    }

    // 渲染模型列表
    renderModels() {
        this.$selectModel.innerHTML = "";
        this.model.models.forEach((model) => {
            const $option = document.createElement("option");
            $option.value = model.name;
            $option.textContent = `${model.name}`;
            if ($option.value === this.model.state.model) {
                $option.selected = true;
            }
            this.$selectModel.appendChild($option);
        });
    }

    // 渲染会话列表
    renderConversations() {
        this.$selectHistory.innerHTML = "";
        this.model.conversations.forEach((item) => {
            const $option = document.createElement("option");
            $option.value = item.id;
            $option.textContent = `${item.title}`;
            if ($option.value === this.model.conversationId) {
                $option.selected = true;
            }
            this.$selectHistory.appendChild($option);
        });
    }

    getMesasges() {
        this.model.messages = [];
        this.$messages.innerHTML = "";
        this.model.getMessages().then(() => {
            this.updateMessages(this.model.messages);
            this.model.state.content = "";
            this.model.state.tokens = 0;
            this.model.state.startTime = 0;
            this.model.state.endTime = 0;
        });
    }

    disableInteraction() {
        this.$selectModel.disabled = true;
        this.$selectHistory.disabled = true;

        this.$buttonCreate.disabled = true;
        this.$buttonDelete.disabled = true;

        this.$input.disabled = true;
    }

    enableInteraction() {
        this.$selectModel.disabled = false;
        this.$selectHistory.disabled = false;

        this.$buttonCreate.disabled = false;
        this.$buttonDelete.disabled = false;

        this.$input.disabled = false;
    }

    getLatestMessage(): HTMLDivElement {
        const list = Array.from(document.querySelectorAll(".message-ai"));
        const $message = list[list.length - 1] as HTMLDivElement || document.createElement("div");
        return $message;
    }

    async updateMessageForAI(message: string) {
        const $message = this.getLatestMessage();
        $message.innerHTML = await marked.parse(`AI: ${message}`);
        this.$messages.scrollTo(0, this.$messages.scrollHeight);
    }

    async endMessageForAI(message: string, info: string) {
        const $message = this.getLatestMessage();
        $message.innerHTML = await marked.parse(`AI: ${message} ${info}`) + footer;
        Utils.addCopyEvent($message, message);
        this.$messages.scrollTo(0, this.$messages.scrollHeight);
        hljs.highlightAll();
    }

    sendMessage() {
        const message = this.$input.value;
        if (!message) {
            return false;
        }
        this.model.chat(this.model.state.model, message, this.model.messages);
        this.model.updateConversationTitle(message);
        this.renderConversations();

        this.$input.value = "";
        this.$messages.appendChild(Utils.createMessageForYou(message));
        hljs.highlightAll();
    }

    updateMessages(messages: Message[]) {
        messages.forEach((item) => {
            if (item.role === "user") {
                this.$messages.appendChild(Utils.createMessageForYou(item.content));
            }
            if (item.role === "assistant") {
                this.$messages.appendChild(
                    Utils.createMessageForAI(item.content, createMarkdownInfo(item.info))
                );
            }
        });
        this.$messages.scrollTo(0, this.$messages.scrollHeight);
        hljs.highlightAll();
    }
}
