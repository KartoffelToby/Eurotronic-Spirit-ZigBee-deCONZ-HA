# Eurotronic Spirit ZigBee deCONZ HA

If you want to controll your Spirit-Thermostats with an external temperature sensor and window open detection it's currently not out of the box possible with the default behavior of the Euronics Spirit ZigBee thermostats in combination with deCONZ and HA.


Here comes the drop in solution, this script takes the WS Events from deCONZ and adjust the offset of the thermostats to match the room temperature with the messurements of the external themperatur sensor e.g. XIAOMI Sensor. It also switch the mode to "off" if one window in the room are open (with Open/Close window/door Sensor) and back to auto if all windows are closed.

This complete packed are published via MQTT to HA as an climate instance, so you can set the target temperature and see if the thermostat valve are actually open and heating.

Docker Image: kartoffeltoby/thermostat-deconz-ha

## Config

Create a .env file from .env_template or setup ENV via Docker

***How to setup rooms***

```
{
    "Room Name": { // The name of the climate.
        "thermostats": [1,2] // deCONZ IDs of Eurotronic Spirit ZigBee devices.
        "windows": [3,4] // deCONZ IDs of window/door sensor devices.
        "sensor": 5 // deCONZ ID of the external room themperature senosr (Only one supported!)
    },
    "XXX": {
        ...
    }
}
```

## Alternative possibilities: 

### deCONZ - HA [Via Automations](https://github.com/KartoffelToby/Home-Assistant-Setup)

### ZigBee2MQTT - HA [Via HACS - Coming Soon](#)
