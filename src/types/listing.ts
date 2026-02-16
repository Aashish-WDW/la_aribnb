export type ListingType = 'PROPERTY' | 'ROOM';

export interface Listing {
    id: string;
    name: string;
    description?: string;
    type: ListingType;
    propertyId: string; // The "Parent" property ID. For type='PROPERTY', this is the same as id.
    roomId?: string; // Only present for type='ROOM'.
    basePrice?: number;
    metadata?: Record<string, any>;
}
