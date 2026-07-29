export const editableMasterResources = ["commodities", "categories", "units"] as const;
export type EditableMasterResource = (typeof editableMasterResources)[number];

export interface MasterOption {
  readonly id: string;
  readonly label: string;
}

export interface MasterRecord {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly scientificName?: string | null;
  readonly symbol?: string | null;
  readonly parentId?: string;
  readonly parentName?: string;
  readonly isActive: boolean;
  readonly updatedAt: string;
}

export interface MasterDataPayload {
  readonly records: readonly MasterRecord[];
  readonly options: {
    readonly commodities: readonly MasterOption[];
    readonly categories: readonly MasterOption[];
    readonly units: readonly MasterOption[];
  };
}

export function isEditableMasterResource(value: string): value is EditableMasterResource {
  return editableMasterResources.some((resource) => resource === value);
}
