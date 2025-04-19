import axios from "axios";
import * as vscode from "vscode";

const setting = vscode.workspace.getConfiguration("code-assist");
const origin = setting.get<string>("origin") || "http://127.0.0.1:11434"; // code-assist.origin

const API_TAGS = origin + "/api/tags";
const API_CHAT = origin + "/api/chat";
const API_STOP = origin + "/api/delete";

export function tags(onText: any) {
  console.log("[INFO] tags start");
  return axios.get(API_TAGS).then((res) => {
    console.log("[INFO] tags end", res.data);
    onText("tags-end", res.data);
  });
}

export function stop(onText: any) {
  console.log("[INFO] stop start");
  return axios.get(API_STOP).then((res) => {
    console.log("[INFO] stop end", res.data);
    onText("stop-end", res.data);
  });
}

function createRequestData(model: string, prompt: string, messages: any[]) {
  return {
    model,
    messages: [
      ...messages,
      {
        role: "user",
        content: prompt,
      },
    ],
    stream: true,
    raw: true,
  };
}

function createResponseData(model: string, done = false) {
  return {
    model: model,
    created_at: new Date().toISOString(),
    message: { role: "assistant", content: "" },
    done,
  };
}

export async function chat(
  prompt: string,
  messages: any[],
  model: string,
  onText: any,
  controller: AbortController
) {

  onText("chat-pre", JSON.stringify(createResponseData(model)));
  const data = createRequestData(model, prompt, messages);
  console.log("[INFO] chat start", data);
  const response = await axios.post(API_CHAT, data, { responseType: "stream", signal: controller.signal });
  const stream = response!.data;

  let timer: null | any = null;
  const end = () => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      const text = JSON.stringify(createResponseData(model, true));
      console.log("[INFO] chat end",text);
      onText("chat-end", text);
    }, 100);
  };

  onText("chat-start", JSON.stringify(createResponseData(model)));
  stream.on("data", (data: any) => {
    const text = new TextDecoder().decode(data);
    if (text.trim()) {
      console.log("[INFO] chat data", text);
      onText("chat-data", text);
    }
    end();
  });

  stream.on("chat-end", end);
}
