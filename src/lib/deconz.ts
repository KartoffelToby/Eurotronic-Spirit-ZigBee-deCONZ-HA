import { Room, deCONZEvent } from './deconz.d';
import axios, { AxiosResponse } from 'axios';
import WebSocket from 'ws';
import { webSocket } from 'rxjs/webSocket';
import { Subject } from 'rxjs';




export class Deconz {
    private ws!: Subject<deCONZEvent>;

    private rooms:Array<Room>;
    private validSensors: Array<number>;

    public changeEvent!: Subject<any>;

    readonly deviceTypes: Array<string> = ['ZHAThermostat','ZHAOpenClose','ZHATemperature']
    
    constructor() {
        this.rooms = JSON.parse(<string>process.env.rooms?.toString());
        this.validSensors = Object.values(this.rooms).map((room:Room) => {
            const mergedSensors = [...room.thermostats,...room.windows,room.sensor];
            return mergedSensors.flat(2);
        }).flat(2);
    }

    public eventSync(): void {
        console.info("init");

        this.changeEvent = new Subject();

        this.ws = webSocket({
            url: `ws://${process.env.DECONZ_IP}:8088`,
            WebSocketCtor: <any> WebSocket
        });
        this.ws.subscribe(async(event:deCONZEvent) => {
            if(this.validSensors.includes((parseInt(event?.attr?.id) || parseInt(event?.id.toString())))) {
                await this.checkWindowState(event);
                await this.syncThermostatTemperature(event);
                await this.syncThermostatHA(event);
            }
        });
    }

    private async syncThermostatHA(e: deCONZEvent): Promise<void> {
        const eventID = e?.id?.toString() || e?.attr?.id.toString()
        const room = (Object.values(this.rooms).find((room:Room) => room.thermostats.includes(parseInt(eventID)))) || false;
        if(room && e?.attr) {
            setTimeout(async () => {
                const thermostatStateOne = await this.getDevice(e.id);
                await Promise.all(room.thermostats.map(async (thermostat:number) => {
                    const thermostatState = await this.getDevice(thermostat);
                    await this.setConfig(thermostatState.id,{heatsetpoint: thermostatStateOne.config.heatsetpoint});
                    this.changeEvent.next({sensor: room.sensor, set_temperature: thermostatStateOne.config.heatsetpoint, mode: (thermostatState.state.valve !== 0) ? 'heat': 'off'})
                }));
            },10000);
        }
    }

    private async syncThermostatTemperature(e: deCONZEvent): Promise<void> {
        const eventID = e?.id?.toString() || e?.attr?.id.toString()
        const room = (Object.values(this.rooms).find((room:Room) => room.sensor === parseInt(eventID))) || false;
        if(room) {
            await Promise.all(room.thermostats.map(async (thermostat:number) => {
                const thermostatState = await this.getDevice(thermostat);
                const temperatureState = await this.getDevice(parseInt(e.id.toString()));
    
                const currentThermostatTemp = thermostatState.state.temperature;
                const currentTempSensorTemp = temperatureState.state.temperature
                const currentThemostatOffset = thermostatState.config.offset;
    
                const offset = Math.round(parseInt(currentTempSensorTemp) - (parseInt(currentThermostatTemp) - parseInt(currentThemostatOffset)));          
    
                console.info(`Sync offset ${thermostatState.id} to ${offset} for temp ${currentTempSensorTemp} from ${currentThermostatTemp}`);

                await this.setConfig(thermostatState.id,{offset});
                console.log(thermostatState.config.heatsetpoint);
                this.changeEvent.next({sensor: room.sensor, temperature: currentTempSensorTemp})
            }));
        }
    }

    private async checkWindowState(e: deCONZEvent): Promise<void> {
        const eventID = e?.id?.toString() || e?.attr?.id.toString()
        const room = Object.values(this.rooms).find((room:Room) => room.windows.includes((parseInt(eventID)))) || false;
        if(room) {
            const windowState = await Promise.all(room.windows.map(async (window:number) => {
                const { state } = await this.getDevice(window);
                return state.open;
            }));
            if(windowState.includes(true)) {
                room.thermostats.forEach(async(thermostat:number) => {
                    console.info(`Change ${thermostat} to off`)
                    await this.setConfig(thermostat,{mode: 'off'});
                });
                this.changeEvent.next({sensor: room.sensor, mode: 'off'})
            } else {
                room.thermostats.forEach(async(thermostat:number) => {
                    console.info(`Change ${thermostat} to on`)
                    await this.setConfig(thermostat,{mode: 'auto'});
                });
                this.changeEvent.next({sensor: room.sensor, mode: 'heat'})
            }
        }
    }

    public async getTemperature(room:any): Promise<number> {
        const { state } = await this.getDevice(this.rooms[room].sensor);
        return state.temperature;
    }

    public async getSetTemperature(room:any): Promise<number> {
        const { config } = await this.getDevice(this.rooms[room].thermostats[0]);
        return config.heatsetpoint;
    }

    public async getMode(room:any): Promise<string> {
        const { state } = await this.getDevice(this.rooms[room].thermostats[0]);
        return (state.valve === 0) ? 'off' : 'heat';
    }

    public async setTemperature(room:any,temperature:number): Promise<boolean> {
        this.rooms[room].thermostats.forEach((themostat:number) => this.setConfig(themostat,{heatsetpoint: temperature}));
        return true;
    }

    private async setConfig(id:number, config:any) {
        try {
            await axios.put(`http://${process.env.DECONZ_IP}/api/${process.env.DECONZ_KEY}/sensors/${id}/config`,config);
        } catch(e) {
        }
    }

    private async getDevice(id: number): Promise<any> {
        try {
            const { data }: AxiosResponse = await axios.get(`http://${process.env.DECONZ_IP}/api/${process.env.DECONZ_KEY}/sensors/${id}`);
            return data;
        } catch(e) {
        }
    }
}