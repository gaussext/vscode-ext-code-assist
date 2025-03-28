import axios from "axios";

async function postRequest(url: string, data: any) {
  return axios
    .post(url, data, {
      responseType: "stream",
    })
    .catch((error) => {
      console.log(
        `Failed to axios with ${error}, for data=${JSON.stringify(data)}`
      );
    });
}


export async function submitStream(url: string, model: string, prompt: string, onText: any) {
  const data = {
    model,
    messages: [
      {
        content: prompt,
        role: "user",
      },
    ],
    stream: true,
    raw: true,
  };

  const template = {
    model: model,
    created_at: new Date().toISOString(),
    message: { role: "assistant", content: "" },
    done: false,
  };

  const response = await postRequest(url, data);
  const stream = response!.data;
  let timer: null | any = null;
  onText("start", JSON.stringify(template));
  stream.on("data", (data: any) => {
    const text = new TextDecoder().decode(data);
    if (text.trim()) {
      onText("data", text);
    }
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      onText("end", JSON.stringify(template));
    }, 1000);
  });

  stream.on("end", () => {
    if (timer) {
      clearTimeout(timer);
    }
    onText("end", JSON.stringify(template));
  });
}
