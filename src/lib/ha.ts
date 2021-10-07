import { Thermostat } from './ha.d';
import mqtt, { MqttClient } from 'mqtt';
import { Deconz } from './deconz';
import { Observable } from 'rxjs';

export class Ha {

  private client!: MqttClient;
  private thermostats!: Array<Thermostat>;

  constructor (event: Observable<any>) {
    const rooms = JSON.parse(<string>process.env.rooms?.toString());
    Promise.all(Object.keys(rooms).map(async (name:string) => {
      return {
        name,
        max_temp: 30,
        min_temp: 5,
        mode: await new Deconz().getMode(name),
        temperature: await new Deconz().getTemperature(name),
        set_temperature: await new Deconz().getSetTemperature(name),
        unique_id: name
      }
    })).then((climate) => {
      this.thermostats = climate
      this.client = mqtt.connect(`mqtt://${process.env.MQTT_HOST}`, {
        username: process.env.MQTT_USER,
        password: process.env.MQTT_PW,
        port: 1883
      });
  
  
      this.client.on('connect', async () => {
        console.log("connected");
        await Promise.all(this.thermostats.map((thermostat: Thermostat) => {
          this.client.subscribe(`ac/${thermostat.name}/action/set`);
          this.client.subscribe(`ac/${thermostat.name}/mode/set`);
          this.client.subscribe(`ac/${thermostat.name}/temperature/set`);
          this.client.subscribe(`ac/${thermostat.name}/settemperature/set`);

          this.client.publish(`ac/${thermostat.name}/mode/set`,thermostat.mode);
          this.client.publish(`ac/${thermostat.name}/temperature/set`,(thermostat.temperature / 100).toFixed(2).toString());
          this.client.publish(`ac/${thermostat.name}/settemperature/set`,(thermostat.set_temperature / 100).toFixed(2).toString());
        }));

        event.subscribe((update) => {
          const roomName = Object.keys(rooms).find(key => rooms[key] === Object.values(rooms).find((room:any) => room.sensor === update.sensor))
          if(update?.temperature) this.client.publish(`ac/${roomName}/temperature/set`,(update.temperature / 100).toFixed(2).toString());
          if(update?.set_temperature) this.client.publish(`ac/${roomName}/settemperature/set`,(update.set_temperature / 100).toFixed(2).toString());            
          if(update?.mode) this.client.publish(`ac/${roomName}/mode/set`,update.mode);
        })
      })
  
      this.client.on('message', async (topic, message) => {
        // message is Buffer
        console.info({topic,message: message.toString()})
        switch (topic.split('/')[2]) {
          case 'settemperature':
            new Deconz().setTemperature(topic.split('/')[1].split('/')[0],parseInt(message.toString()) * 100)
            break;
        
          default:
            break;
        }
  
      })
    
    
    }).catch((err) => console.error(err));
  }
}