
export function createResponseData(model: string, done = false) {
    return {
        model: model,
        created_at: new Date().toISOString(),
        message: { role: "assistant", content: "" },
        done,
    };
}

