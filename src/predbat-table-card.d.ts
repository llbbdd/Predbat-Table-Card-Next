interface CustomCard {
    type: string;
    name: string;
    preview: boolean;
    description: string;
    documentationURL: string;
}
declare global {
    interface Window {
        customCards: CustomCard[];
    }
}
export {};
//# sourceMappingURL=predbat-table-card.d.ts.map