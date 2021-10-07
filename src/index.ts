/* eslint-disable import/first */
require('dotenv').config();
import { Deconz } from './lib/deconz';
import { Ha } from './lib/ha';

(async() => {
    if(
        !process?.env?.DECONZ_KEY &&
        !process?.env?.DECONZ_IP &&
        !process?.env?.MQTT_HOST &&
        !process?.env?.MQTT_USER &&
        !process?.env?.MQTT_PW &&
        !process?.env?.rooms
    ) throw "No config set (ENV missing)"

    const deconz = new Deconz();
    deconz.eventSync();
    new Ha(deconz.changeEvent);
})();