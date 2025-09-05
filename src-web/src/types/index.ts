export interface IStandardItem<T> {
    value: T;
    label: string;
}

export interface IMessage {
    type: 'delta' | 'end';
    delta?: string;
    startTime?: number;
    endTime?: number;
}