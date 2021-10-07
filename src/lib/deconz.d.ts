export interface deCONZEvent {
    attr: {
        id: string;
        lastannounced: Date;
        lastseen: Date;
        manufacturername: string;
        modelid: string;
        name: string;
        swversion: string;
        type: string;
        uniqueid: string;
    }
    e: string;
    id: number;
    r: string;
    t: string;
    uniqueid: string;
}

export interface Room {
    thermostats: Array<number>;
    windows: Array<number>;
    sensor: number;
}