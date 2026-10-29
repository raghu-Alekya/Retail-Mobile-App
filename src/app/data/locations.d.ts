export interface StateData {
  name: string;
  cities: string[];
}

export interface CountryData {
  name: string;
  code?: string;
  states: StateData[];
}

export declare const LOCATIONS: CountryData[];
export default LOCATIONS;
