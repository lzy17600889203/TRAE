export interface PresetScenario {
    id: string;
    name: string;
    description: string;
    color: string;
}
export declare const presetScenarios: PresetScenario[];
export declare const taxonomyLevels: {
    key: string;
    label: string;
    color: string;
}[];
interface SpeciesPreset {
    name: string;
    latinName: string;
    taxonomy: Record<string, string>;
    features: Array<{
        name: string;
        value: number;
        category: string;
    }>;
    parentId?: string;
}
interface ScenarioData {
    species: SpeciesPreset[];
    hasMissingData?: boolean;
    longBranchMultiplier?: number;
    polyphyleticForce?: boolean;
    circularDependency?: boolean;
    speciesGroups?: Map<string, string[]>;
}
export declare function getScenarioData(scenarioId: string): ScenarioData;
export declare function loadScenarioToDatabase(scenarioId: string): {
    species: Array<{
        id: number;
        name: string;
        latinName: string;
        taxonomy: Record<string, string>;
    }>;
    characteristics: Array<{
        species_id: number;
        feature_name: string;
        feature_value: number;
    }>;
    hasMissingData: boolean;
    longBranchMultiplier: number;
    polyphyleticForce: boolean;
    circularDependency: boolean;
    speciesGroups: Map<string, string[]>;
};
export {};
//# sourceMappingURL=scenarios.d.ts.map