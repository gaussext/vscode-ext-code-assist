export enum EnumTemperature {
  CodeAndMath = 0.0,
  DataAnalysis = 1.0,
  Translation = 1.3,
  CreativeWriting = 1.5,
}

export function createTemperatures() {
  return [
    {
      value: EnumTemperature.CodeAndMath,
      label: '代码生成',
    },
    {
      value: EnumTemperature.DataAnalysis,
      label: '数据分析',
    },
    {
      value: EnumTemperature.Translation,
      label: '文本翻译',
    },
    {
      value: EnumTemperature.CreativeWriting,
      label: '文学创作',
    },
  ];
}
