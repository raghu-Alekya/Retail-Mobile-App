export interface AppAssets {
  base_url: string;
  currency: string;
  currency_symbol: string;
  taxes: Tax[];
  roles: Role[];
  coupons: any[];
  vendors: Vendor[];
  order_types: OrderType[];
  notes_denom: Denom[];
  coin_denom: Denom[];
  safe_denom: Denom[];
  tubes_denom: TubeDenom[];
  store_details: StoreDetails;
}

export interface Tax {
  slug: string;
  name: string;
}

export interface Role {
  slug: string;
  name: string;
}

export interface Vendor {
  id: number;
  vendor_name: string;
}

export interface OrderType {
  slug: string;
  name: string;
}

export interface Denom {
  denom: string;
  image: string;
}

export interface TubeDenom {
  denom: number;
  tube_limit: number;
  symbol: string;
}

export interface StoreDetails {
  name: string;
  address: string;
  city: string;
}
