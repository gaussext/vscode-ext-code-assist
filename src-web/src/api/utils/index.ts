export function createRequestData(model: string, content: string, messages: any[]) {
    return {
        model,
        messages: [
            ...messages,
            {
                role: "user",
                content: content,
            },
        ],
        stream: true,
        raw: true,
    };
}

export function createResponseData(model: string, done = false) {
    return {
        model: model,
        created_at: new Date().toISOString(),
        message: { role: "assistant", content: "" },
        done,
    };
}