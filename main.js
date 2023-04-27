"use strict";

/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const axios = require("axios").default;

// Load your modules here, e.g.:
// const fs = require("fs");

class VZug extends utils.Adapter {
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: "v-zug",
        });
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        this.on("unload", this.onUnload.bind(this));
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here

        // Reset the connection indicator during startup
        this.setState("info.connection", false, true);
        if (this.config.interval < 0.5) {
            this.log.info("Set interval to minimum 0.5");
            this.config.interval = 0.5;
        }

        this.updateInterval = null;

        // Get info on start
        await this.getAPIVersion();
        await this.getDeviceStatus();

        // Interval
        this.updateInterval = setInterval(async () => {
            await this.getDeviceStatus();
        }, this.config.interval * 60 * 1000);
    }

    async getAPIVersion() {
        const apiVersion = `http://${this.config.deviceIp}/ai?command=getAPIVersion`;
        try {
            const axiosReponse = await axios.get(apiVersion);
            if (axiosReponse.status === 200) {
                this.setState("info.connection", true, true);
                const data = axiosReponse.data;
                this.log.info("api Version: " + data.value);

                await this.setObjectNotExistsAsync("info.apiVersion", {
                    type: "state",
                    common: {
                        type: "string",
                        role: "state",
                        read: true,
                        write: false,
                        name: "Api Version",
                    },
                    native: {},
                });

                //now set the value of the state. Set 'ack' to true in order to show ioBroker that this data comes from the 'device'.
                await this.setStateAsync("info.apiVersion", data.value, true);
            } else {
                this.log.error(`Could not retrieve data form device, status code ${axiosReponse.status}`);
            }
        } catch (e) {
            this.log.error("Could not retrieve data: " + e.message);
        }
    }

    async getDeviceStatus() {
        const deviceStatus = `http://${this.config.deviceIp}/ai?command=getDeviceStatus`;
        this.log.info("url: " + deviceStatus);
        try {
            const axiosReponse = await axios.get(deviceStatus);
            if (axiosReponse.status === 200) {
                const data = axiosReponse.data;

                //create folder, ID should always be unique and constant for a certain device.
                await this.setObjectNotExistsAsync("device", {
                    type: "channel",
                    common: {
                        name: "Gerät",
                    },
                    native: {},
                });

                await this.setObjectNotExistsAsync("device.DeviceName", {
                    type: "state",
                    common: {
                        type: "string",
                        role: "value",
                        read: true,
                        write: false,
                        name: "Geräte Name",
                    },
                    native: {},
                });

                await this.setObjectNotExistsAsync("device.Serial", {
                    type: "state",
                    common: {
                        type: "string",
                        role: "value",
                        read: true,
                        write: false,
                        name: "Serienummer",
                    },
                    native: {},
                });

                await this.setObjectNotExistsAsync("device.Inactive", {
                    type: "state",
                    common: {
                        type: "string",
                        role: "state",
                        read: true,
                        write: false,
                        name: "Ausgeschaltet",
                    },
                    native: {},
                });

                await this.setObjectNotExistsAsync("device.Program", {
                    type: "state",
                    common: {
                        type: "string",
                        role: "value",
                        read: true,
                        write: false,
                        name: "Programm",
                    },
                    native: {},
                });

                await this.setObjectNotExistsAsync("device.Status", {
                    type: "state",
                    common: {
                        type: "string",
                        role: "state",
                        read: true,
                        write: false,
                        name: "Status",
                    },
                    native: {},
                });

                //now set the value of the states. Set 'ack' to true in order to show ioBroker that this data comes from the 'device'.
                await this.setStateAsync("device.DeviceName", data.DeviceName, true);
                await this.setStateAsync("device.Serial", data.Serial, true);
                await this.setStateAsync("device.Inactive", data.Inactive, true);
                await this.setStateAsync("device.Program", data.Program, true);
                await this.setStateAsync("device.Status", data.Status, true);

                //this.log.info(data.ProgramEnd.EndType);
            } else {
                this.log.error("Could not retrieve data form device, status code " + axiosReponse.status);
            }
        } catch (e) {
            this.log.error("Could not retrieve data: " + e.message);
        }
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            this.updateInterval && clearInterval(this.updateInterval);
            callback();
        } catch (e) {
            callback();
        }
    }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new VZug(options);
} else {
    // otherwise start the instance directly
    new VZug();
}
