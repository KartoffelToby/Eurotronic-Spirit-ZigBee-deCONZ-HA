export interface Thermostat {
    mode: string;
    temperature: number;
    set_temperature: number;
    name: string;
    max_temp: number;
    min_temp: number;
    unique_id: string;
}