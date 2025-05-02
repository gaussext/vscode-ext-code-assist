
export function createResponseData(model: string, done = false) {
    return {
        model: model,
        created_at: new Date().toISOString(),
        message: { role: "assistant", content: "" },
        done,
    };
}

export function getJsonSafe(jsonString: string, defaultValue: any = null) {
    try {
        // 尝试解析 JSON
        const result = JSON.parse(jsonString);
        return result;
    } catch (error) {
        // 否则返回默认值
        return defaultValue;
    }
}

